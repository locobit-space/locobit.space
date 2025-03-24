// composables/useHelpers.ts

export const useHelpers = () => {
  function shortenKey(key: string): string {
    if (!key || typeof key !== "string") return "unknown";
    return `${key.slice(0, 6)}...${key.slice(-4)}`;
  }

  function formatDate(timestamp: number): string {
    if (!timestamp) return "Invalid date";
    return new Date(timestamp * 1000).toLocaleString();
  }

  return {
    shortenKey,
    formatDate,
  };
};
