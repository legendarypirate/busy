import { v2 as cloudinary } from "cloudinary";

let configured = false;

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim(),
  );
}

export function configureCloudinary(): void {
  if (configured || !isCloudinaryConfigured()) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

/**
 * Derive API `public_id` from a `secure_url` (handles optional transformation + version segments).
 */
export function extractPublicIdFromCloudinaryUrl(url: string): string | null {
  const t = url.trim();
  if (!t.includes("res.cloudinary.com") || !t.includes("/upload/")) {
    return null;
  }
  try {
    const u = new URL(t);
    const path = u.pathname;
    const marker = "/upload/";
    const i = path.indexOf(marker);
    if (i === -1) return null;
    let rest = path.slice(i + marker.length);
    const segments = rest.split("/").filter(Boolean);
    while (segments.length > 0 && segments[0].includes(",")) {
      segments.shift();
    }
    if (segments.length > 0 && /^v\d+$/i.test(segments[0])) {
      segments.shift();
    }
    rest = segments.join("/");
    return rest.replace(/\.(jpe?g|png|gif|webp|svg)$/i, "") || null;
  } catch {
    return null;
  }
}

export async function uploadBufferToCloudinary(input: {
  folder: string;
  mime: string;
  buffer: Buffer;
}): Promise<{ secure_url: string }> {
  configureCloudinary();
  const dataUri = `data:${input.mime};base64,${input.buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: input.folder.replace(/^\/+|\/+$/g, ""),
    resource_type: "image",
    use_filename: false,
    unique_filename: true,
  });
  if (!result.secure_url) {
    throw new Error("Cloudinary upload returned no secure_url");
  }
  return { secure_url: result.secure_url };
}

export async function destroyCloudinaryBySecureUrl(url: string | null | undefined): Promise<void> {
  const publicId = extractPublicIdFromCloudinaryUrl(url ?? "");
  if (!publicId || !isCloudinaryConfigured()) return;
  configureCloudinary();
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (e) {
    console.warn("[cloudinary] destroy failed", publicId, e);
  }
}
