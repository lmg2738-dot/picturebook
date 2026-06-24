import { generateIllustrationSvg } from "./image-svg";
import { buildSceneSvg } from "@/lib/images/scene-svg";

export type ImageSource = "llm" | "fallback";

export interface PageImageResult {
  buffer: Buffer;
  source: ImageSource;
}

export async function generatePageImage(
  imagePrompt: string,
  childName: string
): Promise<PageImageResult> {
  try {
    const buffer = await generateIllustrationSvg(imagePrompt, childName);
    return { buffer, source: "llm" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[StorySeed] LLM illustration failed (${message}), using scene fallback`);
    return { buffer: buildSceneSvg(imagePrompt, childName), source: "fallback" };
  }
}
