import { decode } from "light-bolt11-decoder";

export const useZapSats = () => {
  const { queryEvents } = useNostrRelay();

  // Helper to convert from bolt11 short unit to sats
  function convertShortAmountToSats(amountStr: string): number {
    const units: Record<string, number> = {
      m: 1e5, // milli-bitcoin = 100,000 sats
      u: 1e2, // micro-bitcoin = 100 sats
      n: 0.1, // nano-bitcoin = 0.1 sats
      p: 0.0001, // pico-bitcoin = 0.0001 sats
    };

    const match = amountStr.match(/^(\d+(?:\.\d+)?)([munp]?)$/);
    if (!match) return 0;

    const [, numStr, unit] = match;
    const num = parseFloat(numStr || "0");
    return Math.floor(num * (units[unit || "m"] || 1e8)); // default to BTC → sats
  }

  async function getZapStats(noteId: string) {
    const zapEvents = await queryEvents({
      kinds: [9735],
      "#e": [noteId],
      limit: 100,
    });

    let totalZapSats = 0;

    for (const zap of zapEvents) {
      // 1. Try amount tag (in millisats)
      const amountTag = zap.tags.find(([k]) => k === "amount");
      if (amountTag) {
        const amountMillisats = parseInt(amountTag[1] || "0");
        totalZapSats += Math.floor(amountMillisats / 1000);
        continue;
      }

      // 2. Fallback to bolt11
      const bolt11Tag = zap.tags.find(([k]) => k === "bolt11");
      if ((bolt11Tag?.length || 0) > 1) {
        try {
          const [, bolt11 = ""] = bolt11Tag || [];
          const invoice = decode(bolt11);
          const amountSection = invoice.sections.find(
            (s) => s.name === "amount"
          );
          if (amountSection?.letters) {
            const sats = convertShortAmountToSats(amountSection.letters);
            totalZapSats += sats;
          }
        } catch (err) {
          console.error("Invalid bolt11 invoice:", bolt11Tag, err);
        }
      }
    }

    return {
      zapCount: zapEvents.length,
      totalZapSats,
    };
  }

  return {
    getZapStats,
  };
};
