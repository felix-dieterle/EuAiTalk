# Rudimentäre Audio-Unterhaltungs-App (EU-LLM)

## ✅ Status: Implementiert

Alle Kernfunktionen sind implementiert und funktionsfähig!

## 🚀 Schnellstart

```bash
# Repository klonen
git clone https://github.com/felix-dieterle/EuAiTalk.git
cd EuAiTalk

# Dependencies installieren
npm install

# Umgebungsvariablen konfigurieren
cp .env.example .env
# Bearbeite .env und füge deinen Scaleway API-Schlüssel hinzu

# Server starten
npm start

# Im Browser öffnen
http://localhost:3000
```

**Demo-Modus:** Die App funktioniert auch ohne API-Schlüssel für Tests!

---

## Ziel der App

Eine mobile oder Web-App, in der Benutzer per Sprache mit einer KI interagieren können:

Sprach-Input → KI-Dialog → gesprochene Antwort.

Fokus auf Einfachheit & Unterhaltung (Witze, kleine Geschichten, Bibel-Stories).

---

## Kernfunktionen

### 1) Sprach-Eingabe (Speech-to-Text) ✅

Nutzer spricht in die App → Audio aufgenommen.

Audio an Scaleway Audio Transcription API (whisper-large-v3) senden.

Ergebnis: transkribierter Text.

**Implementierung:**
- MediaRecorder API für Audio-Aufnahme
- Base64-Encoding für Übertragung
- Backend-Proxy für sichere API-Kommunikation

### 2) Chat mit KI (Text-Konversation) ✅

Transkribierter Text wird an Generative Chat Endpoint (/v1/chat/completions) gesendet.

Modell-Beispiele:

- mistral-nemo-instruct-2407 (implementiert)
- gpt-oss-120b

App erhält Antwort-Text vom Modell.

**Implementierung:**
- Express.js Backend-Server
- Konversations-History für Kontext
- System-Prompts für verschiedene Personas

### 3) Sprach-Ausgabe (Text-to-Speech) ✅

KI-Antwort → TTS (Text-to-Speech)

Optionen:

- ~~Externe europäische TTS API (z. B. Acapela)~~
- ✅ Web Speech API (Browser-nativ, kostenlos, offline)

Hinweis: Scaleway bietet derzeit nur STT; TTS separat einbinden.

**Implementierung:**
- Web Speech API (in allen modernen Browsern)
- Deutsche Sprachausgabe (de-DE)
- Automatisches Abspielen nach KI-Antwort

### 4) UI & Interaktion ✅

- ✅ Push-to-talk Button für Audio-Eingabe
- ✅ Scroll/Chat-Verlauf wie Messenger
- ✅ Persona/Szenario-Auswahl: Allgemein, Erzähler, Witze, Bibel-Stories

**Implementierung:**
- Modernes, responsives Design
- Purple Gradient mit weißer Card
- Animierte Nachrichten
- Status-Feedback bei jeder Aktion
- Große, klare Buttons für einfache Bedienung

---

## 📚 Dokumentation

Siehe [SETUP.md](SETUP.md) für:
- Detaillierte Projekt-Struktur
- Code-Erklärungen für Juniors
- Entwicklungs-Best-Practices
- Debugging-Tipps
- Erweiterungsmöglichkeiten

---

## 🔒 Sicherheit

- ✅ API-Schlüssel werden nur auf dem Server gespeichert
- ✅ Rate-Limiting auf allen Endpoints (100 Anfragen/15min)
- ✅ CORS-Konfiguration
- ✅ Input-Validierung
- ✅ Keine bekannten Sicherheitslücken (CodeQL geprüft)

---

## 🌍 Technologie-Stack

**Backend:**
- Node.js + Express.js
- Scaleway APIs (EU-gehostet)
- dotenv für Umgebungsvariablen
- express-rate-limit für Sicherheit

**Frontend (Web):**
- Vanilla JavaScript (einfach für Juniors)
- Web Speech API (TTS)
- MediaRecorder API (Audio-Aufnahme)
- Moderne CSS mit Flexbox/Grid

**Android:**
- Kotlin
- WebView (AndroidX WebKit)
- Android SDK 24-35 (Android 7.0 - Android 15)

**APIs:**
- Scaleway STT (Whisper large-v3)
- Scaleway Chat (Mistral Nemo Instruct)
- Web Speech API (Browser-nativ)

---

## 💡 Features

- 🎙️ Push-to-talk Audio-Aufnahme
- 💬 Chat-Verlauf mit User/AI Nachrichten
- 🎭 4 Personas: Allgemein, Erzähler, Comedian, Bibel
- 🔊 Automatische Sprachausgabe
- 📱 Responsive Design (Mobile & Desktop)
- 🤖 **Native Android App** (WebView Wrapper)
- 🧪 Demo-Modus ohne API-Schlüssel
- 🚀 Produktionsreif mit Rate-Limiting

