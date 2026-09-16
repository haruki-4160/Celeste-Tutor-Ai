import { GoogleGenAI, Type, Schema } from '@google/genai';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

const notebookResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A concise, engaging title for these notes, e.g. 'Kinematics: Projectile Motion & Trajectory'" },
    topic: { type: Type.STRING, description: "Academic subject and subtopic, e.g. 'Physics / Classical Mechanics'" },
    transcription: { 
      type: Type.STRING, 
      description: "Full, clean transcription of the handwritten notes or document into formatted Markdown. All equations MUST be formatted using standard LaTeX ($...$ for inline math, $$...$$ for display block equations). Fix typos and improve legibility while preserving original meaning." 
    },
    clarifications: {
      type: Type.ARRAY,
      description: "List of deciphered handwritten shorthand, ambiguous symbols, or skipped algebra steps made clear for the student.",
      items: {
        type: Type.OBJECT,
        properties: {
          originalTextOrSymbol: { type: Type.STRING, description: "The handwritten scribble or shorthand (e.g. 'a=g=-9.8' or 'p.e. at top')" },
          meaning: { type: Type.STRING, description: "The clear explanation (e.g. 'Acceleration is set to gravity acting downwards (-9.8 m/s²)')" }
        },
        required: ["originalTextOrSymbol", "meaning"]
      }
    },
    explanation: {
      type: Type.STRING,
      description: "A friendly, comprehensive conceptual explanation of what these notes are teaching, written in clear student-friendly prose."
    },
    studyNotes: {
      type: Type.OBJECT,
      properties: {
        keyTakeaways: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Bullet points of the core rules, principles, and concepts students must remember."
        },
        formulas: {
          type: Type.ARRAY,
          description: "List of key mathematical/scientific formulas identified in the notes.",
          items: {
            type: Type.OBJECT,
            properties: {
              formula: { type: Type.STRING, description: "LaTeX formula, e.g. '$$E_k = \\frac{1}{2}mv^2$$'" },
              meaning: { type: Type.STRING, description: "Explanation of variables and what the formula calculates." }
            },
            required: ["formula", "meaning"]
          }
        },
        cheatSheetSummary: {
          type: Type.STRING,
          description: "A compact, high-yield exam cheat sheet summarizing the most critical points."
        }
      },
      required: ["keyTakeaways", "formulas", "cheatSheetSummary"]
    },
    suggestedQuestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3 thoughtful, probing questions the student can ask Celeste in the chat to test or deepen their grasp."
    }
  },
  required: ["title", "topic", "transcription", "clarifications", "explanation", "studyNotes", "suggestedQuestions"]
};

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const now = Date.now();
  const rateLimitWindow = 60000; // 1 minute

  // Clean up old entries periodically to prevent memory leaks
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

  if (record.count > 10) {
    return NextResponse.json({ error: "Rate limit exceeded. Please wait a minute before processing more notes." }, { status: 429 });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const { fileData, mimeType, filename, extractedText } = body;

    if (!fileData && !extractedText) {
      return NextResponse.json({ error: "Missing document content or image data." }, { status: 400 });
    }

    if (fileData && typeof fileData === 'string' && fileData.length > 20000000) {
      return NextResponse.json({ error: "File payload too large. Maximum size is ~15MB." }, { status: 413 });
    }

    const isPdf = mimeType === 'application/pdf' || (typeof fileData === 'string' && fileData.startsWith('data:application/pdf'));

    const promptInstructions = `You are Celeste NotebookLM, an expert academic synthesizer and patient tutor.
The user has provided a scanned handwritten note or attachment (${filename || 'Document'}).

YOUR MISSION:
1. Carefully inspect the document/handwritten notes.
2. Accurately transcribe all handwritten text, equations, and diagrams into clean Markdown and standard LaTeX ($...$ and $$...$$).
3. Decipher messy handwriting, shorthand notation, and omitted mathematical steps. Clarify what they mean in "clarifications".
4. Provide a clear, understandable conceptual explanation of the material in "explanation".
5. Synthesize high-yield "studyNotes" with key takeaways, a formula bank (with LaTeX formulas and variable explanations), and an exam cheat sheet summary.
6. Provide exactly 3 intuitive "suggestedQuestions" the student can click to ask their AI tutor.

${extractedText ? `Here is the pre-extracted text from the document:\n"""\n${extractedText}\n"""` : ""}

CRITICAL: Return ONLY a valid JSON object strictly conforming to the requested schema.`;

    // Helper for Groq fallback
    const callOpenAICompatible = async (apiUrl: string, apiKey: string, modelName: string, includeImage: boolean = true): Promise<any> => {
      try {
        const messages: any[] = [
          { role: "system", content: "You are Celeste NotebookLM. You analyze handwritten notes and output ONLY valid JSON matching the schema." }
        ];

        if (fileData && !isPdf && includeImage) {
          messages.push({
            role: "user",
            content: [
              { type: "text", text: promptInstructions },
              { type: "image_url", image_url: { url: fileData } }
            ]
          });
        } else {
          messages.push({
            role: "user",
            content: `${promptInstructions}\n\n${extractedText ? `Extracted Content:\n${extractedText}` : `[Attached File: ${filename || (isPdf ? 'document.pdf' : 'document')}]`}`
          });
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
          signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
          const errText = await response.text();
          // If vision failed or model was decommissioned, and we were trying vision, fall back to text-only model
          if (includeImage && fileData && !isPdf) {
            console.warn(`Vision model ${modelName} failed (${response.status}), falling back to text-only llama-3.3-70b-versatile:`, errText);
            return await callOpenAICompatible(apiUrl, apiKey, "llama-3.3-70b-versatile", false);
          }
          // If model was decommissioned or not found on Groq, fallback to active Groq model
          if ((errText.includes("model_not_found") || errText.includes("decommissioned") || response.status === 404) && modelName !== "openai/gpt-oss-120b") {
            console.warn(`Model ${modelName} not found on Groq, falling back to openai/gpt-oss-120b:`, errText);
            return await callOpenAICompatible(apiUrl, apiKey, "openai/gpt-oss-120b", false);
          }
          throw new Error(`Groq API Error: ${errText}`);
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
        if (includeImage && fileData && !isPdf && !err?.name?.includes("AbortError")) {
          console.warn(`Error with vision model ${modelName}, retrying with text fallback llama-3.3-70b-versatile:`, err?.message || err);
          return await callOpenAICompatible(apiUrl, apiKey, "llama-3.3-70b-versatile", false);
        }
        if ((err?.message?.includes("model_not_found") || err?.message?.includes("decommissioned")) && modelName !== "openai/gpt-oss-120b") {
          return await callOpenAICompatible(apiUrl, apiKey, "openai/gpt-oss-120b", false);
        }
        throw err;
      }
    };

    let resultJson: any = null;
    let errors: string[] = [];

    // --- PRIORITY 1: GEMINI (Flash free tier) ---
    try {
      if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const contents: any[] = [promptInstructions];

      if (fileData) {
        const detectedMime = (typeof fileData === 'string' && fileData.startsWith('data:')) 
          ? fileData.split(';')[0].split(':')[1] 
          : (mimeType || (isPdf ? 'application/pdf' : 'image/jpeg'));
        const base64Data = (typeof fileData === 'string' && fileData.includes(',')) 
          ? fileData.split(',')[1] 
          : fileData;
        if (base64Data) {
          contents.push({ inlineData: { data: base64Data, mimeType: detectedMime } });
        }
      }

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contents,
          config: {
            responseMimeType: 'application/json',
            responseSchema: notebookResponseSchema,
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
              responseSchema: notebookResponseSchema,
              temperature: 0.2
            }
          });
        } else {
          throw gemini25Err;
        }
      }

      resultJson = JSON.parse(response.text || "{}");
    } catch (geminiErr: any) {
      console.warn("Priority 1 (Gemini) failed, trying fallback:", geminiErr?.message || geminiErr);
      errors.push(`Gemini: ${geminiErr?.message || geminiErr}`);
    }

    // --- PRIORITY 2: GROQ PRIORITY ---
    if (!resultJson && process.env.GROQ_API_KEY_PRIORITY) {
      try {
        const model = (fileData && !isPdf) ? "llama-3.2-90b-vision-preview" : "llama-3.3-70b-versatile";
        resultJson = await callOpenAICompatible("https://api.groq.com/openai/v1/chat/completions", process.env.GROQ_API_KEY_PRIORITY, model);
      } catch (groqErr: any) {
        console.warn("Priority 2 (Groq) failed:", groqErr?.message || groqErr);
        errors.push(`GroqPriority: ${groqErr?.message || groqErr}`);
      }
    }

    // --- PRIORITY 3: GROQ FALLBACK ---
    if (!resultJson && process.env.GROQ_API_KEY_FALLBACK) {
      try {
        const model = (fileData && !isPdf) ? "llama-3.2-90b-vision-preview" : "llama-3.3-70b-versatile";
        resultJson = await callOpenAICompatible("https://api.groq.com/openai/v1/chat/completions", process.env.GROQ_API_KEY_FALLBACK, model);
      } catch (groqFallbackErr: any) {
        console.warn("Priority 3 (Groq Fallback) failed:", groqFallbackErr?.message || groqFallbackErr);
        errors.push(`GroqFallback: ${groqFallbackErr?.message || groqFallbackErr}`);
      }
    }

    if (!resultJson) {
      return NextResponse.json({
        error: "Failed to process notes through AI providers: " + errors.join("; ")
      }, { status: 500 });
    }

    // Format response to full NotebookNote object
    const finalNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
      sourceName: filename || "Handwritten Note",
      sourceType: isPdf ? 'pdf' : 'image',
      sourceDataUrl: (fileData && fileData.length < 1500000) ? fileData : undefined,
      ...resultJson
    };

    return NextResponse.json(finalNote);

  } catch (error: any) {
    console.error("Notebook Ingestion Error:", error);
    return NextResponse.json({ error: error.message || "Failed to scan notes" }, { status: 500 });
  }
}
