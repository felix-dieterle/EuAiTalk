# EuAiTalk - Entwickler-Dokumentation

## 📚 Übersicht für Junior-Entwickler

Diese Dokumentation hilft dir, dich schnell im EuAiTalk-Projekt zurechtzufinden.

## 🏗️ Projektstruktur

```
EuAiTalk/
├── README.md                 # Hauptdokumentation (Features & Ziele)
├── SETUP.md                  # Diese Datei - Setup & Entwicklung
├── package.json              # Node.js Dependencies
├── .env.example              # Beispiel für Umgebungsvariablen
├── server/
│   └── index.js             # Express Backend-Server
└── public/
    ├── index.html           # Haupt-HTML
    ├── app.js               # Frontend-JavaScript
    └── styles.css           # Styling
```

## 🚀 Schnellstart

### 1. Voraussetzungen

- **Node.js** (Version 16 oder höher)
- **npm** (kommt mit Node.js)
- Ein moderner Browser (Chrome, Firefox, Edge)

### 2. Installation

```bash
# Repository klonen (falls noch nicht geschehen)
git clone https://github.com/felix-dieterle/EuAiTalk.git
cd EuAiTalk

# Dependencies installieren
npm install
```

### 3. Konfiguration

```bash
# .env Datei erstellen
cp .env.example .env

# .env bearbeiten und API-Schlüssel eintragen
# Scaleway API-Schlüssel: https://console.scaleway.com/project/credentials
```

**Wichtig:** Die `.env` Datei wird NICHT ins Git committed (ist in `.gitignore`).

### 4. App starten

```bash
# Development-Server starten
npm run dev

# App im Browser öffnen
# http://localhost:3000
```

## 🧩 Wie funktioniert die App?

### Übersicht des Ablaufs

```
Benutzer spricht
    ↓
📱 Frontend nimmt Audio auf (MediaRecorder API)
    ↓
🌐 Backend sendet Audio an Scaleway STT API (Whisper)
    ↓
📝 Text wird zurückgegeben
    ↓
💬 Backend sendet Text an Scaleway Chat API (Mistral)
    ↓
🤖 KI-Antwort wird generiert
    ↓
🔊 Frontend spricht Antwort aus (Web Speech API)
```

### Backend (server/index.js)

Der Backend-Server hat drei Hauptaufgaben:

1. **API-Proxy**: Schützt API-Schlüssel (bleiben auf dem Server)
2. **Transcription Endpoint** (`/api/transcribe`): Audio → Text
3. **Chat Endpoint** (`/api/chat`): Text → KI-Antwort

```javascript
// Beispiel: Transcription Endpoint
app.post('/api/transcribe', async (req, res) => {
  // 1. Audio-Daten vom Frontend erhalten
  const { audio } = req.body;
  
  // 2. An Scaleway API senden
  const response = await fetch(SCALEWAY_STT_ENDPOINT, {
    headers: { 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify({ model: 'whisper-large-v3', audio })
  });
  
  // 3. Transkription zurückgeben
  const data = await response.json();
  res.json({ text: data.text });
});
```

### Frontend (public/app.js)

Das Frontend ist in logische Funktionen aufgeteilt:

1. **Audio Recording**: `startRecording()` / `stopRecording()`
2. **Transcription**: `transcribeAudio()`
3. **Chat**: `getChatResponse()`
4. **Text-to-Speech**: `speakText()`
5. **UI Updates**: `addMessage()` / `updateStatus()`

```javascript
// Beispiel: Ablauf beim Aufnehmen
async function processAudio(audioBlob) {
  // 1. Audio transkribieren
  const text = await transcribeAudio(audioBlob);
  addMessage('user', text);
  
  // 2. KI-Antwort holen
  const response = await getChatResponse(text);
  addMessage('ai', response);
  
  // 3. Antwort vorlesen
  await speakText(response);
}
```

## 🎨 UI/UX Konzepte

### Design-Prinzipien

1. **Einfachheit**: Klare, große Buttons
2. **Feedback**: Status-Meldungen bei jeder Aktion
3. **Responsive**: Funktioniert auf Mobile & Desktop
4. **Accessibility**: Emojis für visuelle Hinweise

### Wichtige CSS-Klassen

- `.recording`: Rot pulsierender Button während Aufnahme
- `.message`: Chat-Nachricht (mit Animation)
- `.user-message` / `.ai-message`: Unterschiedliche Farben

