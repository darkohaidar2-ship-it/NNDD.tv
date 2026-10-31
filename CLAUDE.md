# KOBIN.TV / NNDD TV - CLAUDE ARCHITECTURAL INSTRUCTIONS

This codebase contains strict architectural rules mandated by the project owner.
Do NOT modify, remove, or simplify the core architectural features without explicit user approval:

1. **Landscape Orientation Lock:** Always keep `sensorLandscape` on Android and enforce landscape mode during live TV.
2. **5-Second Zapping Delay & Dual-Player Preload:** Background player loads next stream; instant first-frame transition with 0 black screen.
3. **Double-Press OK for Channel Drawer:** 1st click starts countdown while drawer stays open; 2nd click commits and closes.
4. **Data Saver Mode:** Preserved in `localStorage('nndd_data_saver_mode')`.
5. **Tri-Lingual Virtual Keyboard:** Kurdish, Arabic, and English 1-click toggles.
6. **60-Second Dashboard Sleep State:** 5 white ocean wave dots after 60s inactivity.
7. **PIN 0000 Lock for Channel Editing:** Channel 1 permanently pinned at #1; protected behind PIN 0000.
8. **Dashboard & Drawer Scale Sliders:** Settings panel controls dock scale (70%-130%) and drawer width.
9. **4K Video Background & Supabase Realtime Sync:** Syncs via Supabase table `kobin_settings` (key: `theme_config`) and IndexedDB.
10. **Universal Android TV + Tablet + Mobile Launcher:** Non-destructive `.TvLauncherAlias`, `RoleManager.ROLE_HOME`, and 2FA PIN exit.
11. **7-Day EPG Guide & TMDB Metadata Enrichment:** Multi-day EPG modal and automated movie/series enrichment.

## Build Commands
- Frontend build: `cmd.exe /c "npm run build"`
- Capacitor sync: `cmd.exe /c "npx cap copy android"`
- Android APK build: `cmd.exe /c "cd android && gradlew.bat assembleDebug"`
