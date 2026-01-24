# EuAiTalk Android - Schnellstart

## 🎯 Übersicht

Die Android-App nutzt einen **WebView Wrapper** Ansatz:
- Gleiche UI wie die Web-Version
- Nutzt dasselbe Express.js Backend
- Minimale Wartung, maximale Wiederverwendung

## 🚀 In 5 Minuten starten

### 1. Backend starten

```bash
# Im Hauptverzeichnis
cd /path/to/EuAiTalk
npm install
npm start
```

Server läuft auf `http://localhost:3000`

### 2. Android Studio vorbereiten

1. [Android Studio](https://developer.android.com/studio) installieren
2. Android Studio öffnen
3. "Open" → `EuAiTalk/android` Ordner wählen
4. Gradle Sync abwarten (kann 5-10 Min dauern beim ersten Mal)

### 3. Server-URL konfigurieren

Öffne `app/src/main/java/com/euaitalk/MainActivity.kt`:

**Für Android Emulator:**
```kotlin
private val SERVER_URL = "http://10.0.2.2:3000"  // ← Bereits konfiguriert
```

**Für echtes Gerät (gleiches WiFi wie PC):**
```kotlin
private val SERVER_URL = "http://192.168.1.100:3000"  // ← Deine PC-IP eintragen
```

Deine PC-IP finden:
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig | grep inet
```

### 4. App installieren

**Option A: Android Studio GUI**
1. Emulator starten oder Gerät verbinden (USB Debugging aktiviert)
2. Auf grünen ▶️ Button klicken
3. Warten bis App startet

**Option B: Kommandozeile**
```bash
cd android
./gradlew installDebug
```

### 5. Berechtigungen erteilen

Beim ersten Start:
1. App fragt nach Mikrofon-Berechtigung
2. "Zulassen" klicken
3. Fertig!

## 🐛 Häufige Probleme

### "Backend nicht erreichbar"

**Problem:** App zeigt "Server nicht erreichbar"

**Lösung:**
1. Backend läuft? → `npm start` im Hauptverzeichnis
2. Richtige IP? → `ipconfig` / `ifconfig` prüfen
3. Firewall? → Port 3000 freigeben

### "Mikrofon funktioniert nicht"

**Problem:** Aufnahme-Button reagiert nicht

**Lösung:**
1. Berechtigung erteilt? → App-Einstellungen → Berechtigungen prüfen
2. Im Emulator: "Cold Boot" machen

### Gradle Build Fehler

**Problem:** Gradle Sync scheitert

**Lösung:**
1. Android Studio neu starten
2. "Invalidate Caches and Restart"
3. Gradle Version in `gradle-wrapper.properties` prüfen

## 📱 Emulator vs. Echtes Gerät

### Emulator Vorteile:
- ✅ Einfacher Setup
- ✅ Kein USB-Kabel nötig
- ✅ Verschiedene Android-Versionen testen

### Emulator Nachteile:
- ❌ Langsamer als echtes Gerät
- ❌ Mikrofon-Qualität kann schlechter sein

### Echtes Gerät Setup:
1. USB Debugging aktivieren (Entwickleroptionen)
2. Gerät per USB verbinden
3. "USB Debugging zulassen" bestätigen
4. In Android Studio: Gerät auswählen

## 🔧 Entwicklung

### Live Debugging:

WebView Debugging aktivieren in `MainActivity.kt`:
```kotlin
WebView.setWebContentsDebuggingEnabled(true)
```

Dann in Chrome: `chrome://inspect`

### Logs ansehen:

Android Studio → Logcat → Filter: "WebView" oder "EuAiTalk"

### APK zum Testen generieren:

```bash
cd android
./gradlew assembleDebug
```

APK liegt in: `app/build/outputs/apk/debug/app-debug.apk`

Kann per Email/USB geteilt werden!

## 🎨 Anpassungen

### App-Name ändern:
`app/src/main/res/values/strings.xml`

### Farben ändern:
`app/src/main/res/values/colors.xml`

### Icon ändern:
Icons in `app/src/main/res/mipmap-*/` ersetzen

## 📚 Weitere Infos

- **Vollständige Doku**: [README.md](README.md)
- **Architektur-Entscheidungen**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Backend-Doku**: [../SETUP.md](../SETUP.md)

## ❓ Hilfe

Bei Fragen oder Problemen:
1. [Android Studio Docs](https://developer.android.com/studio)
2. [WebView Guide](https://developer.android.com/guide/webapps/webview)
3. GitHub Issues öffnen
