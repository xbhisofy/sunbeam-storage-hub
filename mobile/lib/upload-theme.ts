import { homeTheme } from "./home-theme";
import { theme } from "./theme";
// Upload-only visual roles; existing native and web themes remain unchanged.
export const uploadTheme = { ...homeTheme, overlay: theme.overlay, success: theme.success };