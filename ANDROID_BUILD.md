# Android APK Build Guide

## Automated Builds with GitHub Actions

The repository includes automated APK builds through GitHub Actions.  Builds are triggered on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual trigger via GitHub Actions tab

### Getting APK Artifacts

1. Go to **Actions** tab in GitHub
2. Select the latest **Build APK** workflow run
3. Download the APK from **Artifacts** section

### Creating a Release

Tag your commit to create an official release: 

```bash
git tag v1.0.0
git push origin v1.0.0
```

The APK will automatically be attached to the GitHub Release.

## Local Build Instructions

### Prerequisites

- Node.js 18+
- Java 17+
- Android SDK (API 34+)
- Gradle

### Setup

```bash
# Install dependencies
npm install

# Build web assets
npm run build

# Initialize Capacitor (first time only)
bash capacitor-init.sh

# Or manually: 
npm install -g @capacitor/cli
npx cap init --web-dir dist
npx cap add android
npx cap sync
```

### Build APK

```bash
cd android
./gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release. apk`

### Open in Android Studio

```bash
npx cap open android
```

## Signing APK

For production releases, sign your APK:

```bash
# Generate keystore (first time only)
keytool -genkey -v -keystore pdf-translator.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias pdf-translator

# Sign APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore pdf-translator.keystore \
  app-release.apk pdf-translator
```

## Troubleshooting

### Issue: `capacitor. config.ts` not found
**Solution**: Run `bash capacitor-init.sh` first

### Issue:  Gradle build fails
**Solution**: Update Android SDK
```bash
sdkmanager "platforms;android-34" "build-tools;34.0.0"
```

### Issue: Build succeeds but APK is unsigned
**Solution**: See "Signing APK" section above

### Issue: "Command not found:  npm"
**Solution**: Install Node. js from https://nodejs.org/

### Issue: "JAVA_HOME not set"
**Solution**: Set Java path
```bash
# macOS
export JAVA_HOME=$(/usr/libexec/java_home)

# Linux
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk

# Windows (Git Bash)
export JAVA_HOME="C:/Program Files/Java/jdk-17"
```

### Issue: "Module not found @capacitor/core"
**Solution**:  Run npm install
```bash
npm install
```

### Issue: Android SDK not found
**Solution**: Install Android SDK
```bash
# Using Android Studio (recommended)
# Or using command line:
sdkmanager "platforms;android-34"
sdkmanager "build-tools;34.0.0"
```

## Environment Variables

The web app requires the Gemini API key.  Set in `.env`:

```env
GEMINI_API_KEY=your_api_key_here
```

This is embedded in the web build and won't expose the key in the APK source.

## Project Structure

```
GoPalPDF-Translator/
├── . github/
│   └── workflows/
│       └── build-apk.yml          # GitHub Actions workflow
├── android/                         # Native Android project (auto-generated)
│   ├── app/
│   │   └── build/outputs/apk/release/
│   │       └── app-release.apk     # Final APK file
│   └── gradlew                     # Gradle wrapper
├── src/                             # React source code
├── capacitor.config.ts             # Capacitor configuration
├── capacitor-init.sh               # Setup script
├── package.json                    # Dependencies
├── vite.config.ts                  # Vite configuration
└── ANDROID_BUILD.md                # This file
```

## Build Process Flow

```
┌─────────────────┐
│  Source Code    │
│  (React/TS)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Vite Build     │
│  (npm run build)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Web Assets     │
│  (dist folder)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Capacitor Sync │
│  (cap sync)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Gradle Build   │
│  (assembleRel.) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  APK File       │
│  (Ready!)       │
└─────────────────┘
```

## Quick Commands Reference

```bash
# First time setup
npm install
bash capacitor-init.sh

# Daily development
npm run dev                # Start dev server
npm run build              # Build web assets

# Before building APK
npm run cap:sync          # Sync changes to Android

# Build APK
cd android && ./gradlew assembleRelease

# Open in Android Studio
npm run cap:open

# Create a release
git tag v1.0.0
git push origin v1.0.0
```

## GitHub Actions Workflow Details

The automated workflow (`.github/workflows/build-apk.yml`):

1. **Triggers on:**
   - Push to `main` or `develop`
   - Pull requests to `main` or `develop`
   - Manual trigger via "Run workflow"

2. **Steps:**
   - Checks out code
   - Sets up Node.js 18
   - Sets up Java 17
   - Installs npm dependencies
   - Builds web assets
   - Initializes Capacitor
   - Syncs to Android
   - Runs Gradle build
   - Uploads APK as artifact
   - Creates GitHub Release (on tags)

3. **Artifacts:**
   - Available for 30 days
   - Can be downloaded from Actions tab

## Testing the APK

### On Physical Device

```bash
# Connect Android device via USB
adb devices

# Install APK
adb install -r android/app/build/outputs/apk/release/app-release. apk

# Launch app
adb shell am start -n com.grayapp.pdftranslator/. MainActivity
```

### On Android Emulator

```bash
# Start emulator
emulator -avd your_emulator_name

# Install APK
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

## Distribution

### Google Play Store

1. Create a Google Play Developer account
2. Sign APK with release keystore
3. Upload APK to Play Store Console
4. Fill in app details and graphics
5. Submit for review

### Direct Download

Users can install from direct APK download: 

```bash
# Download from GitHub Release
# Then on Android device:
adb install downloaded. apk
```

### GitHub Release

The workflow automatically uploads APK to GitHub Releases when you: 

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Performance Tips

- **Keep APK size small**: Remove unused dependencies
- **Optimize images**:  Compress assets before building
- **Use ProGuard**: Enable code shrinking in Gradle
- **Test on real devices**: Emulator performance differs

## Security Checklist

- ✅ Use signed APK for production
- ✅ Never commit keystore to git
- ✅ Use GitHub Secrets for signing keys
- ✅ Keep dependencies updated
- ✅ Validate user inputs
- ✅ Use HTTPS for API calls

## Useful Links

- [Capacitor Documentation](https://capacitorjs.com/)
- [Android Developer Guide](https://developer.android.com/)
- [Gradle Documentation](https://gradle.org/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)

## Support

For issues or questions: 

1. Check this guide first
2. Review GitHub Issues in the repository
3. Check Capacitor docs:  https://capacitorjs.com/docs
4. Contact GitHub Support if Actions workflow fails
