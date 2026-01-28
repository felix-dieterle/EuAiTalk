# EuAiTalk Android

Dieser Ordner enthält die Android-App für EuAiTalk.

> **📖 Schnellstart:** Siehe [QUICKSTART.md](QUICKSTART.md)  
> **🚀 Produktion:** Siehe [PRODUCTION.md](PRODUCTION.md)  
> **🏗️ Architektur:** Siehe [ARCHITECTURE.md](ARCHITECTURE.md)

## 📱 Architektur-Entscheidung: WebView Wrapper

Wir haben uns für einen **WebView Wrapper Ansatz** entschieden statt eines separaten nativen Android-Projekts.

### ✅ Vorteile dieser Lösung:

1. **Gemeinsames Backend**: Der Express.js Server wird von Web und Android verwendet
2. **Keine Code-Duplizierung**: Die gesamte UI-Logik wird wiederverwendet
3. **Einfache Wartbarkeit**: Änderungen am Frontend wirken sich auf beide Plattformen aus
4. **Geringe Fehleranfälligkeit**: Keine separate Implementierung der Business-Logik
5. **Schnelle Feature-Updates**: Neue Features müssen nur einmal implementiert werden
6. **Bewährte Web-APIs**: MediaRecorder und Web Speech API funktionieren in modernen WebViews

### 🔧 Technische Details:

- **Android SDK**: API 24-35 (Android 7.0 - Android 15, ~95% Geräteabdeckung)
- **WebView**: AndroidX WebKit für beste Kompatibilität
- **Kotlin**: Moderne, sichere Android-Entwicklung
- **Berechtigungen**: Mikrofon, Internet, Audio-Einstellungen

## 🚀 Setup und Build

### Voraussetzungen

1. **Android Studio** (neueste Version empfohlen)
2. **JDK 11** oder höher
3. **Android SDK** (wird von Android Studio installiert)

### Installation

1. Android Studio öffnen
2. "Open an Existing Project" wählen
3. Den `android` Ordner auswählen
4. Gradle Sync abwarten (lädt Dependencies automatisch)

### Server-URL konfigurieren

Die Server-URL wird automatisch per Build-Variante konfiguriert:

- **Debug Build**: `http://10.0.2.2:3000` (Android Emulator localhost)
- **Release Build**: `https://your-production-server.com` (muss konfiguriert werden)

**Für Entwicklung mit echtem Gerät** im selben Netzwerk:

Bearbeite `app/build.gradle` und füge eine neue Build-Variante hinzu:

```gradle
buildTypes {
    debug {
        buildConfigField "String", "SERVER_URL", "\"http://192.168.1.100:3000\""
    }
}
```

**Für Produktion:**

Bearbeite `app/build.gradle` im `release` Block:

```gradle
buildTypes {
    release {
        buildConfigField "String", "SERVER_URL", "\"https://your-production-server.com\""
    }
}
```

Die Server-URL aus `BuildConfig.SERVER_URL` wird automatisch verwendet.

### App bauen und ausführen

#### Im Android Studio:

1. Emulator oder echtes Gerät verbinden
2. Auf "Run" (▶️) klicken
3. Gerät auswählen

#### Per Kommandozeile:

```bash
# Debug Build
cd android
./gradlew assembleDebug

# APK befindet sich in: app/build/outputs/apk/debug/app-debug.apk

# Installieren auf verbundenem Gerät
./gradlew installDebug

# Release Build (für Produktion)
./gradlew assembleRelease
```

## 📋 Berechtigungen

Die App benötigt folgende Berechtigungen:

- **RECORD_AUDIO**: Für Sprachaufnahme (Essential)
- **INTERNET**: Für Backend-Kommunikation (Essential)
- **MODIFY_AUDIO_SETTINGS**: Für Audio-Optimierung (Essential)
- **ACCESS_NETWORK_STATE**: Für Netzwerk-Status-Prüfung (Optional)

Diese werden beim ersten Start angefordert.

## 🔒 Netzwerk-Sicherheit

Die App nutzt eine Network Security Config für sichere Kommunikation:

