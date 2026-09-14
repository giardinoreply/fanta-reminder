import type { ScreenItem, ScreenKey } from "../../types/app";

export const SCREEN_ITEMS: ScreenItem[] = [
  { key: "home", label: "Home" },
  { key: "calendar", label: "Calendario" },
  { key: "lineup", label: "Lineup" },
  { key: "settings", label: "Impostazioni" },
  { key: "test", label: "Test" },
];

export function getScreenLabel(screen: ScreenKey): string {
  return SCREEN_ITEMS.find((item) => item.key === screen)?.label ?? "Home";
}
