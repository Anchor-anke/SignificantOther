const MAX_SIZE = 4 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export function isAllowedImageType(type: string): boolean {
  return ALLOWED.includes(type);
}

/** 用于聊天列表展示与入库，避免 blob: 预览地址被 revoke 后图片裂开 */
export function toImageDataUrl(base64: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64}`;
}

export async function compressImageIfNeeded(file: File): Promise<{
  base64: string;
  mimeType: string;
  previewUrl: string;
}> {
  if (!isAllowedImageType(file.type)) {
    throw new Error("仅支持 JPEG、PNG、GIF、WebP 格式");
  }

  let blob: Blob = file;
  let mimeType = file.type;

  if (file.size > MAX_SIZE) {
    blob = await compressToMaxSize(file, MAX_SIZE);
    if (blob.type === "image/png" || blob.type === "image/webp") {
      mimeType = "image/jpeg";
    } else {
      mimeType = blob.type || "image/jpeg";
    }
  }

  const base64 = await blobToBase64(blob);
  const previewUrl = URL.createObjectURL(blob);

  return { base64, mimeType, previewUrl };
}

async function compressToMaxSize(file: File, maxBytes: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  let { width, height } = bitmap;

  const maxDim = 1920;
  if (width > maxDim || height > maxDim) {
    const ratio = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法创建 Canvas");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.92;
  let blob = await canvasToJpeg(canvas, quality);

  while (blob.size > maxBytes && quality > 0.35) {
    quality -= 0.08;
    blob = await canvasToJpeg(canvas, quality);
  }

  if (blob.size > maxBytes) {
    const scale = Math.sqrt(maxBytes / blob.size) * 0.85;
    const w2 = Math.max(320, Math.round(width * scale));
    const h2 = Math.max(320, Math.round(height * scale));
    const canvas2 = document.createElement("canvas");
    canvas2.width = w2;
    canvas2.height = h2;
    const bmp2 = await createImageBitmap(file);
    const ctx2 = canvas2.getContext("2d")!;
    ctx2.drawImage(bmp2, 0, 0, w2, h2);
    bmp2.close();
    blob = await canvasToJpeg(canvas2, 0.72);
  }

  return blob;
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("压缩失败"))),
      "image/jpeg",
      quality,
    );
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
