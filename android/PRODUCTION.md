# Produktions-Deployment Checkliste

Vor dem Deployment in den Google Play Store müssen folgende Schritte durchgeführt werden:

## 🔧 Konfiguration

### 1. Server-URL setzen

**Erforderlich für Produktions-Deployment!** 

Die Standard-Konfiguration verwendet `http://10.0.2.2:3000` für lokale Entwicklung. Für Produktion musst du dies ändern.

Bearbeite `app/build.gradle`:

```gradle
buildTypes {
    release {
        // WICHTIG: Ersetze dies mit deiner echten Produktions-URL
        buildConfigField "String", "SERVER_URL", "\"https://euaitalk.example.com\""
    }
}
```

**Sicherere Methode** (empfohlen für Teams):

Nutze `gradle.properties` (nicht in Git committen):

```properties
# In gradle.properties (lokal)
PRODUCTION_SERVER_URL=https://euaitalk.example.com
```

Dann in `app/build.gradle`:

```gradle
buildTypes {
    release {
        buildConfigField "String", "SERVER_URL", "\"${PRODUCTION_SERVER_URL}\""
    }
}
```

> ⚠️ **Hinweis für Entwickler**: Die Standard-URL `http://10.0.2.2:3000` funktioniert für lokale Tests mit dem Android Emulator. Für echte Geräte oder Produktions-Deployment muss die URL angepasst werden!

### 2. Network Security Config anpassen

Bearbeite `app/src/main/res/xml/network_security_config.xml`:

**Option A: Entferne localhost Konfiguration**

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Nur HTTPS erlaubt -->
    <base-config cleartextTrafficPermitted="false" />
</network-security-config>
```

**Option B: Nutze Build-Varianten** (empfohlen)

Erstelle zwei Dateien:

`app/src/debug/res/xml/network_security_config.xml`:
```xml
<!-- Debug: localhost erlaubt -->
<network-security-config>
    <base-config cleartextTrafficPermitted="false" />
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
```

`app/src/release/res/xml/network_security_config.xml`:
```xml
<!-- Release: nur HTTPS -->
<network-security-config>
    <base-config cleartextTrafficPermitted="false" />
</network-security-config>
```

### 3. App-Icon erstellen

**Erforderlich!** Siehe [app/src/main/res/ICONS.md](app/src/main/res/ICONS.md)

Schnellste Methode:
1. https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
2. Icon hochladen oder erstellen
3. Farbe setzen: #6B46C1 (Purple)
4. Icon-Set herunterladen
5. In `app/src/main/res/` entpacken

Dann in `AndroidManifest.xml`:
```xml
android:icon="@mipmap/ic_launcher"
android:roundIcon="@mipmap/ic_launcher_round"
```

### 4. Keystore erstellen (für Signierung)

**⚠️ Wichtig für öffentliche Verteilung:** 

Für **lokale Entwicklung/Testing** ist kein Keystore erforderlich - die App verwendet automatisch Debug-Signierung.

Für **öffentliche Verteilung** (GitHub Releases, Play Store) ist ein Release-Keystore **zwingend erforderlich**. Debug-signierte APKs sind ein Sicherheitsrisiko und sollten niemals öffentlich verteilt werden, da die Debug-Signatur bei allen Entwicklern identisch ist.

**Für Produktion (Play Store) - Release-Keystore erstellen:**

```bash
keytool -genkey -v -keystore euaitalk-release.keystore \
    -alias euaitalk \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000
```

**Für CI/CD (GitHub Actions):**

Die Build-Konfiguration in `app/build.gradle` unterstützt bereits Umgebungsvariablen für automatisierte Builds:
- `ANDROID_KEYSTORE_FILE`: Pfad zum Keystore
- `ANDROID_KEYSTORE_PASSWORD`: Store-Passwort
- `ANDROID_KEY_ALIAS`: Key-Alias
- `ANDROID_KEY_PASSWORD`: Key-Passwort

**Hinweis:** Wenn diese in CI/CD nicht gesetzt sind, verwendet die App Debug-Signierung als Fallback. Dies ist für öffentliche Releases nicht geeignet! Konfiguriere in GitHub Secrets einen Release-Keystore für produktive Releases.

**Für lokale Entwicklung mit eigenem Keystore:**

Erstelle `keystore.properties` (NICHT committen!):
```properties
storePassword=DEIN_SICHERES_PASSWORT
keyPassword=DEIN_SICHERES_PASSWORT
keyAlias=euaitalk
storeFile=../euaitalk-release.keystore
```

Füge zu `app/build.gradle` hinzu:
```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            // ... rest of config
        }
    }
}
```

## 📋 Pre-Release Checklist

- [ ] Server-URL auf Produktions-Server gesetzt
- [ ] Network Security Config bereinigt (kein cleartext außer debug)
- [ ] Custom App-Icon erstellt und eingebunden
- [ ] Keystore erstellt und konfiguriert
- [ ] Version Code & Name aktualisiert in `app/build.gradle`
- [ ] App gebaut: `./gradlew assembleRelease`
- [ ] APK getestet auf echtem Gerät
- [ ] Alle Features funktionieren (Mikrofon, TTS, Chat)
- [ ] Play Store Listing vorbereitet (Screenshots, Beschreibung)
- [ ] Datenschutzerklärung URL bereit
- [ ] Support-Email konfiguriert

## 🚀 Release Build

```bash
cd android

