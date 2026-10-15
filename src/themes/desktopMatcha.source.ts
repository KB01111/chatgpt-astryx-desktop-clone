import { defineTheme, tokenDefaults } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import {
  matchaTheme,
  matchaIconRegistry,
} from "@astryxdesign/theme-matcha/built";

// Keep the desktop's size budget stable while using Matcha's official palette and fonts.
const desktopGeometry = Object.fromEntries(
  Object.entries({ ...tokenDefaults, ...neutralTheme.tokens }).filter(
    ([token]) => /^--(?:spacing|font-size|text|radius|size)-/.test(token),
  ),
);

export const desktopMatchaTheme = defineTheme({
  name: "desktop-matcha",
  extends: matchaTheme,
  tokens: desktopGeometry,
  icons: matchaIconRegistry,
});
