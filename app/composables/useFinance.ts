import { ref, computed, onMounted } from "vue";

// Define types for clarity
interface FinanceEntry {
  id: string;
  user_id: string;
  type: "income" | "expense";
  amount_fiat: number;
  amount_sats: number;
  fiat_currency: string;
  sats_per_fiat: number; // Satoshis per 1 unit of fiat (e.g., LAK or USD)
  unit_input: "fiat" | "sats";
  note: string;
  tags: string[];
  visibility: "public" | "private";
  created_at: string;
}

interface UserSettings {
  default_currency: string; // e.g., "LAK", "USD"
  display_unit: "fiat" | "sats";
}

interface Totals {
  income: number;
  expenses: number;
  balance: number;
  incomeSats: number;
  expensesSats: number;
  balanceSats: number;
}

export function useFinance() {
  const toast = useToast();
  // Reactive state
  const entries = ref<FinanceEntry[]>([
    {
      id: "1",
      user_id: "npub1mockuserid",
      type: "expense",
      amount_fiat: 216255, // ~10 USD equivalent in LAK
      amount_sats: 894, // Based on ~0.0413 sats/LAK
      fiat_currency: "LAK",
      sats_per_fiat: 0.0413, // Default; fetched dynamically
      unit_input: "fiat",
      note: "Groceries",
      tags: ["food", "groceries"],
      visibility: "private",
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      user_id: "npub1mockuserid",
      type: "income",
      amount_fiat: 432510, // ~20 USD equivalent in LAK
      amount_sats: 1787,
      fiat_currency: "LAK",
      sats_per_fiat: 0.0413,
      unit_input: "fiat",
      note: "Salary",
      tags: ["work", "salary"],
      visibility: "public",
      created_at: new Date("2024-01-01").toISOString(),
    },
  ]);

  const settings = ref<UserSettings>({
    default_currency: "LAK",
    display_unit: "fiat",
  });

  const currentExchangeRate = ref<number>(0.0413); // sats per LAK (default)
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const lastFetch = ref<number | null>(null); // Timestamp for caching

  // Fetch BTC/fiat rate (sats per fiat unit) using no-key APIs
  const fetchExchangeRate = async (
    currency: string = settings.value.default_currency
  ): Promise<number> => {
    // Cache: Reuse rate if fetched within 15 minutes
    const lastExchangeRate = localStorage.getItem(
      `exchange_rate_${currency.toLocaleLowerCase()}`
    );

    const isCache =
      lastExchangeRate && Date.now() - lastFetch.value! < 15 * 60 * 1000;
    if (isCache && lastExchangeRate) {
      return Number(lastExchangeRate) || currentExchangeRate.value;
    }

    isLoading.value = true;
    error.value = null;
    try {
      // Fetch BTC/USD from Coingecko
      const API_URL_BTC = "https://blockchain.info/ticker";
      const API_COIN_GECKO =
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";
      const btcResponse = await fetch(API_URL_BTC);
      if (!btcResponse.ok)
        throw new Error(`BTC fetch failed: ${btcResponse.status}`);
      const btcData = await btcResponse.json();
      // const btcUsd = btcData.bitcoin.usd; // e.g., 111692
      const btcUsd = btcData.USD.last; // e.g., 111692
      if (!btcUsd) throw new Error("BTC/USD rate not found");

      let satsPerFiat: number;

      if (currency.toLowerCase() === "usd") {
        // For USD: sats per USD = 100,000,000 / BTC_USD
        satsPerFiat = 100000000 / btcUsd;
      } else {
        // Fetch USD/fiat from Currency-API (e.g., for LAK)
        const fiatResponse = await fetch(
          "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json"
        );
        if (!fiatResponse.ok)
          throw new Error(`Fiat fetch failed: ${fiatResponse.status}`);
        const fiatData = await fiatResponse.json();
        const usdPerFiat = fiatData.usd[currency.toLowerCase()]; // e.g., 21625.479 for LAK
        if (!usdPerFiat)
          throw new Error(`${currency} rate not found in fiat API`);

        // sats per fiat = (sats per USD) / (USD per fiat unit)
        const satsPerUsd = 100000000 / btcUsd;
        satsPerFiat = satsPerUsd / usdPerFiat;
      }

      currentExchangeRate.value = parseFloat(satsPerFiat.toFixed(6)); // Precision to 6 decimals
      lastFetch.value = Date.now();
      // save to localStorage
      localStorage.setItem(
        `exchange_rate_${currency.toLowerCase()}`,
        currentExchangeRate.value + ""
      );
      return currentExchangeRate.value;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch exchange rate";
      // Fallback: Use USD if LAK fails, or last known rate
      if (currency.toLowerCase() !== "usd") {
        return 100000000 / 111692; // Hardcoded fallback BTC/USD
      }
      return currentExchangeRate.value;
    } finally {
      isLoading.value = false;
    }
  };

  // Add a new entry
  const addEntry = (
    entry: Omit<
      FinanceEntry,
      "id" | "created_at" | "amount_sats" | "amount_fiat"
    > &
      Partial<Pick<FinanceEntry, "amount_sats" | "amount_fiat">>
  ) => {
    const newEntry: FinanceEntry = {
      ...entry,
      note: entry.note || "Untitled",
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      amount_fiat: 0,
      amount_sats: 0,
      sats_per_fiat: entry.sats_per_fiat || currentExchangeRate.value,
      fiat_currency: entry.fiat_currency || settings.value.default_currency,
    };

    // Validate and calculate amounts
    if (entry.unit_input === "fiat" && entry.amount_fiat !== undefined) {
      newEntry.amount_fiat = entry.amount_fiat;
      newEntry.amount_sats = Math.round(
        entry.amount_fiat * newEntry.sats_per_fiat
      );
    } else if (entry.unit_input === "sats" && entry.amount_sats !== undefined) {
      newEntry.amount_sats = entry.amount_sats;
      newEntry.amount_fiat = Number(
        (entry.amount_sats / newEntry.sats_per_fiat).toFixed(2)
      );
    } else {
      toast.add({
        title: "Invalid input",
        description:
          "Must provide amount_fiat for fiat input or amount_sats for sats input",
      });
      throw new Error(
        "Must provide amount_fiat for fiat input or amount_sats for sats input"
      );
    }

    if (newEntry.amount_fiat < 0 || newEntry.amount_fiat == 0) {
      toast.add({
        title: "Invalid amount",
        description: "Amount cannot be negative",
        color: "red",
      });
      throw new Error("Amount cannot be negative");
    }

    toast.add({
      title: "Created new entry",
      description: newEntry.note || "Untitled",
    });
    entries.value.unshift(newEntry);
    saveEntries();
    return newEntry;
  };

  // Edit an entry
  const editEntry = (id: string, updatedEntry: FinanceEntry) => {
    const index = entries.value.findIndex((e) => e.id === id);
    if (index === -1) throw new Error("Entry not found");

    const current = entries.value[index];
    const newEntry: FinanceEntry = {
      ...current,
      ...updatedEntry,
      sats_per_fiat: updatedEntry.sats_per_fiat || current?.sats_per_fiat || 0,
    };

    // Recalculate amounts if needed
    if (
      updatedEntry.unit_input === "fiat" &&
      updatedEntry.amount_fiat !== undefined
    ) {
      newEntry.amount_sats = Math.round(
        updatedEntry.amount_fiat * newEntry.sats_per_fiat
      );
    } else if (
      updatedEntry.unit_input === "sats" &&
      updatedEntry.amount_sats !== undefined
    ) {
      newEntry.amount_fiat = Number(
        (updatedEntry.amount_sats / newEntry.sats_per_fiat).toFixed(2)
      );
    }

    entries.value[index] = newEntry;
    saveEntries();
    return newEntry;
  };

  // Delete an entry
  const deleteEntry = (id: string) => {
    const index = entries.value.findIndex((e) => e.id === id);
    if (index === -1) throw new Error("Entry not found");
    entries.value.splice(index, 1);
    saveEntries();
  };

  // Filter entries by tags or date range
  const filterEntries = (options: {
    tags?: string[];
    startDate?: Date;
    endDate?: Date;
  }) => {
    return entries.value.filter((entry) => {
      const matchesTags = options.tags
        ? options.tags.every((tag) => entry.tags.includes(tag))
        : true;
      const entryDate = new Date(entry.created_at);
      const matchesStart = options.startDate
        ? entryDate >= options.startDate
        : true;
      const matchesEnd = options.endDate ? entryDate <= options.endDate : true;
      return matchesTags && matchesStart && matchesEnd;
    });
  };

  // Save entries to localStorage
  const saveEntries = () => {
    try {
      localStorage.setItem("finance_entries", JSON.stringify(entries.value));
      localStorage.setItem("user_settings", JSON.stringify(settings.value));
    } catch (err) {
      error.value = "Failed to save data";
      console.error("Failed to save to localStorage:", err);
    }
  };

  // Load entries from localStorage
  const loadEntries = () => {
    try {
      const savedEntries = localStorage.getItem("finance_entries");
      if (savedEntries) {
        const parsed = JSON.parse(savedEntries);
        if (Array.isArray(parsed)) entries.value = parsed;
      }
      const savedSettings = localStorage.getItem("user_settings");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.default_currency && parsed.display_unit)
          settings.value = parsed;
      }
    } catch (err) {
      console.error("Failed to load from localStorage:", err);
      error.value = "Failed to load data";
    }
  };

  // Toggle display unit
  const toggleDisplayUnit = () => {
    settings.value.display_unit =
      settings.value.display_unit === "fiat" ? "sats" : "fiat";
    saveEntries();
  };

  // Calculate totals
  const totals = computed<Totals>(() => {
    const incomeEntries = entries.value.filter((e) => e.type === "income");
    const expenseEntries = entries.value.filter((e) => e.type === "expense");

    const income = incomeEntries.reduce(
      (sum, entry) => sum + entry.amount_fiat,
      0
    );
    const expenses = expenseEntries.reduce(
      (sum, entry) => sum + entry.amount_fiat,
      0
    );
    const incomeSats = incomeEntries.reduce(
      (sum, entry) => sum + entry.amount_sats,
      0
    );
    const expensesSats = expenseEntries.reduce(
      (sum, entry) => sum + entry.amount_sats,
      0
    );

    return {
      income,
      expenses,
      balance: income - expenses,
      incomeSats,
      expensesSats,
      balanceSats: incomeSats - expensesSats,
    };
  });

  return {
    entries,
    settings,
    currentExchangeRate,
    isLoading,
    error,
    totals,
    addEntry,
    editEntry,
    deleteEntry,
    filterEntries,
    loadEntries,
    saveEntries,
    toggleDisplayUnit,
    fetchExchangeRate,
  };
}
