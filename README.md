Rudimentäre Audio-Unterhaltungs-App (EU-LLM)

Ziel der App

Eine mobile oder Web-App, in der Benutzer per Sprache mit einer KI interagieren können:

Sprach-Input → KI-Dialog → gesprochene Antwort.

Fokus auf Einfachheit & Unterhaltung (Witze, kleine Geschichten, Bibel-Stories).



---

Kernfunktionen

1) Sprach-Eingabe (Speech-to-Text)

Nutzer spricht in die App → Audio aufgenommen.

Audio an Scaleway Audio Transcription API (whisper-large-v3) senden.

Ergebnis: transkribierter Text.


2) Chat mit KI (Text-Konversation)

Transkribierter Text wird an Generative Chat Endpoint (/v1/chat/completions) gesendet.

Modell-Beispiele:

mistral-nemo-instruct-2407

gpt-oss-120b


App erhält Antwort-Text vom Modell.


3) Sprach-Ausgabe (Text-to-Speech)

KI-Antwort → TTS (Text-to-Speech)

Optionen:

Externe europäische TTS API (z. B. Acapela)

Lokale TTS-Bibliothek für Offline/Edge


Hinweis: Scaleway bietet derzeit nur STT; TTS separat einbinden.


4) UI & Interaktion

Push-to-talk Button für Audio-Eingabe.

Scroll/Chat-Verlauf wie Messenger.

Persona/Szenario-Auswahl: Erzähler, Witze, Bibel-Stories, Spiele.
