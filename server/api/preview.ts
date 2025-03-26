import { parseHTML } from "linkedom";

export default defineEventHandler(async (event) => {
  const { url } = getQuery(event);

  if (!url || typeof url !== "string") {
    throw createError({ statusCode: 400, message: "Invalid or missing URL" });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.statusText}`);
    }

    const html = await response.text();
    const { document } = parseHTML(html);

    const getMetaContent = (names: string[]) => {
      for (const name of names) {
        const meta = document.querySelector(
          `meta[property="${name}"], meta[name="${name}"]`
        );
        if (meta?.content) return meta.content;
      }
      return null;
    };

    const hostname = new URL(url).hostname.replace("www.", "");

    let preview = {
      url,
      domain: hostname,
      title:
        getMetaContent(["og:title", "twitter:title", "title"]) ||
        document.title ||
        hostname,
      description:
        getMetaContent([
          "og:description",
          "twitter:description",
          "description",
        ]) || "",
      image: getMetaContent(["og:image", "twitter:image", "twitter:image:src"]),
      type: undefined as string | undefined,
    };

    switch (hostname) {
      case "x.com":
      case "twitter.com":
        preview.type = "social-media";
        break;
      case "youtube.com":
      case "youtu.be":
        preview.type = "video";
        break;
      case "github.com":
        preview.type = "code-repository";
        break;
    }

    if (!preview.image) {
      const firstImage = document.querySelector("img")?.getAttribute("src");
      if (firstImage) {
        preview.image = firstImage.startsWith("http")
          ? firstImage
          : new URL(firstImage, url).href;
      }
    }

    if (preview.description.length > 200) {
      preview.description = preview.description.slice(0, 200) + "...";
    }

    return preview;
  } catch (error) {
    console.error("Preview fetch error:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch URL preview",
    });
  }
});
