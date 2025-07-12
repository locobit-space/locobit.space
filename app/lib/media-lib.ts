export const mediaTypes = ["image", "video", "audio"];

export const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

export const videoExtensions = [
  ".mp4",
  ".mov",
  ".webm",
  ".avi",
  ".ogg",
  ".mkv",
  ".flv",
  ".wmv",
  ".m4v",
];

export const audioExtensions = [".mp3", ".wav", ".ogg", ".m4a"];

export const mediaExtensions = [
  ...imageExtensions,
  ...videoExtensions,
  ...audioExtensions,
];

interface PlatformMedia {
  name: string;
  regex: RegExp;
  embedUrl: (id: string) => string;
  thumbnailUrl?: (id: string) => string;
  customHandler?: (match: RegExpExecArray) => any;
}

export const platformMedias: PlatformMedia[] = [
  {
    name: "youtube",
    regex:
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)(?:\S*)/gi,
    embedUrl: (id: string) => `https://www.youtube.com/embed/${id}`,
    thumbnailUrl: (id: string) =>
      `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
  },
  {
    name: "vimeo",
    regex:
      /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)/gi,
    embedUrl: (id: string) => `https://player.vimeo.com/video/${id}`,
  },
  {
    name: "rumble",
    regex:
      /(?:https?:\/\/)?(?:www\.)?rumble\.com\/([a-zA-Z0-9_-]+)(?:\.html)?(?:\S*)/gi,
    embedUrl: (id: string) => `https://rumble.com/embed/${id}/`,
  },
  {
    name: "dailymotion",
    regex:
      /(?:https?:\/\/)?(?:www\.)?dailymotion\.com\/video\/([a-zA-Z0-9_-]+)(?:\S*)/gi,
    embedUrl: (id: string) => `https://www.dailymotion.com/embed/video/${id}`,
  },
  {
    name: "twitch",
    regex:
      /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/(?:videos\/)?([a-zA-Z0-9_-]+)(?:\S*)/gi,
    embedUrl: (id: string) => {
      // Check if it's a video or channel
      if (/^\d+$/.test(id)) {
        return `https://player.twitch.tv/?video=${id}&parent=${window.location.hostname}`;
      } else {
        return `https://player.twitch.tv/?channel=${id}&parent=${window.location.hostname}`;
      }
    },
  },
  {
    name: "tiktok",
    regex:
      /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[^\/]+\/video\/(\d+)(?:\S*)/gi,
    embedUrl: (id: string) => `https://www.tiktok.com/embed/v2/${id}`,
  },
  {
    name: "facebook",
    regex:
      /(?:https?:\/\/)?(?:www\.|web\.|m\.)?facebook\.com\/(?:watch\/?\?v=|video\.php\?v=|video\.php\?id=|.*?\/videos\/(?:[^\/]+\/)?)(\d+)(?:\S*)/gi,
    embedUrl: (id: string) =>
      `https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/watch/?v=${id}&show_text=0`,
  },
  {
    name: "instagram",
    regex:
      /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)(?:\S*)/gi,
    embedUrl: (id: string) => `https://www.instagram.com/p/${id}/embed/`,
  },
  {
    name: "bitchute",
    regex:
      /(?:https?:\/\/)?(?:www\.)?bitchute\.com\/video\/([a-zA-Z0-9_-]+)(?:\S*)/gi,
    embedUrl: (id: string) => `https://www.bitchute.com/embed/${id}/`,
  },
  {
    name: "odysee",
    regex:
      /(?:https?:\/\/)?(?:www\.)?odysee\.com\/(?:\$\/)?([a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+)(?:\S*)/gi,
    embedUrl: (id: string) => `https://odysee.com/$/embed/${id}`,
  },
  {
    name: "peertube",
    regex: /(?:https?:\/\/)?([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)\/(?:videos\/)?watch\/([a-zA-Z0-9_-]+)(?:\S*)/gi,
    // Special handler for PeerTube as it needs both domain and ID
    customHandler: (match: any) => {
      const domain = match[1];
      const videoId = match[2];
      return {
        type: "embed",
        embedType: "peertube",
        videoId: videoId,
        domain: domain,
        embedUrl: `https://${domain}/videos/embed/${videoId}`,
      };
    },
    embedUrl: function (id: string): string {
      throw new Error("Function not implemented.");
    }
  },
];