# Clean Build
./gradlew clean

# Release Build
./gradlew assembleRelease

# APK liegt in:
# app/build/outputs/apk/release/app-release.apk

# AAB (für Play Store) - empfohlen
./gradlew bundleRelease

# AAB liegt in:
# app/build/outputs/bundle/release/app-release.aab
```

## 📱 Play Store Upload

1. [Google Play Console](https://play.google.com/console) öffnen
2. "Neue App erstellen"
3. AAB hochladen (nicht APK - AAB ist kleiner)
4. Store-Listing ausfüllen:
   - App-Name: "EuAiTalk"
   - Kurzbeschreibung: "Sprach-Chat mit EU-gehosteter KI"
   - Vollständige Beschreibung: Siehe README.md
   - Screenshots: Mind. 2 (Phone), optional Tablet
   - App-Icon: High-res 512x512px PNG
5. Inhaltsbewertung: Fragebogen ausfüllen
6. Preise & Vertrieb: Kostenlos / Länder wählen
7. Datenschutzerklärung: URL angeben
8. Zur Überprüfung einreichen

**Erste Überprüfung dauert:** 1-7 Tage

## 🔒 Sicherheit

### Wichtig!

- ✅ `keystore.properties` in `.gitignore` (bereits konfiguriert)
- ✅ Keystore-Datei sicher aufbewahren (Backup!)
- ✅ Passwörter NIEMALS in Git committen
- ✅ API-Keys bleiben auf Server (nicht in APK)

### Play Store Sicherheits-Scan

Google prüft automatisch:
- ✅ Keine hardcoded API-Keys
- ✅ Sichere Netzwerk-Kommunikation
- ✅ Berechtigungen gerechtfertigt

## 📊 Post-Release

### Monitoring

- Play Store Console: Crashes & ANRs überwachen
- Server Logs: API-Nutzung überwachen
- User Reviews: Feedback sammeln

### Updates

Für Updates:
1. Version Code erhöhen in `app/build.gradle`
2. Version Name aktualisieren (z.B. "1.0" → "1.1")
3. Release Build erstellen
4. In Play Console hochladen

**Frontend-Updates** (ohne App-Update):
- Änderungen am Web-Frontend werden automatisch übernommen
- Kein Play Store Update nötig!

## 🆘 Troubleshooting

**"App wurde nicht installiert" Fehler:**

**Für lokale Entwicklung:**
- ✅ APKs verwenden automatisch Debug-Signatur wenn kein Keystore vorhanden
- Stelle sicher, dass "Installation aus unbekannten Quellen" in den Android-Einstellungen aktiviert ist
- Deinstalliere vorherige Versionen der App komplett vor der Installation
- Prüfe, ob genug Speicherplatz vorhanden ist

**Für öffentliche Releases (GitHub Releases, Play Store):**
- ⚠️ **Sicherheitsrisiko**: Debug-signierte APKs sollten NICHT öffentlich verteilt werden
- **Lösung**: Konfiguriere einen Release-Keystore in GitHub Secrets oder lokal
- Für Play Store ist ein Release-Keystore zwingend erforderlich
- Bei älteren Versionen: APK war möglicherweise unsigniert und konnte nicht installiert werden

**Build scheitert:**
- `./gradlew clean` ausführen
- Cache löschen: Android Studio → Invalidate Caches

**Signierung scheitert:**
- Keystore-Pfad korrekt?
- Passwörter korrekt?

**Play Store Reject:**
- Datenschutzerklärung vollständig?
- Alle Berechtigungen erklärt?
- Screenshots vorhanden?

## 📞 Support

Bei Problemen:
- [Android Developer Docs](https://developer.android.com/)
- [Play Console Help](https://support.google.com/googleplay/android-developer/)
- GitHub Issues für projektspezifische Fragen
