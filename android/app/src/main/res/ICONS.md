# App Icons

Die App-Icons müssen noch hinzugefügt werden. 

## Icons generieren

Es gibt mehrere Möglichkeiten, App-Icons zu erstellen:

### Option 1: Android Asset Studio (Empfohlen)
1. Besuche: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
2. Lade ein Bild hoch oder wähle ein Icon
3. Konfiguriere Farben (Purple: #6B46C1)
4. Lade das Icon-Set herunter
5. Entpacke und kopiere die `mipmap-*` Ordner nach `app/src/main/res/`

### Option 2: Android Studio
1. Rechtsklick auf `res` Ordner
2. New → Image Asset
3. Icon konfigurieren
4. Finish

### Option 3: Manuell
Erstelle PNG-Dateien in folgenden Größen:

```
mipmap-mdpi/ic_launcher.png       (48x48)
mipmap-hdpi/ic_launcher.png       (72x72)
mipmap-xhdpi/ic_launcher.png      (96x96)
mipmap-xxhdpi/ic_launcher.png     (144x144)
mipmap-xxxhdpi/ic_launcher.png    (192x192)
```

Und für runde Icons:

```
mipmap-mdpi/ic_launcher_round.png       (48x48)
mipmap-hdpi/ic_launcher_round.png       (72x72)
mipmap-xhdpi/ic_launcher_round.png      (96x96)
mipmap-xxhdpi/ic_launcher_round.png     (144x144)
mipmap-xxxhdpi/ic_launcher_round.png    (192x192)
```

## Temporäre Lösung

Bis die Icons erstellt sind, verwendet Android das Standard-Android-Icon.

Die App wird trotzdem funktionieren, sieht aber ohne eigenes Icon weniger professionell aus.

## Design-Vorschlag

Basierend auf dem EuAiTalk Branding:

- **Hintergrund**: Purple gradient (#6B46C1 → #9333EA)
- **Vordergrund**: Weißes Mikrofon-Icon oder "EA" Initialen
- **Stil**: Modern, minimal, flat design

## Icon-Resourcen (kostenlos)

- Material Design Icons: https://fonts.google.com/icons
- Font Awesome: https://fontawesome.com/
- Flaticon: https://www.flaticon.com/

**Hinweis:** Achte auf Lizenz-Bedingungen bei kostenlosen Icons!
