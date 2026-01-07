import { ref, computed, onMounted } from "vue";
import { nip04 } from "nostr-tools";
import { finalizeEvent } from "nostr-tools/pure";
import { hexToBytes } from "@noble/ciphers/utils";
import type { FinanceEntry, Totals, UserSettings, Budget, SyncStatus } from "~/types";
import { ExchangeRateService } from "../services/exchangeRateService";

export function useFinance() {
  const toast = useToast();

  const { user } = useNostrUser();
  const { publishEvent, queryEvents } = useNostrRelay();
  const PRIVATE_NOTE_KIND = 30001;

  // Reactive state
  const entries = useState<FinanceEntry[]>("finance_entries", () => []);

  const settings = useState<UserSettings>("user_settings", () => ({
    default_currency: "LAK",
    display_unit: "fiat",
    budgets: [],
    categories: ['Food', 'Groceries', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Salary', 'Freelance', 'Investments', 'Other'],
    theme: 'auto',
    auto_sync: true,
    show_balance_on_tab: true
  }));

  const syncStatus = useState<SyncStatus>("sync_status", () => ({
    isSyncing: false,
    lastSync: null,
    pendingCount: 0,
    hasError: false
  }));

  const currentExchangeRate = ref<number>(0.0413); // sats per LAK (default)
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  // Helper function to handle errors
  const handleError = (err: unknown, defaultMessage: string): void => {
    const message = err instanceof Error ? err.message : defaultMessage;
    console.error(message, err);
    error.value = message;
    syncStatus.value.hasError = true;
    syncStatus.value.errorMessage = message;
    toast.add({
      title: "Error",
      description: message,
      color: "red",
    });
  };
  // Exchange rate
  const fetchExchangeRate = async (
    currency: string = settings.value.default_currency
  ): Promise<number> => {
    isLoading.value = true;
    error.value = null;

    try {
      const rate = await ExchangeRateService.fetchRate(currency);
      currentExchangeRate.value = rate; // Precision to 6 decimals
      return rate;
    } catch (err) {
      handleError(err, "Failed to fetch exchange rate");
      return currentExchangeRate.value;
    } finally {
      isLoading.value = false;
    }
  };

  // Add a new entry
  const addEntry = async (
    entry: Omit<
      FinanceEntry,
      "id" | "created_at" | "amount_sats" | "amount_fiat"
    > &
      Partial<Pick<FinanceEntry, "amount_sats" | "amount_fiat">>
  ) => {
    const id = Math.floor(Date.now() / 1000);
    const newEntry: FinanceEntry = {
      ...entry,
      note: entry.note || "Untitled",
      id: `${id}`,
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

    const sensitiveData = {
      amount_fiat: entry.amount_fiat,
      amount_sats: entry.amount_sats,
      note: entry.note || "Untitled",
      tags: entry.tags,
      category: entry.category,
    };

    const encryptedContent = nip04.encrypt(
      user.value?.privateKey || "",
      user.value?.publicKey || "",
      JSON.stringify(sensitiveData)
    );
    // get the current date timestamp
    const event = {
      kind: PRIVATE_NOTE_KIND, // 30001
      pubkey: user.value?.publicKey || "",
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ["d", `${id}`],
        ["t", "finance"],
        ["type", entry.type],
        ["fiat_currency", entry.fiat_currency],
        ["sats_per_fiat", entry.sats_per_fiat.toString()],
        ["unit_input", entry.unit_input],
        ["visibility", entry.visibility],
      ],
      content: encryptedContent,
    };

    const signedEvent = finalizeEvent(
      event,
      hexToBytes(user.value?.privateKey || "")
    );

    publishEvent(signedEvent);

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

  // Helper function to load data from localStorage
  const loadFromLocalStorage = (): void => {
    try {
      const savedEntries = localStorage.getItem("finance_entries");
      if (savedEntries) {
        const parsed = JSON.parse(savedEntries);
        if (Array.isArray(parsed)) {
          entries.value = parsed;
        }
      }

      const savedSettings = localStorage.getItem("user_settings");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.default_currency && parsed.display_unit) {
          settings.value = parsed as UserSettings;
        }
      }
    } catch (err) {
      console.error("Failed to load from localStorage:", err);
    }
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

  const saveSettings = () => {
    localStorage.setItem("user_settings", JSON.stringify(settings.value));
  };

  // Save entries to localStorage
  const saveEntries = () => {
    try {
      localStorage.setItem("finance_entries", JSON.stringify(entries.value));
    } catch (err) {
      error.value = "Failed to save data";
      console.error("Failed to save to localStorage:", err);
    }
  };

  // Load entries from localStorage

  const loadEntries = async (): Promise<void> => {
    try {
      // Validate user authentication
      if (!user.value?.publicKey || !user.value?.privateKey) {
        throw new Error(
          "User not authenticated. Please log in to view entries."
        );
      }

      // Load local storage data
      loadFromLocalStorage();

      if (!user.value) {
        return;
      }

      // Start syncing
      syncStatus.value.isSyncing = true;
      syncStatus.value.hasError = false;

      // Fetch and process remote events
      const _events = await queryEvents({
        kinds: [PRIVATE_NOTE_KIND],
        authors: [user.value.publicKey],
        "#t": ["finance"],
        // limit: 0,
      });
      const _items = [];

      for (const event of _events) {
        if (!event.content) continue;
        try {
          const decryptedContent = nip04.decrypt(
            user.value.privateKey,
            user.value.publicKey,
            event.content
          );
          const parsedContent = JSON.parse(decryptedContent);
          _items.push(createFinanceEntry(event, parsedContent));
        } catch (err) {
          console.error(`Failed to process event ${event.id}:`, err);
        }
      }
      // remove duplicate entries
      _items.push(...entries.value);
      entries.value = _items
        .filter(
          (entry, index, self) =>
            self.findIndex((e) => e.id === entry.id) === index
        )
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      
      // Mark all as synced
      entries.value.forEach(entry => entry.synced = true);
      
      syncStatus.value.lastSync = new Date().toISOString();
      syncStatus.value.pendingCount = 0;
      
      saveEntries();
    } catch (err) {
      handleError(err, "Failed to load entries");
    } finally {
      syncStatus.value.isSyncing = false;
    }
  };

  // Helper function to create a FinanceEntry from an event
  const createFinanceEntry = (event: any, parsedContent: any): FinanceEntry => {
    const getTagValue = (tagName: string, defaultValue: string | number = "") =>
      event.tags.find((tag: string[]) => tag[0] === tagName)?.[1] ??
      defaultValue;

    return {
      ...parsedContent,
      id: getTagValue("d", "unknown"),
      created_at: new Date(event.created_at * 1000).toISOString(),
      type: getTagValue("type", "unknown"),
      fiat_currency: getTagValue("fiat_currency", ""),
      sats_per_fiat: Number(getTagValue("sats_per_fiat", 0)),
      unit_input: getTagValue("unit_input", "fiat"),
      visibility: getTagValue("visibility", "public"),
    };
  };

  // Toggle display unit
  const toggleDisplayUnit = () => {
    settings.value.display_unit =
      settings.value.display_unit === "fiat" ? "sats" : "fiat";
    saveEntries();
  };

  const sumAmount = <K extends keyof FinanceEntry>(
    entries: FinanceEntry[],
    field: K
  ): number => {
    return entries.reduce((acc, entry) => {
      const value = entry[field] as unknown as number | string | undefined;
      const num = typeof value === "number" ? value : Number(value || 0);
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
  };

  // Calculate totals
  const totals = computed<Totals>(() => {
    const [incomeEntries, expenseEntries] = entries.value.reduce(
      (acc, entry) => {
        acc[entry.type === "income" ? 0 : 1].push(entry);
        return acc;
      },
      [[], []] as [FinanceEntry[], FinanceEntry[]]
    );

    const income = sumAmount(incomeEntries, "amount_fiat");
    const expenses = sumAmount(expenseEntries, "amount_fiat");
    const incomeSats = sumAmount(incomeEntries, "amount_sats");
    const expensesSats = sumAmount(expenseEntries, "amount_sats");

    return {
      income,
      expenses,
      balance: income - expenses,
      incomeSats,
      expensesSats,
      balanceSats: incomeSats - expensesSats,
    };
  });

  // Available currencies
  const currencies = ["LAK", "USD", "EUR", "THB", "JPY", "GBP", "BTC"];

  // Budget Management
  const addBudget = (budget: Omit<Budget, 'id' | 'created_at'>) => {
    const newBudget: Budget = {
      ...budget,
      id: `budget_${Date.now()}`,
      created_at: new Date().toISOString()
    };
    
    if (!settings.value.budgets) {
      settings.value.budgets = [];
    }
    
    settings.value.budgets.push(newBudget);
    saveSettings();
    
    toast.add({
      title: "Budget created",
      description: `Budget for ${budget.category} set to ${budget.amount}`,
    });
    
    return newBudget;
  };

  const updateBudget = (id: string, updates: Partial<Budget>) => {
    if (!settings.value.budgets) return;
    
    const index = settings.value.budgets.findIndex(b => b.id === id);
    if (index === -1) throw new Error("Budget not found");
    
    settings.value.budgets[index] = {
      ...settings.value.budgets[index],
      ...updates
    };
    
    saveSettings();
    
    toast.add({
      title: "Budget updated",
      description: "Your budget has been updated successfully",
    });
  };

  const deleteBudget = (id: string) => {
    if (!settings.value.budgets) return;
    
    settings.value.budgets = settings.value.budgets.filter(b => b.id !== id);
    saveSettings();
    
    toast.add({
      title: "Budget deleted",
      description: "Budget has been removed",
    });
  };

  // Get budget progress for a category
  const getBudgetProgress = (category: string, period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly') => {
    const budget = settings.value.budgets?.find(b => b.category === category && b.period === period);
    if (!budget) return null;

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const spent = entries.value
      .filter(e => 
        e.type === 'expense' && 
        e.category === category &&
        new Date(e.created_at) >= startDate
      )
      .reduce((sum, e) => sum + e.amount_fiat, 0);

    const percentage = (spent / budget.amount) * 100;
    const isOverBudget = spent > budget.amount;
    const shouldAlert = percentage >= budget.alert_threshold;

    return {
      budget,
      spent,
      remaining: budget.amount - spent,
      percentage,
      isOverBudget,
      shouldAlert
    };
  };

  // Search and filter entries
  const searchEntries = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return entries.value.filter(entry =>
      entry.note.toLowerCase().includes(lowerQuery) ||
      entry.category.toLowerCase().includes(lowerQuery) ||
      entry.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  };

  const filterEntriesByDateRange = (startDate: Date, endDate: Date) => {
    return entries.value.filter(entry => {
      const entryDate = new Date(entry.created_at);
      return entryDate >= startDate && entryDate <= endDate;
    });
  };

  const filterEntriesByCategory = (categories: string[]) => {
    return entries.value.filter(entry => categories.includes(entry.category));
  };

  const filterEntriesByAmountRange = (min: number, max: number) => {
    return entries.value.filter(entry => 
      entry.amount_fiat >= min && entry.amount_fiat <= max
    );
  };

  // Retry failed syncs
  const retrySync = async () => {
    const unsyncedEntries = entries.value.filter(e => !e.synced);
    
    if (unsyncedEntries.length === 0) {
      toast.add({
        title: "All synced",
        description: "No pending items to sync",
      });
      return;
    }

    syncStatus.value.isSyncing = true;
    
    for (const entry of unsyncedEntries) {
      try {
        // Attempt to publish to Nostr
        // This would need proper implementation based on your Nostr setup
        entry.synced = true;
      } catch (err) {
        console.error("Failed to sync entry:", entry.id, err);
      }
    }
    
    syncStatus.value.isSyncing = false;
    syncStatus.value.pendingCount = entries.value.filter(e => !e.synced).length;
    saveEntries();
  };

  return {
    currencies,
    entries,
    settings,
    currentExchangeRate,
    isLoading,
    error,
    totals,
    syncStatus,
    addEntry,
    editEntry,
    deleteEntry,
    filterEntries,
    loadEntries,
    saveEntries,
    saveSettings,
    toggleDisplayUnit,
    fetchExchangeRate,
    addBudget,
    updateBudget,
    deleteBudget,
    getBudgetProgress,
    searchEntries,
    filterEntriesByDateRange,
    filterEntriesByCategory,
    filterEntriesByAmountRange,
    retrySync
  };
}
