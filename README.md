# nzr — Video Downloader for iPhone

A premium iOS video downloader app built with Flutter. Paste a link, download the video.

#### Supported Platforms
TikTok, Twitter/X, Instagram, YouTube, Reddit, and 1000+ more via Cobalt.

#### Requirements (for contributors)
- Flutter 3.24.5
- Dart SDK ≥ 3.0.0
- Xcode 15+ (macOS only — for local iOS builds)

#### Building Locally (macOS only)
```bash
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
cd ios && pod install
flutter build ios --release --no-codesign
```

#### Building via GitHub Actions (Windows / any OS)
1. Push to `main` branch — build starts automatically
2. Or go to Actions → "Build iOS IPA" → "Run workflow"
3. When complete: Actions → latest run → Artifacts → download `nzr-IPA-{n}`

#### Installing on iPhone (Sideloadly)
1. Download Sideloadly from sideloadly.io
2. Connect iPhone via USB and trust the computer
3. Open Sideloadly, drag `nzr.ipa` in
4. Enter your Apple ID (free account works)
5. Click Start
6. On iPhone: Settings → General → VPN & Device Management → trust your Apple ID

> Note: Free Apple ID signing expires every 7 days. Re-run the install weekly.

#### Architecture
- Flutter (iOS only)
- Cobalt public API (serverless — no custom backend)
- Clean Architecture + Cubit
- Isar local database

#### License
MIT
