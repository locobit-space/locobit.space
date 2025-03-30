// composables/useFinance.ts
import { ref, computed } from "vue";
import type { FinanceEntry, UserSettings } from "~~/types";

export function useFinance() {
  const entries = ref<FinanceEntry[]>([
    {
      id: "1",
      user_id: "npub1mockuserid",
      type: "expense",
      amount_fiat: 50,
      amount_sats: 500000,
      fiat_currency: "USD",
      sats_per_fiat: 3857,
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
      amount_fiat: 100,
      amount_sats: 1000000,
      fiat_currency: "USD",
      sats_per_fiat: 3857,
      unit_input: "fiat",
      note: "Salary",
      tags: ["work", "salary"],
      visibility: "public",
      created_at: new Date('2024-01-01').toISOString(),
    },
    {
      id: "3",
      user_id: "npub1mockuserid",
      type: "expense",
      amount_fiat: 20,
      amount_sats: 200000,
      fiat_currency: "USD",
      sats_per_fiat: 3857,
      unit_input: "fiat",
      note: "Groceries",
      tags: ["food", "groceries"],
      visibility: "private",
      created_at: new Date('2024-02-01').toISOString(),
    },
  ]);
  const settings = ref<UserSettings>({
    default_currency: "USD",
    display_unit: "fiat",
  });

  const currentExchangeRate = ref(3857); // Default, would be fetched from API

  // Add a new entry
  const addEntry = (entry: Omit<FinanceEntry, "id" | "created_at">) => {
    const newEntry: FinanceEntry = {
      ...entry,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };

    // Calculate the other amount based on unit_input
    if (entry.unit_input === "fiat") {
      newEntry.amount_sats = entry.amount_fiat * entry.sats_per_fiat;
    } else {
      newEntry.amount_fiat = entry.amount_sats / entry.sats_per_fiat;
    }

    entries.value.unshift(newEntry);

    // In a real app, you'd save this to a database or localStorage
    saveEntries();

    return newEntry;
  };

  // Save entries to localStorage (or would be API in production)
  const saveEntries = () => {
    localStorage.setItem("finance_entries", JSON.stringify(entries.value));
    localStorage.setItem("user_settings", JSON.stringify(settings.value));
  };

  // Load entries from localStorage
  const loadEntries = () => {
    const savedEntries = localStorage.getItem("finance_entries");
    if (savedEntries) {
      entries.value = JSON.parse(savedEntries);
    }

    const savedSettings = localStorage.getItem("user_settings");
    if (savedSettings) {
      settings.value = JSON.parse(savedSettings);
    }
  };

  // Toggle display unit
  const toggleDisplayUnit = () => {
    settings.value.display_unit =
      settings.value.display_unit === "fiat" ? "sats" : "fiat";
    saveEntries();
  };

  // Get exchange rate (would fetch from API in production)
  const fetchExchangeRate = async (currency: string = "USD") => {
    // Mock API call - replace with real API
    return new Promise<number>((resolve) => {
      setTimeout(() => {
        // Mock rates
        const rates: Record<string, number> = {
          USD: 3857,
          THB: 109,
          EUR: 4200,
        };
        currentExchangeRate.value = rates[currency] || 3857;
        resolve(currentExchangeRate.value);
      }, 500);
    });
  };

  // Calculate totals
  const totals = computed(() => {
    const income = entries.value
      .filter((e) => e.type === "income")
      .reduce((sum, entry) => sum + entry.amount_fiat, 0);

    const expenses = entries.value
      .filter((e) => e.type === "expense")
      .reduce((sum, entry) => sum + entry.amount_fiat, 0);

    return {
      income,
      expenses,
      balance: income - expenses,
      incomeSats: entries.value
        .filter((e) => e.type === "income")
        .reduce((sum, entry) => sum + entry.amount_sats, 0),
      expensesSats: entries.value
        .filter((e) => e.type === "expense")
        .reduce((sum, entry) => sum + entry.amount_sats, 0),
      balanceSats:
        entries.value
          .filter((e) => e.type === "income")
          .reduce((sum, entry) => sum + entry.amount_sats, 0) -
        entries.value
          .filter((e) => e.type === "expense")
          .reduce((sum, entry) => sum + entry.amount_sats, 0),
    };
  });

  return {
    entries,
    settings,
    currentExchangeRate,
    totals,
    addEntry,
    loadEntries,
    saveEntries,
    toggleDisplayUnit,
    fetchExchangeRate,
  };
}