---

## 📱 Android App

Eine native Android-App ist verfügbar! Wir verwenden einen **WebView Wrapper Ansatz** für:

- ✅ **Gemeinsames Backend**: Keine Code-Duplizierung
- ✅ **Einfache Wartbarkeit**: Updates wirken sich auf alle Plattformen aus
- ✅ **Geringe Fehleranfälligkeit**: Eine Code-Basis für die gesamte UI-Logik
- ✅ **Schnelle Feature-Updates**: Neue Features nur einmal implementieren
- ✅ **10x schnellere Entwicklung**: 1-2 Tage statt 2-3 Wochen
- ✅ **Massive Kostenersparnis**: ~7000-12500€ weniger im ersten Jahr

### 📖 Dokumentation

- [android/QUICKSTART.md](android/QUICKSTART.md) - 5-Minuten Setup
- [android/README.md](android/README.md) - Vollständige Anleitung
- [android/ARCHITECTURE.md](android/ARCHITECTURE.md) - Architektur-Entscheidungen
- [android/COMPARISON.md](android/COMPARISON.md) - WebView vs. Native Vergleich
- [android/PRODUCTION.md](android/PRODUCTION.md) - Deployment-Guide
- [android/SUMMARY.md](android/SUMMARY.md) - Implementierungs-Zusammenfassung

**Warum WebView statt nativem UI?**
- Für unseren Use-Case (Chat-basierte Audio-App) ist ein WebView optimal
- Die Web-APIs (MediaRecorder, Speech) funktionieren perfekt in modernen WebViews
- Keine separate Implementierung = weniger Wartungsaufwand
- Frontend-Updates erfordern kein App Store Update
- Alle benötigten Features verfügbar ohne erhöhte Fehleranfälligkeit

---

## 🎯 Für wen ist dieses Projekt?

**Junior-Entwickler:** 
- Klarer, gut dokumentierter Code
- Schritt-für-Schritt Erklärungen in SETUP.md
- Einfache Architektur ohne komplexe Frameworks

**Teams:**
- Fokus auf Wartbarkeit
- Europäische APIs (DSGVO-konform)
- Kosteneffizient (Web Speech API ist kostenlos)

---

## 🔄 CI/CD Pipeline

Das Projekt verfügt über automatisierte Workflows für kontinuierliche Integration und Deployment:

### Release on Merge (Neu!)
- **Trigger:** Automatisch bei Merge auf `main`
- **Automatisierung:**
  - Version Bump (Patch standardmäßig)
  - Git Tag erstellen
  - Changelog generieren
  - Backend & Android bauen
  - GitHub Release mit allen Artefakten
- **Workflow:** `.github/workflows/release.yml`

### Backend CI
- **Trigger:** Pull Requests und Pushes auf `main` / `develop`
- **Tests:**
  - Node.js Dependency Installation
  - Syntax-Validierung
  - Server Health Check
- **Workflow:** `.github/workflows/backend-ci.yml`

### Frontend CI
- **Trigger:** Pull Requests und Pushes auf `main` / `develop` (bei Frontend-Änderungen)
- **Validierung:**
  - HTML Struktur-Check
  - JavaScript Syntax-Validierung
  - CSS Prüfung
  - Static File Serving Test
- **Workflow:** `.github/workflows/frontend-ci.yml`

### Android CI
- **Trigger:** Pull Requests und Pushes auf `main` / `develop` (bei Android-Änderungen)
- **Build:**
  - Debug APK wird automatisch gebaut
  - Lint-Checks werden ausgeführt
- **Artefakte:** Debug APK verfügbar für 30 Tage
- **Workflow:** `.github/workflows/android-ci.yml`

### Android Release (Legacy)
- **Trigger:**
  - Git Tags (z.B. `v1.0.0`)
  - Manueller Workflow-Dispatch
- **Build:** Release APK (unsigned)
- **Output:** Automatisches GitHub Release mit APK-Download
- **Workflow:** `.github/workflows/android-release.yml`
- **Hinweis:** Für neue Releases bitte die "Release on Merge" Workflow verwenden

**Release erstellen:**
```bash
# Automatisch: Einfach zu main mergen
git checkout -b feature/my-feature
git commit -m "feat: neue Funktion"
# PR erstellen und mergen → Release wird automatisch erstellt

# Manuell mit Version Auswahl:
# → GitHub Actions → Release on Merge → Run workflow

# Legacy (nur Android): Via Git Tag
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0
```

---

## 📄 Lizenz

MIT
