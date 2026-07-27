const IMAGE_MEDIA_PATTERN = /\.(avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i;

export function isImageMedia(media: string) {
  return media.startsWith("data:image/") || IMAGE_MEDIA_PATTERN.test(media);
}

export function readMediaFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read the selected media file."));
    });
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

