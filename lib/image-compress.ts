/**
 * Client-side image shrinking, run in the browser before a Supabase upload.
 *
 * Phone photos of receipts / payment QRs are commonly 3–8 MB; downscaling the
 * longest edge and re-encoding turns them into a few hundred KB, cutting
 * storage and upload/download time with no server changes.
 *
 * Safety rules:
 *  - Non-raster or animated types (SVG, GIF) are returned untouched.
 *  - PNG sources stay PNG (lossless) so logos keep transparency and QR codes
 *    keep crisp, scannable edges; other rasters re-encode to JPEG.
 *  - The result is never larger than the original — if it would be, or if
 *    anything fails, the original File is returned so the upload still works.
 */
export type CompressOptions = {
  /** Longest-edge cap in pixels. Default 1600. */
  maxDim?: number;
  /** JPEG/WebP quality 0–1 (ignored for PNG output). Default 0.82. */
  quality?: number;
  /** Force an output type instead of inferring from the source. */
  output?: "image/jpeg" | "image/png" | "image/webp";
};

export async function compressImage(
  file: File,
  opts: CompressOptions = {},
): Promise<File> {
  const maxDim = opts.maxDim ?? 1600;
  const quality = opts.quality ?? 0.82;

  // Only touch still rasters we can safely draw to a canvas.
  if (typeof document === "undefined") return file;
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;

  const output =
    opts.output ?? (file.type === "image/png" ? "image/png" : "image/jpeg");

  let bitmap: ImageBitmap | HTMLImageElement | null = null;
  try {
    bitmap = await loadImage(file);
    const w = "width" in bitmap ? bitmap.width : 0;
    const h = "height" in bitmap ? bitmap.height : 0;
    if (!w || !h) return file;

    const scale = Math.min(1, maxDim / Math.max(w, h));
    // Already within bounds and already small — nothing worth doing.
    if (scale === 1 && file.size <= 600 * 1024) return file;

    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // JPEG has no alpha — paint white so transparent areas aren't black.
    if (output === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, tw, th);
    }
    ctx.drawImage(bitmap, 0, 0, tw, th);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, output, output === "image/png" ? undefined : quality),
    );
    if (!blob || blob.size >= file.size) return file;

    const ext = output === "image/png" ? "png" : output === "image/webp" ? "webp" : "jpg";
    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${base}.${ext}`, {
      type: output,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    if (bitmap && typeof ImageBitmap !== "undefined" && bitmap instanceof ImageBitmap) {
      bitmap.close();
    }
  }
}

async function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Fall back to <img> below.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    try {
      await img.decode();
    } catch {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("decode failed"));
      });
    }
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}
