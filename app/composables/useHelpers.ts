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

  return {
    shortenKey,
    formatDate,
    formatTime,
    formatDateTime,
  };
};
