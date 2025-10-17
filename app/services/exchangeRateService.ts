export class ExchangeRateService {
  private static CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  static async fetchRate(currency: string): Promise<number> {
    const cacheKey = `exchange_rate_${currency.toLowerCase()}`;
    const cachedRate = this.getRateFromCache(cacheKey);
    if (cachedRate) return cachedRate;

    try {
      const btcUsd = await this.fetchBtcUsdRate();
      const satsPerFiat = currency.toLowerCase() === "usd" 
        ? this.calculateUsdRate(btcUsd)
        : await this.calculateFiatRate(currency, btcUsd);

      this.cacheRate(cacheKey, satsPerFiat);
      return satsPerFiat;
    } catch (error) {
      console.error('Exchange rate fetch failed:', error);
      return this.getFallbackRate(currency);
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
    return 100000000 / btcUsd;
  }

  private static async calculateFiatRate(currency: string, btcUsd: number): Promise<number> {
    const response = await fetch(
      "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json"
    );
    if (!response.ok) throw new Error(`Fiat fetch failed: ${response.status}`);
    
    const data = await response.json();
    const usdPerFiat = data.usd[currency.toLowerCase()];
    if (!usdPerFiat) throw new Error(`${currency} rate not found`);

    const satsPerUsd = this.calculateUsdRate(btcUsd);
    return satsPerUsd / usdPerFiat;
  }

  private static getFallbackRate(currency: string): number {
    return currency.toLowerCase() === "usd" 
      ? 100000000 / 111692  // Fallback BTC/USD
      : 0.0413;             // Default sats per LAK
  }
}