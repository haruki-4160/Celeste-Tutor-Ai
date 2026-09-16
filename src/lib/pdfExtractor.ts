/**
 * Client-Side PDF Text Extractor
 * Attempts to extract plain text from digital PDFs in the browser (0 AI tokens).
 * If the PDF is scanned or image-only, returns null so the multimodal vision pipeline can handle it.
 */
export async function extractTextFromPdf(file: File): Promise<string | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    const content = textDecoder.decode(arrayBuffer);

    // Look for PDF Text Blocks: BT (Begin Text) ... ET (End Text)
    const textBlockRegex = /BT[\s\S]*?ET/g;
    const matches = content.match(textBlockRegex);

    if (!matches || matches.length === 0) {
      // Scanned/image-only PDF
      return null;
    }

    const extractedStrings: string[] = [];

    // Extract strings inside parentheses like (Hello World) Tj or TJ
    const stringLiteralRegex = /\(([^)]+)\)/g;

    for (const block of matches) {
      let match;
      while ((match = stringLiteralRegex.exec(block)) !== null) {
        const cleaned = match[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '')
          .replace(/\\t/g, ' ')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .trim();
        if (cleaned.length > 0) {
          extractedStrings.push(cleaned);
        }
      }
    }

    const fullText = extractedStrings.join(' ');
    // If we managed to extract more than 50 characters of actual content, it's a digital PDF
    if (fullText.trim().length > 50) {
      return fullText.trim();
    }

    return null;
  } catch (err) {
    console.warn('Could not extract client-side PDF text, falling back to vision OCR:', err);
    return null;
  }
}
