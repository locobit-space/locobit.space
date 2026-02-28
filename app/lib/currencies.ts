/**
 * Comprehensive world currency list.
 * Exchange rates are fetched at runtime from:
 *   - BTC/USD: https://blockchain.info/ticker
 *   - USD→any: https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json
 *
 * Denomination tiers drive the quickAmount suggestions in the create form.
 */

export interface CurrencyInfo {
  code: string;   // ISO 4217 (uppercase)
  name: string;
  symbol: string;
  tier: "micro" | "large" | "medium" | "small";
  // micro  → 1 unit ≈ << 0.01 USD  (LAK, VND, IDR …)
  // large  → 1 unit ≈  0.01–0.1 USD (KRW, JPY, CLP …)
  // medium → 1 unit ≈  0.1–2 USD   (THB, CNY, MXN …)
  // small  → 1 unit ≈  2+ USD      (USD, EUR, GBP …)
}

export const WORLD_CURRENCIES: CurrencyInfo[] = [
  // ── Asia / Pacific ────────────────────────────────────
  { code: "LAK", name: "Lao Kip",               symbol: "₭",  tier: "micro"  },
  { code: "VND", name: "Vietnamese Dong",        symbol: "₫",  tier: "micro"  },
  { code: "IDR", name: "Indonesian Rupiah",      symbol: "Rp", tier: "micro"  },
  { code: "KHR", name: "Cambodian Riel",         symbol: "៛",  tier: "micro"  },
  { code: "MMK", name: "Myanmar Kyat",           symbol: "K",  tier: "micro"  },
  { code: "PYG", name: "Paraguayan Guaraní",     symbol: "₲",  tier: "micro"  },
  { code: "IRR", name: "Iranian Rial",           symbol: "﷼",  tier: "micro"  },
  { code: "UZS", name: "Uzbekistani Som",        symbol: "so'm", tier: "micro" },
  { code: "JPY", name: "Japanese Yen",           symbol: "¥",  tier: "large"  },
  { code: "KRW", name: "South Korean Won",       symbol: "₩",  tier: "large"  },
  { code: "CLP", name: "Chilean Peso",           symbol: "CLP", tier: "large" },
  { code: "COP", name: "Colombian Peso",         symbol: "COP", tier: "large" },
  { code: "PKR", name: "Pakistani Rupee",        symbol: "₨",  tier: "large"  },
  { code: "TWD", name: "Taiwan Dollar",          symbol: "NT$", tier: "large" },
  { code: "HUF", name: "Hungarian Forint",       symbol: "Ft",  tier: "large" },
  { code: "CZK", name: "Czech Koruna",           symbol: "Kč",  tier: "large" },
  { code: "ISK", name: "Icelandic Króna",        symbol: "kr",  tier: "large" },
  { code: "THB", name: "Thai Baht",              symbol: "฿",  tier: "medium" },
  { code: "CNY", name: "Chinese Yuan",           symbol: "¥",  tier: "medium" },
  { code: "MYR", name: "Malaysian Ringgit",      symbol: "RM",  tier: "medium" },
  { code: "PHP", name: "Philippine Peso",        symbol: "₱",  tier: "medium" },
  { code: "INR", name: "Indian Rupee",           symbol: "₹",  tier: "medium" },
  { code: "MXN", name: "Mexican Peso",           symbol: "$",  tier: "medium"  },
  { code: "HKD", name: "Hong Kong Dollar",       symbol: "HK$", tier: "medium" },
  { code: "SGD", name: "Singapore Dollar",       symbol: "S$", tier: "small"  },
  { code: "AUD", name: "Australian Dollar",      symbol: "A$", tier: "small"  },
  { code: "NZD", name: "New Zealand Dollar",     symbol: "NZ$", tier: "small" },
  { code: "CAD", name: "Canadian Dollar",        symbol: "CA$", tier: "small" },
  { code: "BND", name: "Brunei Dollar",          symbol: "B$", tier: "small"  },
  { code: "NPR", name: "Nepalese Rupee",         symbol: "₨",  tier: "medium" },
  { code: "LKR", name: "Sri Lankan Rupee",       symbol: "Rs", tier: "medium" },
  { code: "BDT", name: "Bangladeshi Taka",       symbol: "৳",  tier: "medium" },
  { code: "MVR", name: "Maldivian Rufiyaa",      symbol: "Rf", tier: "medium" },
  { code: "BTN", name: "Bhutanese Ngultrum",     symbol: "Nu", tier: "medium" },
  { code: "MNT", name: "Mongolian Tögrög",       symbol: "₮",  tier: "medium" },
  { code: "KZT", name: "Kazakhstani Tenge",      symbol: "₸",  tier: "medium" },
  { code: "KGS", name: "Kyrgyzstani Som",        symbol: "лв", tier: "medium" },
  { code: "TJS", name: "Tajikistani Somoni",     symbol: "SM", tier: "medium" },
  { code: "TMT", name: "Turkmenistani Manat",    symbol: "T",  tier: "medium" },
  { code: "AFN", name: "Afghan Afghani",         symbol: "؋",  tier: "medium" },
  { code: "GEL", name: "Georgian Lari",          symbol: "₾",  tier: "medium" },
  { code: "AMD", name: "Armenian Dram",          symbol: "֏",  tier: "large"  },
  { code: "AZN", name: "Azerbaijani Manat",      symbol: "₼",  tier: "small"  },
  { code: "IQD", name: "Iraqi Dinar",            symbol: "ع.د", tier: "large" },
  { code: "JOD", name: "Jordanian Dinar",        symbol: "JD", tier: "small"  },
  { code: "KWD", name: "Kuwaiti Dinar",          symbol: "KD", tier: "small"  },
  { code: "BHD", name: "Bahraini Dinar",         symbol: "BD", tier: "small"  },
  { code: "OMR", name: "Omani Rial",             symbol: "ر.ع", tier: "small" },
  { code: "QAR", name: "Qatari Riyal",           symbol: "ر.ق", tier: "medium"},
  { code: "SAR", name: "Saudi Riyal",            symbol: "ر.س", tier: "medium"},
  { code: "AED", name: "UAE Dirham",             symbol: "د.إ", tier: "medium"},
  { code: "ILS", name: "Israeli Shekel",         symbol: "₪",  tier: "medium" },
  { code: "TRY", name: "Turkish Lira",           symbol: "₺",  tier: "medium" },
  { code: "LBP", name: "Lebanese Pound",         symbol: "ل.ل", tier: "micro" },
  { code: "SYP", name: "Syrian Pound",           symbol: "£S", tier: "micro"  },
  { code: "YER", name: "Yemeni Rial",            symbol: "﷼",  tier: "micro"  },
  // ── Europe ───────────────────────────────────────────
  { code: "EUR", name: "Euro",                   symbol: "€",  tier: "small"  },
  { code: "GBP", name: "British Pound",          symbol: "£",  tier: "small"  },
  { code: "CHF", name: "Swiss Franc",            symbol: "Fr", tier: "small"  },
  { code: "NOK", name: "Norwegian Krone",        symbol: "kr", tier: "medium" },
  { code: "SEK", name: "Swedish Krona",          symbol: "kr", tier: "medium" },
  { code: "DKK", name: "Danish Krone",           symbol: "kr", tier: "medium" },
  { code: "PLN", name: "Polish Złoty",           symbol: "zł", tier: "medium" },
  { code: "RON", name: "Romanian Leu",           symbol: "lei", tier: "medium" },
  { code: "BGN", name: "Bulgarian Lev",          symbol: "лв", tier: "medium" },
  { code: "HRK", name: "Croatian Kuna",          symbol: "kn", tier: "medium" },
  { code: "RSD", name: "Serbian Dinar",          symbol: "РСД", tier: "large" },
  { code: "BAM", name: "Bosnian Mark",           symbol: "KM", tier: "medium" },
  { code: "MKD", name: "Macedonian Denar",       symbol: "ден", tier: "large" },
  { code: "ALL", name: "Albanian Lek",           symbol: "L",  tier: "large"  },
  { code: "MDL", name: "Moldovan Leu",           symbol: "L",  tier: "large"  },
  { code: "UAH", name: "Ukrainian Hryvnia",      symbol: "₴",  tier: "large"  },
  { code: "BYN", name: "Belarusian Ruble",       symbol: "Br", tier: "medium" },
  { code: "RUB", name: "Russian Ruble",          symbol: "₽",  tier: "large"  },
  // ── Americas ─────────────────────────────────────────
  { code: "USD", name: "US Dollar",              symbol: "$",  tier: "small"  },
  { code: "CAD", name: "Canadian Dollar",        symbol: "CA$", tier: "small" },
  { code: "BRL", name: "Brazilian Real",         symbol: "R$", tier: "medium" },
  { code: "ARS", name: "Argentine Peso",         symbol: "$",  tier: "large"  },
  { code: "PEN", name: "Peruvian Sol",           symbol: "S/", tier: "medium" },
  { code: "BOB", name: "Bolivian Boliviano",     symbol: "Bs", tier: "medium" },
  { code: "UYU", name: "Uruguayan Peso",         symbol: "$U", tier: "large"  },
  { code: "VES", name: "Venezuelan Bolívar",     symbol: "Bs.S", tier: "large"},
  { code: "CUP", name: "Cuban Peso",             symbol: "$",  tier: "large"  },
  { code: "DOP", name: "Dominican Peso",         symbol: "RD$", tier: "large" },
  { code: "GTQ", name: "Guatemalan Quetzal",     symbol: "Q",  tier: "medium" },
  { code: "HNL", name: "Honduran Lempira",       symbol: "L",  tier: "medium" },
  { code: "NIO", name: "Nicaraguan Córdoba",      symbol: "C$", tier: "medium" },
  { code: "CRC", name: "Costa Rican Colón",      symbol: "₡",  tier: "large"  },
  { code: "PAB", name: "Panamanian Balboa",      symbol: "B/.", tier: "small" },
  { code: "JMD", name: "Jamaican Dollar",        symbol: "J$", tier: "large"  },
  { code: "TTD", name: "Trinidad Dollar",        symbol: "TT$", tier: "large" },
  { code: "BSD", name: "Bahamian Dollar",        symbol: "B$", tier: "small"  },
  { code: "BBD", name: "Barbadian Dollar",       symbol: "Bds$", tier: "small"},
  { code: "HTG", name: "Haitian Gourde",         symbol: "G",  tier: "large"  },
  // ── Africa ───────────────────────────────────────────
  { code: "ZAR", name: "South African Rand",     symbol: "R",  tier: "medium" },
  { code: "NGN", name: "Nigerian Naira",         symbol: "₦",  tier: "medium" },
  { code: "KES", name: "Kenyan Shilling",        symbol: "KSh", tier: "large" },
  { code: "GHS", name: "Ghanaian Cedi",          symbol: "₵",  tier: "medium" },
  { code: "ETB", name: "Ethiopian Birr",         symbol: "Br", tier: "medium" },
  { code: "EGP", name: "Egyptian Pound",         symbol: "E£", tier: "medium" },
  { code: "MAD", name: "Moroccan Dirham",        symbol: "MAD", tier: "medium"},
  { code: "TND", name: "Tunisian Dinar",         symbol: "DT", tier: "medium" },
  { code: "DZD", name: "Algerian Dinar",         symbol: "DA", tier: "large"  },
  { code: "LYD", name: "Libyan Dinar",           symbol: "LD", tier: "medium" },
  { code: "SDG", name: "Sudanese Pound",         symbol: "SDG", tier: "large" },
  { code: "TZS", name: "Tanzanian Shilling",     symbol: "TSh", tier: "large" },
  { code: "UGX", name: "Ugandan Shilling",       symbol: "USh", tier: "micro" },
  { code: "RWF", name: "Rwandan Franc",          symbol: "RF", tier: "micro"  },
  { code: "BIF", name: "Burundian Franc",        symbol: "Fr", tier: "micro"  },
  { code: "MGA", name: "Malagasy Ariary",        symbol: "Ar", tier: "large"  },
  { code: "MZN", name: "Mozambican Metical",     symbol: "MT", tier: "large"  },
  { code: "ZMW", name: "Zambian Kwacha",         symbol: "ZK", tier: "medium" },
  { code: "MWK", name: "Malawian Kwacha",        symbol: "MK", tier: "micro"  },
  { code: "AOA", name: "Angolan Kwanza",         symbol: "Kz", tier: "large"  },
  { code: "CDF", name: "Congolese Franc",        symbol: "Fr", tier: "micro"  },
  { code: "XOF", name: "West African CFA Franc", symbol: "Fr", tier: "large"  },
  { code: "XAF", name: "Central African CFA",    symbol: "Fr", tier: "large"  },
  { code: "XPF", name: "CFP Franc",             symbol: "Fr", tier: "large"  },
  // ── Oceania ──────────────────────────────────────────
  { code: "FJD", name: "Fijian Dollar",          symbol: "FJ$", tier: "medium"},
  { code: "PGK", name: "Papua New Guinea Kina",  symbol: "K",  tier: "medium" },
  { code: "SBD", name: "Solomon Islands Dollar", symbol: "SI$", tier: "medium"},
  { code: "VUV", name: "Vanuatu Vatu",           symbol: "VT", tier: "large"  },
  { code: "WST", name: "Samoan Tālā",            symbol: "WS$", tier: "medium"},
  { code: "TOP", name: "Tongan Paʻanga",         symbol: "T$", tier: "medium" },
  // ── Crypto ───────────────────────────────────────────
  { code: "BTC", name: "Bitcoin",                symbol: "₿",  tier: "small"  },
];

