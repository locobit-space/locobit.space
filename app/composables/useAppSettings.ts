// ─── Shared nav item registry ────────────────────────────────
export interface NavItem {
  key: string;
  label: string;
  icon: string;
  to: string;
  description?: string;
  /** Items marked required cannot be hidden */
  required?: boolean;
}

export const ALL_NAV_ITEMS: NavItem[] = [
  {
    key: "feed",
    label: "Feed",
    icon: "solar:home-2-linear",
    to: "/feed",
    description: "Your social timeline",
    required: true,
  },
  {
    key: "discover",
    label: "Discover",
    icon: "solar:magnifer-linear",
    to: "/discover",
    description: "Find new content",
  },
  {
    key: "shorts",
    label: "Shorts",
    icon: "solar:clapperboard-play-linear",
    to: "/shorts",
    description: "Short video clips",
  },
  {
    key: "locosats",
    label: "Sats Wallet",
    icon: "solar:wallet-linear",
    to: "/locosats",
    description: "Lightning payments",
  },
  {
    key: "journals",
    label: "Journals",
    icon: "solar:notebook-linear",
    to: "/journals",
    description: "Personal diary & notes",
  },
  {
    key: "bookmarks",
    label: "Bookmarks",
    icon: "solar:bookmark-linear",
    to: "/bookmarks",
    description: "Saved items",
  },
  {
    key: "gms",
    label: "Garden",
    icon: "mynaui:sprout",
    to: "/garden",
    description: "Plant management",
  },
  {
    key: "gardenos",
    label: "GardenOS",
    icon: "solar:cpu-linear",
    to: "/garden-os",
    description: "IoT mesh & sensors",
  },
  {
    key: "settings",
    label: "Settings",
    icon: "solar:settings-linear",
    to: "/settings",
    description: "App preferences",
    required: true,
  },
];

export interface AppSettings {
  // Interface
  feedDensity: "comfortable" | "compact";
  reduceMotion: boolean;
  hideAvatars: boolean;

  // Preferences
  showSensitiveContent: boolean;
  blurSensitiveContent: boolean; // if true, blur instead of hide
  defaultFeed: "for-you" | "following" | "trending";
  autoplayMedia: "always" | "wifi" | "never";
  easyScroll: boolean;

  // Privacy
  defaultZapAmount: number;

  // Navigation
  hiddenNavItems: string[];
}

const DEFAULT_SETTINGS: AppSettings = {
  feedDensity: "comfortable",
  reduceMotion: false,
  hideAvatars: false,

  showSensitiveContent: false,
  blurSensitiveContent: true,
  defaultFeed: "for-you",
  autoplayMedia: "always",
  easyScroll: true,

  defaultZapAmount: 21,

  hiddenNavItems: [],
};

export const useAppSettings = () => {
  // Initialize state from localStorage if available
  const settings = useState<AppSettings>("appSettings", () => {
    if (import.meta.client) {
      const stored = localStorage.getItem("appSettings");
      if (stored) {
        try {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        } catch (e) {
          console.error("Failed to parse settings", e);
        }
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Watch for changes and save to localStorage
  watch(
    settings,
    (newSettings) => {
      if (import.meta.client) {
        localStorage.setItem("appSettings", JSON.stringify(newSettings));
      }
    },
    { deep: true },
  );

  // Actions
  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    settings.value[key] = value;
  };

  const resetSettings = () => {
    settings.value = { ...DEFAULT_SETTINGS };
  };

  // Nav visibility helpers
  const isNavItemVisible = (key: string) =>
    !settings.value.hiddenNavItems.includes(key);

  const toggleNavItem = (key: string) => {
    const item = ALL_NAV_ITEMS.find((i) => i.key === key);
    if (item?.required) return; // cannot hide required items
    const hidden = settings.value.hiddenNavItems;
    const idx = hidden.indexOf(key);
    if (idx === -1) {
      settings.value.hiddenNavItems = [...hidden, key];
    } else {
      settings.value.hiddenNavItems = hidden.filter((k) => k !== key);
    }
  };

  const visibleNavItems = computed(() =>
    ALL_NAV_ITEMS.filter((item) => isNavItemVisible(item.key)),
  );

  return {
    settings,
    updateSetting,
    resetSettings,
    isNavItemVisible,
    toggleNavItem,
    visibleNavItems,
  };
};
