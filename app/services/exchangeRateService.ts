// Approx sats-per-unit for common currencies when network is unavailable.
// Derived from BTC ≈ $97 000 at time of writing — used only as last-resort fallback.
const FALLBACK_SATS_PER_UNIT: Record<string, number> = {
  usd: 1031,    // 1 USD ≈ 1 031 sats
  eur: 1123,    // 1 EUR ≈ 1 123 sats
  gbp: 1312,    // 1 GBP ≈ 1 312 sats
  jpy: 6.9,     // 1 JPY ≈ 6.9 sats
  cny: 142,     // 1 CNY ≈ 142 sats
  thb: 28,      // 1 THB ≈ 28 sats
  lak: 0.049,   // 1 LAK ≈ 0.049 sats
  vnd: 0.040,   // 1 VND ≈ 0.040 sats
  idr: 0.063,   // 1 IDR ≈ 0.063 sats
  krw: 0.70,    // 1 KRW ≈ 0.70 sats
  inr: 12.2,    // 1 INR ≈ 12.2 sats
  sgd: 758,     // 1 SGD ≈ 758 sats
  aud: 645,     // 1 AUD ≈ 645 sats
  cad: 726,     // 1 CAD ≈ 726 sats
  chf: 1133,    // 1 CHF ≈ 1 133 sats
  myr: 235,     // 1 MYR ≈ 235 sats
  php: 17.4,    // 1 PHP ≈ 17.4 sats
  aed: 281,     // 1 AED ≈ 281 sats
  sar: 275,     // 1 SAR ≈ 275 sats
  brl: 198,     // 1 BRL ≈ 198 sats
  mxn: 51,      // 1 MXN ≈ 51 sats
  try: 27,      // 1 TRY ≈ 27 sats
  zar: 55,      // 1 ZAR ≈ 55 sats
  hkd: 132,     // 1 HKD ≈ 132 sats
  nzd: 597,     // 1 NZD ≈ 597 sats
};

export class ExchangeRateService {
  private static CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  /**
   * Returns sats-per-1-unit-of-currency.
   * Fetches BTC/USD from blockchain.info then converts via fawazahmed0 currency API.
   */
  static async fetchRate(currency: string): Promise<number> {
    const code = currency.toLowerCase();
    const cacheKey = `exchange_rate_${code}`;
    const cachedRate = this.getRateFromCache(cacheKey);
    if (cachedRate) return cachedRate;

    try {
      const btcUsd = await this.fetchBtcUsdRate();
      const satsPerFiat = code === "usd" || code === "btc"
        ? this.calculateUsdRate(btcUsd)
        : await this.calculateFiatRate(code, btcUsd);

      this.cacheRate(cacheKey, satsPerFiat);
      return satsPerFiat;
    } catch (error) {
      console.error(`Exchange rate fetch failed for ${currency}:`, error);
      return this.getFallbackRate(code);
    }
  }

  /**
   * Fetches the full list of currencies supported by the fawazahmed0 API.
   * Returns a map of lowercase code → display name.
   */
  static async fetchAvailableCurrencies(): Promise<Record<string, string>> {
    const cacheKey = "available_currencies";
    try {
      const cached = localStorage.getItem(cacheKey);
      const ts = localStorage.getItem(`${cacheKey}_timestamp`);
      if (cached && ts && (Date.now() - Number(ts)) < 24 * 60 * 60 * 1000) {
        return JSON.parse(cached) as Record<string, string>;
      }
      const res = await fetch(
        "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json"
      );
      if (!res.ok) throw new Error("currencies list fetch failed");
      const data = await res.json() as Record<string, string>;
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
      return data;
    } catch {
      return {};
    }
  }

  private static getRateFromCache(key: string): number | null {
    const cached = localStorage.getItem(key);
    const timestamp = localStorage.getItem(`${key}_timestamp`);
    if (cached && timestamp && (Date.now() - Number(timestamp)) < this.CACHE_DURATION) {
      return Number(cached);
    }
    return null;
  }

  private static cacheRate(key: string, rate: number): void {
    localStorage.setItem(key, rate.toString());
    localStorage.setItem(`${key}_timestamp`, Date.now().toString());
  }

  private static async fetchBtcUsdRate(): Promise<number> {
    const response = await fetch("https://blockchain.info/ticker");
    if (!response.ok) throw new Error(`BTC fetch failed: ${response.status}`);
    const data = await response.json();
    return data.USD.last;
  }

  private static calculateUsdRate(btcUsd: number): number {
    return 100_000_000 / btcUsd;
  }

  private static async calculateFiatRate(code: string, btcUsd: number): Promise<number> {
    // Primary: fawazahmed0 CDN (supports ~170 currencies)
    let usdToFiat: number | undefined;
    try {
      const res = await fetch(
        "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json"
      );
      if (!res.ok) throw new Error(`Fiat fetch failed: ${res.status}`);
      const data = await res.json();
      usdToFiat = data.usd?.[code] as number | undefined;
    } catch {
      // fallthrough to fallback
    }

    if (!usdToFiat) {
      // Secondary: try the date-stamped fallback endpoint
      try {
        const today = new Date().toISOString().split("T")[0];
        const res = await fetch(
          `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${today}/v1/currencies/usd.json`
        );
        if (res.ok) {
          const data = await res.json();
          usdToFiat = data.usd?.[code] as number | undefined;
        }
      } catch {
        // fallthrough
      }
    }

    if (!usdToFiat) throw new Error(`No rate found for ${code}`);

    const satsPerUsd = this.calculateUsdRate(btcUsd);
    return satsPerUsd / usdToFiat;
  }

  private static getFallbackRate(code: string): number {
    return FALLBACK_SATS_PER_UNIT[code] ?? FALLBACK_SATS_PER_UNIT["usd"]!;
  }
}