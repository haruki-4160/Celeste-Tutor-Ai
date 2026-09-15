import { GoogleGenAI, Type, Schema } from '@google/genai';
import { NextResponse } from 'next/server';

// The client will be initialized inside the POST handler

// Define the exact JSON structure we want Gemini to return
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
  try {
    const body = await req.json();
    const { question, studentWorking, image } = body;

    // 2. Input Validation: Ensure data exists and is the correct type
    if (!question || typeof question !== 'string' || (!studentWorking && !image)) {
      return NextResponse.json({ error: "Invalid input. Question and student working or image are required." }, { status: 400 });
    }

    // 3. Security: Enforce length limits to prevent abuse (e.g., sending massive text payloads)
    if (question.length > 1000 || (studentWorking && studentWorking.length > 5000)) {
      return NextResponse.json({ error: "Input exceeds maximum allowed length." }, { status: 413 });
    }

    const promptText = `You are an expert Socratic physics and math tutor named Celeste Tutor Ai. 
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

Student Working:
${studentWorking || "[See attached image]"}

IMPORTANT: You MUST return a valid JSON object matching the requested schema.`;

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
    const callOpenAICompatibleAPI = async (apiUrl: string, apiKey: string, modelName: string) => {
      const messages: any[] = [{ role: "system", content: "You are a helpful tutor that outputs ONLY valid JSON." }];
      if (image) {
        messages.push({
          role: "user",
          content: [
            { type: "text", text: grokPrompt },
            { type: "image_url", image_url: { url: image } }
          ]
        });
      } else {
        messages.push({ role: "user", content: grokPrompt });
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
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${await response.text()}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    };

    let resultJson = null;
    let errors: string[] = [];

    // --- PRIORITY 1: GEMINI ---
    try {
      if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API key missing");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const contents: any[] = [promptText];
      
      if (image) {
        const mimeType = image.split(';')[0].split(':')[1];
        const base64Data = image.split(',')[1];
        contents.push({ inlineData: { data: base64Data, mimeType } });
      }

      const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: contents,
          config: {
              responseMimeType: 'application/json',
              responseSchema: responseSchema,
              temperature: 0.2
          }
      });
      resultJson = JSON.parse(response.text || "{}");
      return NextResponse.json(resultJson);
    } catch (geminiError: any) {
      console.error("Priority 1 (Gemini) failed:", geminiError);
      errors.push(`Gemini: ${geminiError?.message || geminiError}`);
    }

    // --- PRIORITY 2: GROQ (PRIORITY KEY) ---
    try {
      if (process.env.GROQ_API_KEY_PRIORITY) {
         const model = image ? "llama-3.2-90b-vision-preview" : "llama-3.3-70b-versatile";
         resultJson = await callOpenAICompatibleAPI("https://api.groq.com/openai/v1/chat/completions", process.env.GROQ_API_KEY_PRIORITY, model);
         return NextResponse.json(resultJson);
      }
    } catch (groqPriorityError: any) {
      console.error("Priority 2 (Groq Priority) failed:", groqPriorityError);
      errors.push(`GroqPriority: ${groqPriorityError?.message || groqPriorityError}`);
    }

    // --- PRIORITY 3: GROQ (LAST FALLBACK KEY) ---
    try {
      if (!process.env.GROQ_API_KEY_FALLBACK) throw new Error("Groq API key missing");
      const model = image ? "llama-3.2-90b-vision-preview" : "llama-3.3-70b-versatile";
      resultJson = await callOpenAICompatibleAPI("https://api.groq.com/openai/v1/chat/completions", process.env.GROQ_API_KEY_FALLBACK, model);
      return NextResponse.json(resultJson);
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
