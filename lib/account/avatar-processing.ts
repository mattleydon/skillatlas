import "server-only";
import sharp from "sharp";
import { AVATAR_OUTPUT_LIMIT, validateAvatarFile } from "@/lib/account/avatar";

// Decode bytes, not just a filename/MIME claim. No original or EXIF is retained.
export async function processAvatar(file: { size: number; type: string; arrayBuffer(): Promise<ArrayBuffer> }) {
  const error = validateAvatarFile(file);
  if (error) throw new Error(error);
  const bytes = Buffer.from(await file.arrayBuffer());
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isWebp = bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (!isJpeg && !isPng && !isWebp) throw new Error("Unsupported image bytes.");
  const image = sharp(bytes, { limitInputPixels: 16_000_000, failOn: "warning" });
  const metadata = await image.metadata();
  const formats: Record<string, string> = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
  if (!metadata.format || formats[metadata.format] !== file.type || (metadata.pages ?? 1) !== 1) {
    throw new Error("Choose a still JPEG, PNG or WebP image.");
  }
  const output = await image.rotate().resize(512, 512, { fit: "cover", position: "centre" })
    .webp({ quality: 82 }).toBuffer();
  if (output.length > AVATAR_OUTPUT_LIMIT) throw new Error("This image is too detailed. Choose a simpler image.");
  return output;
}