- **Produktion**: Nur HTTPS erlaubt
- **Entwicklung**: Localhost (10.0.2.2, 127.0.0.1) per HTTP erlaubt

Konfiguration in: `app/src/main/res/xml/network_security_config.xml`

**Für echtes Gerät** im lokalen Netzwerk, füge deine IP hinzu:

```xml
<domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="true">192.168.1.100</domain>
</domain-config>
```

## 🔍 Debugging

### WebView Debugging:

WebView Debugging ist **automatisch aktiviert** in Debug-Builds.

Zugriff über Chrome DevTools:
1. Chrome öffnen: `chrome://inspect`
2. Dein Gerät/Emulator sollte erscheinen
3. "Inspect" klicken

## 🎨 App-Icon anpassen

**Hinweis:** Die App verwendet aktuell das Standard-Android-Icon. Für ein professionelles App-Icon:

Icon-Dateien befinden sich in:
- `app/src/main/res/mipmap-*/ic_launcher.png`

Nutze [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/) zum Generieren.

Siehe auch: [app/src/main/res/ICONS.md](app/src/main/res/ICONS.md) für Details.

## 📦 Release Build

### APK-Signierung und Installation

**Wichtig:** Android-Apps müssen signiert sein, um installiert werden zu können.

Die App verwendet automatisch die richtige Signierung:
- **Mit Keystore** (Produktions-Release): Verwendet deine Release-Signatur
- **Ohne Keystore** (Entwicklung/Testing): Verwendet Debug-Signatur als Fallback

Dies bedeutet, dass APKs aus GitHub Releases **immer installierbar** sind, auch ohne konfigurierten Keystore.

**Fehlerbehebung "App wurde nicht installiert":**
- ✅ **Gelöst ab v1.0.4**: Release-APKs verwenden automatisch Debug-Signatur wenn kein Keystore vorhanden ist
- Stelle sicher, dass "Installation aus unbekannten Quellen" aktiviert ist
- Deinstalliere alte Versionen der App vor einer neuen Installation

### Signierten Release Build erstellen:

1. Keystore erstellen:
```bash
keytool -genkey -v -keystore euaitalk.keystore -alias euaitalk -keyalg RSA -keysize 2048 -validity 10000
```

2. `keystore.properties` erstellen (NICHT committen!):
```
storePassword=dein_passwort
keyPassword=dein_passwort
keyAlias=euaitalk
storeFile=../euaitalk.keystore
```

3. Release Build:
```bash
./gradlew assembleRelease
```

Ohne Keystore wird automatisch die Debug-Signatur verwendet, was für Tests vollkommen ausreichend ist.

## 🚢 Deployment

### Google Play Store:

1. Release APK/Bundle erstellen
2. [Google Play Console](https://play.google.com/console) öffnen
3. Neue App erstellen
4. APK/AAB hochladen
5. Store-Listing ausfüllen
6. Zur Überprüfung einreichen

### Alternative: F-Droid

Für Open-Source-Distribution über F-Droid verfügbar.

## 🤔 Warum kein natives Android UI?

Ein **natives Android UI** wäre in folgenden Fällen besser:

- ❌ Offline-First Funktionalität erforderlich
- ❌ Hochperformante 3D-Grafik oder Spiele
- ❌ Tiefe OS-Integration (Widgets, Background Services)
- ❌ Plattform-spezifische UI/UX kritisch

Für **EuAiTalk** ist der WebView-Ansatz optimal weil:

- ✅ Einfache Chat-UI (kein Performance-Problem)
- ✅ Backend-abhängig (Server läuft sowieso)
- ✅ Schnelle Iteration gewünscht
- ✅ Kleine Team-Größe / Solo-Entwicklung
- ✅ Web-App funktioniert bereits perfekt

## 🔄 Updates

Updates der Web-App werden automatisch in der Android-App reflektiert, wenn:
- Die App den Server neu lädt (z.B. nach Neustart)
- Der Cache geleert wird

Kein App-Update im Store erforderlich für Frontend-Änderungen!

## 📝 Lizenz

Gleiche Lizenz wie das Hauptprojekt: MIT
