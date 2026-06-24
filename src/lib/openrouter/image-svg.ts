import { getOpenRouterClient } from "./client";
import { withPreferredModel } from "./models";

function extractSvg(text: string): string | null {
  const fenced = text.match(/```(?:svg|xml)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1].trim() : text.trim();
  const start = raw.indexOf("<svg");
  const end = raw.lastIndexOf("</svg>");
  if (start < 0 || end <= start) return null;
  return sanitizeSvg(raw.slice(start, end + 6));
}

function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "");
}

function ensureSvgDimensions(svg: string): string {
  if (/width\s*=/.test(svg) && /height\s*=/.test(svg)) return svg;
  return svg.replace(
    "<svg",
    '<svg width="1024" height="1024" viewBox="0 0 1024 1024"'
  );
}

export async function generateIllustrationSvg(
  imagePrompt: string,
  childName: string
): Promise<Buffer> {
  const client = getOpenRouterClient();

  const { result: content, modelId } = await withPreferredModel("text", async (model) => {
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are a children's picture book illustrator. Output ONLY one complete SVG document.

Requirements:
- Start with <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
- Style: soft watercolor children's book, warm pastel palette, gentle gradients, rounded friendly shapes
- Draw a full scene matching the prompt — characters, background, props, atmosphere
- The main child character should look Korean, age 4-8, cute and expressive
- Use paths, circles, ellipses, gradients — make it visually rich (at least 15 shapes)
- Do NOT include any text, letters, numbers, or watermarks in the image
- No <script>, no external URLs, no <image href>
- End with </svg>
- Output raw SVG only, no markdown`,
        },
        {
          role: "user",
          content: `Illustrate this scene for a picture book page:\n${imagePrompt}\n\nMain child character inspiration: ${childName}`,
        },
      ],
      temperature: 0.85,
      max_tokens: 6000,
    });

    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error("SVG 응답이 비어 있습니다.");
    return text;
  });

  const svg = extractSvg(content);
  if (!svg) {
    throw new Error("SVG 파싱 실패");
  }

  console.info(`[StorySeed] SVG illustration generated with model: ${modelId}`);
  return Buffer.from(ensureSvgDimensions(svg), "utf8");
}
