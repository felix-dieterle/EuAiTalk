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
- Android SDK 24+ (Android 7.0+)

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

Siehe [android/README.md](android/README.md) für:
- Build-Anleitung
- Setup und Konfiguration
- Architektur-Entscheidungen
- Deployment-Guide

**Warum WebView statt nativem UI?**
- Für unseren Use-Case (Chat-basierte Audio-App) ist ein WebView optimal
- Die Web-APIs (MediaRecorder, Speech) funktionieren perfekt in modernen WebViews
- Keine separate Implementierung = weniger Wartungsaufwand
- Frontend-Updates erfordern kein App Store Update

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

## 📄 Lizenz

MIT