/** Quick-amount suggestions keyed by denomination tier */
export const QUICK_AMOUNTS_BY_TIER: Record<CurrencyInfo["tier"], number[]> = {
  micro:  [10_000, 50_000, 100_000, 500_000, 1_000_000, 5_000_000],
  large:  [1_000,   5_000,  10_000,  50_000,   100_000,   500_000],
  medium: [20,       50,     100,     200,        500,      1_000],
  small:  [5,        10,      20,      50,        100,        200],
};

/** Returns quick-amounts for a given currency code */
export const getCurrencyQuickAmounts = (code: string): number[] => {
  const info = WORLD_CURRENCIES.find((c) => c.code === code);
  const tier = info?.tier ?? "small";
  return QUICK_AMOUNTS_BY_TIER[tier];
};

/** Returns symbol for a given currency code, defaulting to the code itself */
export const getCurrencySymbol = (code: string): string => {
  return WORLD_CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
};

/** All codes as a plain string array (for select options) */
export const ALL_CURRENCY_CODES: string[] = WORLD_CURRENCIES.map((c) => c.code);

/** Deduped WORLD_CURRENCIES (CAD appears twice intentionally for ordering; dedupe here) */
export const UNIQUE_CURRENCIES: CurrencyInfo[] = WORLD_CURRENCIES.filter(
  (c, i, arr) => arr.findIndex((x) => x.code === c.code) === i,
);
