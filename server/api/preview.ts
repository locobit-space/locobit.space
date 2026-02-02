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
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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

    // Defensive check for empty content
    if (!html || html.trim().length === 0) {
      return {
        url,
        domain: new URL(url).hostname.replace("www.", ""),
        title: new URL(url).hostname.replace("www.", ""),
        description: "",
        image: undefined,
        type: undefined,
      };
    }

    const { document } = parseHTML(html);

    // Defensive check for invalid document structure
    if (!document || !document.documentElement) {
      return {
        url,
        domain: new URL(url).hostname.replace("www.", ""),
        title: new URL(url).hostname.replace("www.", ""),
        description: "",
        image: undefined,
        type: undefined,
      };
    }

    const getMetaContent = (names: string[]) => {
      for (const name of names) {
        const meta = document.querySelector(
          `meta[property="${name}"], meta[name="${name}"]`,
        );
        if (meta?.content) return meta.content;
      }
      return null;
    };

    const hostname = new URL(url).hostname.replace("www.", "");

    // Safely access title
    const docTitle = document.title || "";

    let preview = {
      url,
      domain: hostname,
      title:
        getMetaContent(["og:title", "twitter:title", "title"]) ||
        docTitle ||
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
        preview.type = "video";
        break;
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
    // Only log actual system errors, generic fetch failures are common (timeouts etc)
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isExpectedError =
      errorMessage.includes("Forbidden") ||
      errorMessage.includes("404") ||
      errorMessage.includes("fetch failed");

    if (!isExpectedError) {
      console.warn(`Preview fetch failed for ${url}:`, errorMessage);
    }

    // Return a basic fallback object on error instead of throwing 500
    // This allows the UI to render a simple link instead of breaking
    try {
      const hostname = new URL(url).hostname.replace("www.", "");
      return {
        url,
        domain: hostname,
        title: hostname,
        description: "",
        image: undefined,
        type: undefined,
      };
    } catch (e) {
      // If even URL parsing fails, throw or return minimal
      throw createError({
        statusCode: 500,
        message: "Failed to fetch URL preview",
      });
    }
  }
});
