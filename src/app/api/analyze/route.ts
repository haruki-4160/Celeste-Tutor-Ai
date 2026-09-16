import { GoogleGenAI, Type, Schema } from '@google/genai';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// The client will be initialized inside the POST handler

// Define the exact JSON structure we want Gemini to return
const rateLimitMap = new Map<string, { count: number, timestamp: number }>();

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    tutorAnalysis: { type: Type.STRING, description: "Your internal scratchpad to solve the problem step-by-step yourself FIRST." },
    tutorMessage: { type: Type.STRING, description: "Your direct, conversational reply to the student. If they are correct, congratulate them and explain why. If they made a mistake, gently point out where the logic went wrong (without giving the answer). This is what the user will see." },
    errorFound: { type: Type.BOOLEAN },
    errorIndex: { type: Type.INTEGER, description: "0-indexed array position of the flawed step. -1 if no error." },
    errorCategory: { type: Type.STRING, description: "e.g., Formula Selection, Arithmetic, Conceptual" },
    steps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          stepNumber: { type: Type.INTEGER },
          text: { type: Type.STRING },
          isCorrect: { type: Type.BOOLEAN },
          explanation: { type: Type.STRING }
        },
        required: ["stepNumber", "text", "isCorrect", "explanation"]
      }
    },
    hints: {
      type: Type.ARRAY,
      description: "Array of exactly 2 hints. First is gentle, second is more direct.",
      items: { type: Type.STRING }
    }
  },
  required: ["tutorAnalysis", "tutorMessage", "errorFound", "steps", "hints"]
};

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const now = Date.now();
  const rateLimitWindow = 60000; // 1 minute
  
  // Clean up old entries periodically
  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now - val.timestamp > rateLimitWindow) {
        rateLimitMap.delete(key);
      }
    }
  }

  const record = rateLimitMap.get(ip) ?? { count: 0, timestamp: now };
  if (now - record.timestamp > rateLimitWindow) {
    record.count = 1;
    record.timestamp = now;
  } else {
    record.count++;
  }
  rateLimitMap.set(ip, record);

  if (record.count > 5) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const { question, studentWorking, image, attachment, questionAttachment, workingAttachment, notebookContext, chatFollowUp } = body;

    const finalMedia = notebookContext ? null : (workingAttachment?.dataUrl || questionAttachment?.dataUrl || attachment?.dataUrl || image);
    const hasAttachments = Boolean(questionAttachment || workingAttachment || finalMedia);
    const isPdf = !notebookContext && Boolean(
      (questionAttachment?.type === 'application/pdf') || 
      (workingAttachment?.type === 'application/pdf') || 
      (attachment?.type === 'application/pdf') || 
      (typeof finalMedia === 'string' && finalMedia.startsWith('data:application/pdf'))
    );
    const pdfFilename = questionAttachment?.name || workingAttachment?.name || attachment?.name || 'document.pdf';

    // 2. Input Validation: Ensure data exists and is the correct type
    if (!question || typeof question !== 'string' || (!studentWorking && !hasAttachments && !notebookContext && !chatFollowUp)) {
      return NextResponse.json({ error: "Invalid input. Question and student working, attachment, or notebook context are required." }, { status: 400 });
    }

    // 3. Security: Enforce length limits to prevent abuse (e.g., sending massive text payloads)
    if (question.length > 2000 || (studentWorking && studentWorking.length > 5000) || (chatFollowUp && chatFollowUp.length > 2000)) {
      return NextResponse.json({ error: "Input exceeds maximum allowed length." }, { status: 413 });
    }
    if (finalMedia && typeof finalMedia === 'string' && finalMedia.length > 15000000) {
      return NextResponse.json({ error: "Attachment payload too large. Maximum size is ~10MB." }, { status: 413 });
    }

    let promptText = `You are an expert Socratic physics and math tutor named Celeste Tutor Ai. 
Your task is to carefully analyze the student's working (provided as text or an image) for the given question.

CRITICAL: Before looking at the student's working, you MUST solve the problem yourself step-by-step in the "tutorAnalysis" field. Calculate the correct formula and final answer. 
Then, and only then, compare your correct solution to the student's working.

- If there is ANY mistake in the student's working (e.g. wrong formula, wrong arithmetic like 40/5=6 instead of 8, or conceptual error), set "errorFound" to true.
- If the entire working and final answer are 100% correct, set "errorFound" to false.

If there is an error:
1. Identify the EXACT step where the reasoning or math first failed. Set "errorIndex" to the 0-based index of this step in your "steps" array.
2. Reconstruct their working step by step in the "steps" array. Set "isCorrect" to false for the flawed step.
3. Classify the error in "errorCategory" (e.g., Formula Selection, Arithmetic, Conceptual).
4. Write a gentle conversational reply in "tutorMessage" pointing out the specific part of their working that is flawed, WITHOUT giving them the correct answer.
5. Provide 2 progressive hints in "hints" (Hint 1: Gentle, Hint 2: Strong) that guide the student to realize their mistake.

If the working is completely correct:
1. Set "errorFound" to false.
2. Set "errorIndex" to -1.
3. Reconstruct their steps in the "steps" array (all "isCorrect": true).
4. Write an enthusiastic congratulatory reply in "tutorMessage" praising their logic.
5. Provide generic encouraging hints or leave "hints" empty.

Question: ${question}

${notebookContext ? `[Digitized Notes Context]:\n${notebookContext}\n\n` : ""}Student Working / Question Details:
${studentWorking || (notebookContext ? "[Discussing the digitized notes above]" : "[See attached image]")}`;

    if (chatFollowUp && typeof chatFollowUp === 'string' && chatFollowUp.trim()) {
      promptText += `\n\nStudent Follow-up Question in Chat: "${chatFollowUp.trim()}"\nThe student has asked a follow-up question. Specifically answer their question in your tutorMessage while guiding them Socratic-style without simply solving it for them.`;
    }

    promptText += `\n\nIMPORTANT: You MUST return a valid JSON object matching the requested schema.`;

    const grokPrompt = promptText + `\n\nYou MUST return ONLY valid JSON matching this schema: 
    {
      "tutorAnalysis": "string",
      "tutorMessage": "string",
      "errorFound": boolean,
      "errorIndex": number,
      "errorCategory": "string",
      "steps": [{"stepNumber": number, "text": "string", "isCorrect": boolean, "explanation": "string"}],
      "hints": ["string", "string"]
    }`;

    // A helper function to call Groq (or OpenAI-compatible APIs)
    const callOpenAICompatibleAPI = async (apiUrl: string, apiKey: string, modelName: string, includeImage: boolean = true): Promise<any> => {
      try {
        const messages: any[] = [{ role: "system", content: "You are a helpful tutor that outputs ONLY valid JSON." }];
        
        if (finalMedia && !isPdf && includeImage) {
          messages.push({
            role: "user",
            content: [
              { type: "text", text: grokPrompt },
              { type: "image_url", image_url: { url: finalMedia } }
            ]
          });
        } else {
          let textContent = grokPrompt;
          if (isPdf) {
            textContent += `\n\n[Note: Student attached a PDF file: ${pdfFilename}]`;
          } else if (finalMedia && !includeImage) {
            textContent += `\n\n[Note: Student attached image/working: ${workingAttachment?.name || questionAttachment?.name || attachment?.name || 'attached image'}]`;
          }
          messages.push({ role: "user", content: textContent });
        }

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: modelName,
            messages: messages,
            temperature: 0.2,
            response_format: { type: "json_object" }
          }),
          signal: AbortSignal.timeout(15000)
        });

        if (!response.ok) {
          const errText = await response.text();
          // If vision failed or model was decommissioned, and we were trying vision, fall back to text-only model
          if (includeImage && finalMedia && !isPdf) {
            console.warn(`Vision model ${modelName} failed (${response.status}), falling back to text-only:`, errText);
            return await callOpenAICompatibleAPI(apiUrl, apiKey, "llama-3.3-70b-versatile", false);
          }
          // If model was decommissioned or not found on Groq, fallback to active Groq model
          if ((errText.includes("model_not_found") || errText.includes("decommissioned") || response.status === 404) && modelName !== "openai/gpt-oss-120b") {
            console.warn(`Model ${modelName} not found on Groq, falling back to openai/gpt-oss-120b:`, errText);
            return await callOpenAICompatibleAPI(apiUrl, apiKey, "openai/gpt-oss-120b", false);
          }
          throw new Error(`API Error: ${errText}`);
        }

        const data = await response.json();
        let rawContent = data.choices[0]?.message?.content || "{}";
        if (typeof rawContent === 'string') {
          rawContent = rawContent.trim();
          if (rawContent.startsWith('```json')) {
            rawContent = rawContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (rawContent.startsWith('```')) {
            rawContent = rawContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
        }
        return JSON.parse(rawContent);
      } catch (err: any) {
        if (includeImage && finalMedia && !isPdf && !err?.name?.includes("AbortError")) {
          console.warn(`Error with vision model ${modelName}, retrying with text fallback:`, err?.message || err);
          return await callOpenAICompatibleAPI(apiUrl, apiKey, "llama-3.3-70b-versatile", false);
        }
        if ((err?.message?.includes("model_not_found") || err?.message?.includes("decommissioned")) && modelName !== "openai/gpt-oss-120b") {
          return await callOpenAICompatibleAPI(apiUrl, apiKey, "openai/gpt-oss-120b", false);
        }
        throw err;
      }
    };

    let resultJson = null;
    let errors: string[] = [];

    // --- PRIORITY 1: GEMINI ---
    try {
      if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API key missing");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const contents: any[] = [{ text: promptText }];
      
      if (questionAttachment?.dataUrl) {
        const mimeType = questionAttachment.type || (questionAttachment.dataUrl.startsWith('data:') ? questionAttachment.dataUrl.split(';')[0].split(':')[1] : null) || (questionAttachment.name?.endsWith('.pdf') ? 'application/pdf' : 'image/png');
        const base64Data = questionAttachment.dataUrl.includes(',') ? questionAttachment.dataUrl.split(',')[1] : questionAttachment.dataUrl;
        contents.push({ text: `[Question Document / Image: ${questionAttachment.name || 'Question Document'}]` });
        contents.push({ inlineData: { data: base64Data, mimeType } });
      }
      if (workingAttachment?.dataUrl) {
        const mimeType = workingAttachment.type || (workingAttachment.dataUrl.startsWith('data:') ? workingAttachment.dataUrl.split(';')[0].split(':')[1] : null) || (workingAttachment.name?.endsWith('.pdf') ? 'application/pdf' : 'image/png');
        const base64Data = workingAttachment.dataUrl.includes(',') ? workingAttachment.dataUrl.split(',')[1] : workingAttachment.dataUrl;
        contents.push({ text: `[Student Working Document / Image: ${workingAttachment.name || 'Student Working'}]` });
        contents.push({ inlineData: { data: base64Data, mimeType } });
      }
      if (!questionAttachment && !workingAttachment && finalMedia) {
        const mimeType = (typeof finalMedia === 'string' && finalMedia.startsWith('data:')) ? finalMedia.split(';')[0].split(':')[1] : (isPdf ? 'application/pdf' : 'image/png');
        const base64Data = (typeof finalMedia === 'string' && finalMedia.includes(',')) ? finalMedia.split(',')[1] : finalMedia;
        contents.push({ text: `[Attached Document / Image]` });
        contents.push({ inlineData: { data: base64Data, mimeType } });
      }

      let response;
      try {
        response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
                temperature: 0.2
            }
        });
      } catch (gemini25Err: any) {
        if (gemini25Err?.status === 404 || gemini25Err?.message?.includes('no longer available')) {
          console.warn("gemini-2.5-flash unavailable, trying gemini-3.6-flash:", gemini25Err.message);
          response = await ai.models.generateContent({
              model: 'gemini-3.6-flash',
              contents: contents,
              config: {
                  responseMimeType: 'application/json',
                  responseSchema: responseSchema,
                  temperature: 0.2
              }
          });
        } else {
          throw gemini25Err;
        }
      }
      resultJson = JSON.parse(response.text || "{}");
      return NextResponse.json(resultJson);
    } catch (geminiError: any) {
      console.error("Priority 1 (Gemini) failed:", geminiError);
      errors.push(`Gemini: ${geminiError?.message || geminiError}`);
    }

    // --- PRIORITY 2: GROQ (PRIORITY KEY) ---
    try {
      if (process.env.GROQ_API_KEY_PRIORITY) {
         const model = (finalMedia && !isPdf) ? "llama-3.2-90b-vision-preview" : "llama-3.3-70b-versatile";
         resultJson = await callOpenAICompatibleAPI("https://api.groq.com/openai/v1/chat/completions", process.env.GROQ_API_KEY_PRIORITY, model);
         return NextResponse.json(resultJson);
      }
    } catch (groqPriorityError: any) {
      console.error("Priority 2 (Groq Priority) failed:", groqPriorityError);
      errors.push(`GroqPriority: ${groqPriorityError?.message || groqPriorityError}`);
    }

    // --- PRIORITY 3: GROQ (LAST FALLBACK KEY) ---
    try {
      if (process.env.GROQ_API_KEY_FALLBACK) {
        const model = (finalMedia && !isPdf) ? "llama-3.2-90b-vision-preview" : "llama-3.3-70b-versatile";
        resultJson = await callOpenAICompatibleAPI("https://api.groq.com/openai/v1/chat/completions", process.env.GROQ_API_KEY_FALLBACK, model);
        return NextResponse.json(resultJson);
      }
    } catch (groqFallbackError: any) {
      console.error("Last Fallback (Groq Fallback) failed:", groqFallbackError);
      errors.push(`GroqFallback: ${groqFallbackError?.message || groqFallbackError}`);
    }

    // If all fallbacks failed
    return NextResponse.json({ error: "All AI providers failed. Errors: " + errors.join(" | ") }, { status: 500 });
    
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze reasoning" }, { status: 500 });
  }
}
