import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

const STORAGE_KEY = "upjobs-a11y-v1";

export type TextScale = "base" | "lg" | "xl";
/** system = segue prefers-reduced-motion; on/off = forçado */
export type ReduceMotionPreference = "system" | "on" | "off";

export type AccessibilityPreferences = {
  textScale: TextScale;
  highContrast: boolean;
  reduceMotion: ReduceMotionPreference;
  readingSpacing: boolean;
  underlineLinks: boolean;
  strongFocus: boolean;
};

const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  textScale: "base",
  highContrast: false,
  reduceMotion: "system",
  readingSpacing: false,
  underlineLinks: false,
  strongFocus: false,
};

function loadStored(): Partial<AccessibilityPreferences> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AccessibilityPreferences>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeMotion(
  value: unknown,
): ReduceMotionPreference | undefined {
  if (value === "system" || value === "on" || value === "off") return value;
  if (value === true) return "on";
  if (value === false) return "off";
  return undefined;
}

function normalizeTextScale(value: unknown): TextScale | undefined {
  if (value === "base" || value === "lg" || value === "xl") return value;
  return undefined;
}

function mergeWithDefaults(
  partial: Partial<AccessibilityPreferences> | null,
): AccessibilityPreferences {
  if (!partial) return { ...DEFAULT_PREFERENCES };
  return {
    textScale: normalizeTextScale(partial.textScale) ?? DEFAULT_PREFERENCES.textScale,
    highContrast:
      typeof partial.highContrast === "boolean"
        ? partial.highContrast
        : DEFAULT_PREFERENCES.highContrast,
    reduceMotion:
      normalizeMotion(partial.reduceMotion) ?? DEFAULT_PREFERENCES.reduceMotion,
    readingSpacing:
      typeof partial.readingSpacing === "boolean"
        ? partial.readingSpacing
        : DEFAULT_PREFERENCES.readingSpacing,
    underlineLinks:
      typeof partial.underlineLinks === "boolean"
        ? partial.underlineLinks
        : DEFAULT_PREFERENCES.underlineLinks,
    strongFocus:
      typeof partial.strongFocus === "boolean"
        ? partial.strongFocus
        : DEFAULT_PREFERENCES.strongFocus,
  };
}

function computeMotionReduce(
  pref: ReduceMotionPreference,
  systemPrefersReduce: boolean,
): boolean {
  if (pref === "on") return true;
  if (pref === "off") return false;
  return systemPrefersReduce;
}

function applyDocumentAttributes(
  prefs: AccessibilityPreferences,
  systemPrefersReduce: boolean,
) {
  const root = document.documentElement;
  const motionReduce = computeMotionReduce(prefs.reduceMotion, systemPrefersReduce);

  root.dataset.a11yTextScale = prefs.textScale;
  root.dataset.a11yContrast = prefs.highContrast ? "high" : "normal";
  root.dataset.a11yMotion = motionReduce ? "reduce" : "normal";
  root.dataset.a11ySpacing = prefs.readingSpacing ? "relaxed" : "normal";
  root.dataset.a11yLinks = prefs.underlineLinks ? "underline" : "default";
  root.dataset.a11yFocus = prefs.strongFocus ? "strong" : "default";
}

type AccessibilityContextValue = {
  preferences: AccessibilityPreferences;
  setTextScale: (v: TextScale) => void;
  setHighContrast: (v: boolean) => void;
  setReduceMotion: (v: ReduceMotionPreference) => void;
  setReadingSpacing: (v: boolean) => void;
  setUnderlineLinks: (v: boolean) => void;
  setStrongFocus: (v: boolean) => void;
  resetPreferences: () => void;
  /** reflects system flag when reduceMotion is "system" */
  systemPrefersReducedMotion: boolean;
};

const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(
  undefined,
);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() =>
    mergeWithDefaults(typeof window !== "undefined" ? loadStored() : null),
  );

  const [systemPrefersReducedMotion, setSystemPrefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setSystemPrefersReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useLayoutEffect(() => {
    applyDocumentAttributes(preferences, systemPrefersReducedMotion);
  }, [preferences, systemPrefersReducedMotion]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      /* ignore quota */
    }
  }, [preferences]);

  const setTextScale = useCallback((textScale: TextScale) => {
    setPreferences((p) => ({ ...p, textScale }));
  }, []);

  const setHighContrast = useCallback((highContrast: boolean) => {
    setPreferences((p) => ({ ...p, highContrast }));
  }, []);

  const setReduceMotion = useCallback((reduceMotion: ReduceMotionPreference) => {
    setPreferences((p) => ({ ...p, reduceMotion }));
  }, []);

  const setReadingSpacing = useCallback((readingSpacing: boolean) => {
    setPreferences((p) => ({ ...p, readingSpacing }));
  }, []);

  const setUnderlineLinks = useCallback((underlineLinks: boolean) => {
    setPreferences((p) => ({ ...p, underlineLinks }));
  }, []);

  const setStrongFocus = useCallback((strongFocus: boolean) => {
    setPreferences((p) => ({ ...p, strongFocus }));
  }, []);

  const resetPreferences = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setPreferences({ ...DEFAULT_PREFERENCES });
  }, []);

  const value = useMemo(
    () => ({
      preferences,
      setTextScale,
      setHighContrast,
      setReduceMotion,
      setReadingSpacing,
      setUnderlineLinks,
      setStrongFocus,
      resetPreferences,
      systemPrefersReducedMotion,
    }),
    [
      preferences,
      setTextScale,
      setHighContrast,
      setReduceMotion,
      setReadingSpacing,
      setUnderlineLinks,
      setStrongFocus,
      resetPreferences,
      systemPrefersReducedMotion,
    ],
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error("useAccessibility must be used within AccessibilityProvider");
  }
  return ctx;
}