## 🔧 Entwicklung

### Erforderliche Konfiguration

Die App erfordert **gültige API-Zugangsdaten** für den Betrieb:

- **SCALEWAY_API_KEY**: Dein Scaleway API-Schlüssel (erforderlich)
- **SCALEWAY_STT_ENDPOINT**: Speech-to-Text Endpoint (erforderlich)
- **SCALEWAY_CHAT_ENDPOINT**: Chat Completion Endpoint (erforderlich)

Die App validiert diese Einstellungen beim Start und startet nicht ohne gültige Werte.

**API-Schlüssel erhalten:**
1. Besuche [Scaleway Console](https://console.scaleway.com/project/credentials)
2. Erstelle einen neuen API-Schlüssel
3. Kopiere den Schlüssel in deine `.env` Datei

### Häufige Entwicklungsaufgaben

#### 1. Neue Persona hinzufügen

**Frontend** (`public/index.html`):
```html
<option value="newpersona">Neue Persona</option>
```

**Backend** (`server/index.js`):
```javascript
const systemMessages = {
  newpersona: 'Du bist ein...',
  // ...
};
```

#### 2. Styling anpassen

Alle Farben sind in **CSS Custom Properties** definiert:

```css
:root {
  --primary-color: #0066cc;  /* Hauptfarbe */
  --secondary-color: #00aa66; /* Akzentfarbe */
  /* ... */
}
```

#### 3. API-Endpunkte erweitern

Neue Endpunkte in `server/index.js` hinzufügen:

```javascript
app.post('/api/new-endpoint', async (req, res) => {
  // Deine Logik hier
  res.json({ result: 'data' });
});
```

## 🌍 APIs & Hosting

### Verwendete APIs

1. **Scaleway STT** (Speech-to-Text)
   - Modell: `whisper-large-v3`
   - Europäisch gehostet
   - Dokumentation: https://www.scaleway.com/en/docs/ai-data/generative-apis/

2. **Scaleway Chat** (LLM)
   - Modell: `mistral-nemo-instruct-2407`
   - Europäisch gehostet

3. **Web Speech API** (TTS)
   - Browser-nativ (kostenlos)
   - Keine externe API nötig
   - Funktioniert offline

### Hosting-Optionen (Europa)

**Kostenlos/Günstig:**
- **Vercel** (Frontend + Serverless Functions)
- **Railway** (Full-Stack Hosting)
- **Scaleway** (Server + APIs aus einer Hand)

**Deployment-Beispiel (Vercel):**
```bash
npm install -g vercel
vercel --prod
```

## 🐛 Debugging

### Browser Console

Öffne die Browser-Entwicklertools (F12):

```javascript
// Logs im Frontend
console.log('Transcription:', text);
console.error('Error:', error);
```

### Server Logs

Terminal-Output beobachten:

```bash
npm run dev
# Zeigt alle API-Calls und Fehler
```

### Häufige Probleme

**Mikrofon funktioniert nicht:**
- Browser-Berechtigung prüfen
- HTTPS erforderlich (außer localhost)

**API-Fehler:**
- `.env` Datei vorhanden?
- API-Schlüssel korrekt?
- Server läuft?

**TTS spricht nicht:**
- Web Speech API nicht in allen Browsern
- Safari: ggf. alternative TTS-Lösung

## 📖 Weitere Ressourcen

- **JavaScript**: https://developer.mozilla.org/de/docs/Web/JavaScript
- **Express.js**: https://expressjs.com/
- **Web APIs**: https://developer.mozilla.org/de/docs/Web/API
- **Scaleway Docs**: https://www.scaleway.com/en/docs/

## 💡 Best Practices

1. **Kommentare**: Erkläre komplexe Logik
2. **Fehlerbehandlung**: Immer `try/catch` verwenden
3. **User Feedback**: Status-Updates bei jedem Schritt
4. **Security**: API-Schlüssel NIE im Frontend
5. **Performance**: Audio-Daten komprimieren

## 🎯 Nächste Schritte

Mögliche Erweiterungen:

- [ ] Offline-Modus mit lokalem STT/TTS
- [ ] Konversations-Export (Download als PDF)
- [ ] Multi-Sprachen-Support
- [ ] Voice-Aktivierung (statt Push-to-Talk)
- [ ] Persönliche Einstellungen speichern

---

**Fragen?** Schaue in den Code - er ist dokumentiert! 🚀
