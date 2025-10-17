import { ref, computed, onMounted } from "vue";
import { nip04 } from "nostr-tools";
import { finalizeEvent } from "nostr-tools/pure";
import { hexToBytes } from "@noble/ciphers/utils";
import type { FinanceEntry, Totals, UserSettings } from "~/types";
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
  }));

  const currentExchangeRate = ref<number>(0.0413); // sats per LAK (default)
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  // Helper function to handle errors
  const handleError = (err: unknown, defaultMessage: string): void => {
    const message = err instanceof Error ? err.message : defaultMessage;
    console.error(message, err);
    error.value = message;
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
    } catch (err) {
      handleError(err, "Failed to load entries");
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

  return {
    currencies,
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
    saveSettings,
    toggleDisplayUnit,
    fetchExchangeRate,
  };
}
