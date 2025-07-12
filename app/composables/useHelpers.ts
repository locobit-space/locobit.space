// composables/useHelpers.ts

export const useHelpers = () => {
  function shortenKey(key: string): string {
    if (!key || typeof key !== "string") return "unknown";
    return `${key.slice(0, 6)}...${key.slice(-4)}`;
  }

  function formatDate(timestamp: number): string {
    if (!timestamp) return "Invalid date";
    const date = new Date(timestamp * 1000);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  }

  function formatTime(timestamp: number): string {
    if (!timestamp) return "Invalid date";
    const date = new Date(timestamp * 1000);
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    }).format(date);
  }

  function formatDateTime(timestamp: number): string {
    if (!timestamp) return "Invalid date";
    const date = new Date(timestamp * 1000);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    }).format(date);
  }

  function timeAgo(timestamp: number): string {
    if (!timestamp || isNaN(timestamp)) return "Invalid date";

    const SECONDS = 1;
    const MINUTE = 60 * SECONDS;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;
    const WEEK = 7 * DAY;
    const MONTH = 30 * DAY;
    const YEAR = 365 * DAY;

    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < MINUTE) return `${diff}s`;
    if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m`;
    if (diff < DAY) return `${Math.floor(diff / HOUR)}h`;
    if (diff < WEEK) return `${Math.floor(diff / DAY)}d`;
    if (diff < MONTH) return `${Math.floor(diff / WEEK)}w`;
    if (diff < YEAR) return `${Math.floor(diff / MONTH)}mo`;

    return formatDateTime(timestamp); // Fallback to full date format
  }

  return {
    shortenKey,
    formatDate,
    formatTime,
    formatDateTime,
    timeAgo,
  };
};
