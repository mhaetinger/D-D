export const AVATAR_BYTES = 32 * 1024;
export const SOURCE_BYTES = 5 * 1024 * 1024;
export const AVATAR_BUCKET = "critcall-avatars";
export interface AvatarRef { id: string; revision: string }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isAvatarRef(value: unknown): value is AvatarRef {
  const ref = value as AvatarRef | null;
  return !!ref && typeof ref.id === "string" && typeof ref.revision === "string" && uuid.test(ref.id) && uuid.test(ref.revision);
}
export function avatarMarkup(ref: unknown, profile = false): string {
  // Só UUIDs entram nos atributos; nunca aceitar URLs/HTML fornecidos no backup.
  const attrs = isAvatarRef(ref) ? `data-avatar-id="${ref.id}" data-avatar-revision="${ref.revision}"` : "";
  return `<span class="portrait" ${profile ? "data-avatar-profile" : ""} ${attrs}><i data-lucide="${profile ? "user-check" : "scroll-text"}" aria-hidden="true"></i></span>`;
}
export async function prepareAvatar(file: File): Promise<Blob> {
  if (!file.size || file.size > SOURCE_BYTES) throw new Error("Escolha uma imagem de até 5 MB.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Use uma imagem JPG, PNG ou WebP. SVG e GIF não são aceitos.");
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const png = [137,80,78,71,13,10,26,10].every((value,index) => head[index] === value);
  const jpeg = head[0] === 255 && head[1] === 216 && head[2] === 255;
  const webp = String.fromCharCode(...head.slice(0,4)) === "RIFF" && String.fromCharCode(...head.slice(8,12)) === "WEBP";
  if (!(file.type === "image/png" && png || file.type === "image/jpeg" && jpeg || file.type === "image/webp" && webp)) throw new Error("O conteúdo do arquivo não corresponde a uma imagem JPG, PNG ou WebP válida.");
  let image: ImageBitmap;
  try { image = await createImageBitmap(file); }
  catch { throw new Error("Não foi possível abrir esta imagem. Tente outro arquivo JPG, PNG ou WebP."); }
  try {
    if (image.width * image.height > 32_000_000 || Math.max(image.width, image.height) > 8192) throw new Error("A imagem deve ter até 32 megapixels e 8192 pixels por lado.");
    const crop = Math.min(image.width, image.height);
    const canvas = document.createElement("canvas");
    // Redesenhar os pixels descarta metadados, animações e o arquivo original.
    for (const size of [256, 192, 128]) {
      canvas.width = canvas.height = Math.min(size, crop);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Seu navegador não conseguiu preparar a imagem.");
      ctx.drawImage(image, (image.width - crop) / 2, (image.height - crop) / 2, crop, crop, 0, 0, canvas.width, canvas.height);
      for (const quality of [.82, .65, .45]) {
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", quality));
        if (blob?.type === "image/webp" && blob.size <= AVATAR_BYTES) return blob;
      }
    }
    throw new Error("Não foi possível reduzir a imagem para 32 KB. Escolha uma imagem mais simples.");
  } finally { image.close(); }
}
