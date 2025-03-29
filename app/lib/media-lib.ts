export const mediaTypes = ["image", "video", "audio"];

export const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

export const videoExtensions = [".mp4", ".mov", ".webm", ".avi"];

export const audioExtensions = [".mp3", ".wav", ".ogg", ".m4a"];

export const mediaExtensions = [
  ...imageExtensions,
  ...videoExtensions,
  ...audioExtensions,
];
