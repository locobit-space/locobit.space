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

  return {
    settings,
    updateSetting,
    resetSettings,
  };
};
