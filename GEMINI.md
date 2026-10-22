# DABIN.TV / NNDD TV - STRICT PROJECT RULES & PERMANENT ARCHITECTURAL SPECIFICATIONS

> [!CAUTION]
> DO NOT MODIFY, REMOVE, OR SIMPLIFY ANY OF THE FOLLOWING 8 CORE FEATURES WITHOUT THE EXPLICIT APPROVAL AND INFORMING OF THE USER.
> USER MANDATE: "ئەم سکیڵانە هەمووی خەزن بکە ئیتر بێ رەزامەندی من و ئاگەدار کردنەوەم دەستکاریان مەکە".

---

## 1. Landscape Lock (قوفڵ کردنی لاند سکەیپ)
- During Live TV playback on mobile/tablet devices or mobile browsers in portrait orientation, automatically enforce landscape mode or display the floating action button: `🔒 قوفڵکردنی لاندسکەیپ (Landscape Lock)`.
- When triggered, it requests fullscreen and locks orientation to landscape (`screen.orientation.lock('landscape')`).
- In the Android Capacitor project (`android/app/src/main/AndroidManifest.xml`), `android:screenOrientation="sensorLandscape"` must always remain intact.

---

## 2. 5-Second Zapping Delay & Dual-Player Preload (زواپینگ بەس ٥ چرکەیی بە پلەیەر لە باکگراوند)
- When changing channels via TV Remote / Keyboard (Arrow Up / Down) OR selecting in the Channel List Drawer:
- The target channel is previewed in a translucent glassmorphic badge with:
  - Channel Number
  - Circular animated countdown SVG ring (`animate-ring-countdown-5s`)
  - Target Channel Logo centered directly inside the ring
  - Target Channel Name
  - Dedicated countdown badge: `{countdownRemaining}s` (counting down from 5 to 0)
- **Dual-Player Background Preloading:** The inactive player slot begins loading and decoding the next stream in the background while the active stream plays uninterrupted.
- **First Frame Cut ("لەگەڵ یەکەم فرەیم بێتە بەر دیدەی بینەران"):** As soon as the first frame is decoded and rendered in the background player, it instantly transitions to the viewer's sight with zero black screen.
- When 5 seconds elapse without interruption, the switch commits automatically.
- If the user presses OK / Enter before the 5 seconds elapse, the switch commits immediately.

---

## 3. Double-Press OK for Channel Drawer (دوو جار ئۆکەی بۆ داخستنی لیستی کەناڵ)
- **1st OK / Click on a channel in the drawer:**
  - Starts the 5-second zapping countdown on that channel.
  - The drawer **REMAINS OPEN** so the user can continue browsing.
  - The channel row displays an active countdown badge: `[ping dot] {countdownRemaining}s`.
- **2nd OK / Click on the same channel (or repeated Enter while countdown active):**
  - Immediately commits the switch to that channel.
  - Immediately closes the Channel List Drawer (`setShowChannelDrawer(false)`).
- Clicking or pressing OK on the currently playing channel immediately closes the drawer without switching.

---

## 4. Data Saver Mode (مۆدی کەم کردنەوەی مەسروفی ئینتەرنێت)
- Full quality and bandwidth control persisted in `localStorage('nndd_data_saver_mode')`:
  - `auto`: Full HD / 4K (Maximum quality with auto-ABR).
  - `720p`: Standard HD 720p cap.
  - `data_saver`: Low 480p cap for 4G mobile data saving.
- Controlled via dedicated UI cards in the Settings tab (`activeTab === 'settings'`) and toggles in Live TV quick controls.
- Uses `applyStreamQualityToHls` to cap HLS levels and bandwidth.

---

## 5. Tri-Lingual Virtual On-Screen Keyboard (تەختە کلیکی کوردی، ئینگلیزی و عەرەبی)
- The on-screen mini virtual keyboard (opened via Green remote key or drawer Search icon) provides 1-click switching between 3 languages:
  - `[کوردی]` (`KU_KEYBOARD_KEYS`)
  - `[EN]` (`EN_KEYBOARD_KEYS`)
  - `[عربي]` (`AR_KEYBOARD_KEYS`)
- Remote control Arrow Up/Down/Left/Right navigation maps seamlessly across all 3 key arrays.

---

## 6. Dashboard 30s Sleep State to 5 Pure White Small Wave Dots (خەوتنی داشبۆرد بۆ پێنچ خاڵی سپی و وردی شەپۆل دار پاش ٣٠ چرکە)
- On the Cinema Dashboard (`activeTab === 'dashboard'`), after 30 seconds of user inactivity, the 5 bottom navigation buttons morph into 5 delicate, pure white glowing dots:
  - Classes: `w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.95)] animate-ocean-wave`
  - Staggered ocean wave animation delays (`0s, 0.22s, 0.44s, 0.66s, 0.88s`).
- Any user activity (mousemove, touch, remote key, mousedown) immediately restores the full dock buttons.

---

## 7. PIN 0000 Lock for Channel Editing, Moving & Deletion
- Modifying channels in the Channel Drawer is protected behind PIN `0000` (or `1234`).
- When unlocked (`isChannelEditMode === true`):
  - Channel rows show: Move Up (▲), Move Down (▼), and Delete (🗑️) buttons.
  - Clicking on a row does NOT accidentally switch the channel.
  - **Channel 1 (DABIN.Tv / `ch-dabin-tv-custom`) is permanently fixed at position #1** — it cannot be moved, reordered, or deleted (`جێگیرە 🔒`).
  - Drawer header displays a `تەواو (Done)` button to lock and exit edit mode.

---

## 8. Dashboard & Channel List Custom Scale Controls in Settings (بچووک/گەورەکردنی داشبۆرد و لیستی کەناڵەکان)
- Settings tab contains a dedicated "UI Scale & Display" customization panel:
  - **Dashboard Scale (`dockScale`):** Slider from 70% to 130% + presets: `[بچووک 80%]`, `[بنەڕەتی 100%]`, `[گەورە 120%]`.
  - **Channel List Scale (`drawerScale`):** `compact` (w-64/72), `standard` (w-72/80/96), `large` (w-80/96/28rem).
  - Persisted in localStorage (`nndd_dock_scale` and `nndd_drawer_scale`).

---

## ADDITIONAL PERMANENT ARCHITECTURAL RULES
1. **Never Purge Xtream / Third-Party Servers:**
   - Multi-server storage and cache must NEVER be auto-purged or restricted to only 50 channels.
2. **Channel 1 DABIN.Tv Player Overlay:**
   - Always mount `<DabinChannelPlayer />` on Channel 1 without YouTube branding or channel popups.
3. **Double-Tap / OK Navigation:**
   - Channel drawer ONLY opens via OK / Enter on remote, or double-tap on touch screens. Left / Right navigation must never open the drawer.
4. **Permanent Design System Preservation (`DESIGN_SYSTEM_REVIEW.md`):**
   - The Apple TV Dark-Cinema Glassmorphic design, 5 standalone pure white glass dock buttons, 30s ocean wave sleeping dots, translucent 5s zapping countdown badge, tri-lingual keyboard, and Settings scale stepping controls are permanent visual specifications and must never be simplified, removed, or replaced with generic UI without user authorization.
5. **Settings Smooth Remote Scrolling & Isolated Widgets:**
   - Settings tab must always support smooth remote control scrolling (`ArrowUp`, `ArrowDown`, `PageUp`, `PageDown`), keep scale sliders with `tabIndex={-1}` and dedicated `[-]`/`[+]` stepping buttons, and ensure input fields never hijack vertical scroll navigation.
