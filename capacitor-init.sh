#!/bin/bash

# Initialize Capacitor Android project
echo "Installing Capacitor dependencies..."
npm install

echo "Building web assets..."
npm run build

echo "Installing Capacitor CLI..."
npm install -g @capacitor/cli

echo "Initializing Capacitor..."
npx @capacitor/cli init \
  --appName "PDF Translator" \
  --appId "com.grayapp.pdftranslator" \
  --webDir dist

echo "Adding Android platform..."
npx cap add android

echo "Syncing Capacitor..."
npx cap sync

echo "Setup complete!  You can now build the APK."
echo "Run: cd android && ./gradlew assembleRelease"
