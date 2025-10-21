# 📝 Prompt-Bewertung für Schüler

Eine Web-App zur automatischen Bewertung von Schüler-Prompts mit KI-Unterstützung durch Claude Haiku.

## 🎯 Funktionen

- **Zwei Lernstrategien**: Anfänger (3 W-Fragen) und Mittelstufe (Kontext + Aufgabe + Format)
- **Farbliche Markierung**: Visualisierung von Stärken und Schwächen im Prompt
- **Konkrete Tipps**: Handlungsorientierte Verbesserungsvorschläge
- **Optimierter Prompt**: Direkt verwendbare, verbesserte Version
- **Notion-Integration**: Einfache Einbettung als Embed

---

## 🚀 Komplette Installations-Anleitung für Anfänger

### Voraussetzungen

Sie benötigen:
1. Einen Computer mit Internetzugang
2. Einen GitHub Account (kostenlos)
3. Einen Vercel Account (kostenlos) 
4. Einen Anthropic API Key (kostenpflichtig, aber sehr günstig)

---

## Schritt 1: GitHub Account erstellen

1. Gehen Sie zu https://github.com
2. Klicken Sie auf "Sign up" (oben rechts)
3. Folgen Sie den Anweisungen:
   - Geben Sie einen Benutzernamen ein
   - Geben Sie Ihre E-Mail-Adresse ein
   - Wählen Sie ein sicheres Passwort
   - Bestätigen Sie Ihre E-Mail-Adresse

---

## Schritt 2: Dieses Projekt zu GitHub hochladen

### Option A: Über die GitHub Website (einfachste Methode)

1. **Neues Repository erstellen:**
   - Loggen Sie sich bei GitHub ein
   - Klicken Sie auf das grüne "New" oder "+" Symbol oben rechts
   - Wählen Sie "New repository"
   - Repository Name: `prompt-bewertung` (oder einen anderen Namen)
   - Beschreibung: "Prompt-Bewertung für Schüler"
   - Wählen Sie "Public" (öffentlich)
   - WICHTIG: Aktivieren Sie **NICHT** "Add a README file"
   - Klicken Sie auf "Create repository"

2. **Dateien hochladen:**
   - Sie sehen nun eine leere Repository-Seite
   - Klicken Sie auf "uploading an existing file"
   - Ziehen Sie alle Projektdateien in das Browserfenster:
     - index.html
     - package.json
     - vercel.json
     - .gitignore
     - README.md (diese Datei)
     - Der Ordner "api" mit der Datei evaluate.js
   - Schreiben Sie eine Commit-Nachricht: "Erste Version"
   - Klicken Sie auf "Commit changes"

### Option B: Mit Git (für Fortgeschrittene)

```bash
# Repository auf GitHub erstellen (wie oben beschrieben)
# Dann im Terminal/Kommandozeile:

cd prompt-bewertung  # In den Projektordner wechseln
git init
git add .
git commit -m "Erste Version"
git branch -M main
git remote add origin https://github.com/IHR-BENUTZERNAME/prompt-bewertung.git
git push -u origin main
```

---

## Schritt 3: Anthropic API Key erhalten

1. **Account erstellen:**
   - Gehen Sie zu https://console.anthropic.com
   - Klicken Sie auf "Sign up"
   - Bestätigen Sie Ihre E-Mail

2. **API Key generieren:**
   - Nach dem Login, klicken Sie auf "API Keys" im Menü
   - Klicken Sie auf "Create Key"
   - Geben Sie einen Namen ein: "Prompt-Bewertung"
   - Klicken Sie auf "Create"
   - **WICHTIG**: Kopieren Sie den Key sofort! Er wird nur einmal angezeigt
   - Speichern Sie ihn sicher (z.B. in einem Passwort-Manager)

3. **Credits aufladen:**
   - Gehen Sie zu "Billing" im Menü
   - Fügen Sie eine Zahlungsmethode hinzu
   - Laden Sie mindestens $5 auf (reicht für tausende Bewertungen)

---

## Schritt 4: Vercel Account erstellen

1. **Mit GitHub anmelden:**
   - Gehen Sie zu https://vercel.com
   - Klicken Sie auf "Sign Up"
   - Wählen Sie "Continue with GitHub"
   - Autorisieren Sie Vercel für GitHub

---

## Schritt 5: Projekt auf Vercel deployen

1. **Neues Projekt:**
   - Im Vercel Dashboard, klicken Sie auf "Add New..."
   - Wählen Sie "Project"

2. **GitHub Repository importieren:**
   - Sie sehen Ihre GitHub Repositories
   - Finden Sie "prompt-bewertung"
   - Klicken Sie auf "Import"

3. **Projekt konfigurieren:**
   - Project Name: Lassen Sie den Standardnamen oder ändern Sie ihn
   - Framework Preset: Wählen Sie "Other"
   - Root Directory: Lassen Sie leer
   - Build Command: Lassen Sie leer
   - Output Directory: Lassen Sie leer

4. **⚠️ WICHTIGSTER SCHRITT - Environment Variable hinzufügen:**
   - Klicken Sie auf "Environment Variables"
   - Klicken Sie auf "Add"
   - Fügen Sie diese Variable hinzu:
     - **Name**: `ANTHROPIC_API_KEY`
     - **Value**: [Fügen Sie hier Ihren API Key ein]
     - **Environment**: Alle drei Checkboxen aktiviert lassen (Production, Preview, Development)
   - Klicken Sie auf "Add"

5. **Deployment starten:**
   - Klicken Sie auf "Deploy"
   - Warten Sie 1-2 Minuten
   - Sie sehen "Congratulations!" wenn es erfolgreich war

6. **Ihre App-URL finden:**
   - Nach dem erfolgreichen Deployment sehen Sie Ihre URL
   - Sie sieht etwa so aus: `https://prompt-bewertung.vercel.app`
   - Klicken Sie darauf, um Ihre App zu testen!

---

## Schritt 6: In Notion einbetten

1. **In Notion:**
   - Öffnen Sie die Seite, wo Sie die App einbetten möchten
   - Tippen Sie `/embed`
   - Fügen Sie Ihre Vercel-URL ein
   - Klicken Sie auf "Embed link"
   - Passen Sie die Größe nach Bedarf an

---

## 🧪 Testen der App

1. **Erster Test:**
   - Öffnen Sie Ihre App-URL
   - Wählen Sie "Anfänger - Die 3 W-Fragen"
   - Geben Sie einen Test-Prompt ein, z.B.:
     ```
     Schreibe mir einen Aufsatz über Katzen.
     ```
   - Klicken Sie auf "Prompt bewerten"
   - Sie sollten eine Bewertung mit Tipps erhalten!

2. **Wenn es nicht funktioniert:**
   - Prüfen Sie in Vercel unter "Functions" Tab, ob Fehler angezeigt werden
   - Prüfen Sie unter "Settings" → "Environment Variables", ob der API Key korrekt ist
   - Stellen Sie sicher, dass Ihr Anthropic Account Credits hat

---

## 🔧 Fehlerbehebung

### "API-Konfigurationsfehler"
- Der API Key fehlt oder ist falsch
- Lösung: In Vercel Settings → Environment Variables prüfen

### "Zu viele Anfragen"
- Sie haben das Rate Limit erreicht
- Lösung: Einen Moment warten oder Anthropic Limits erhöhen

### App lädt nicht in Notion
- Die Embed-Einstellungen blockieren die Einbettung
- Lösung: Prüfen Sie die vercel.json Datei (sollte korrekt sein)

### Keine Antwort vom Server
- Timeout oder Serverfehler
- Lösung: In Vercel Dashboard → Functions Tab nach Fehlern schauen

---

## 💰 Kosten

- **GitHub**: Kostenlos
- **Vercel**: Kostenlos (Hobby Plan reicht völlig)
- **Anthropic**: Ca. $0.001 pro Bewertung (1000 Bewertungen = $1)

---

## 🔐 Sicherheitshinweise

1. **Niemals den API Key im Code speichern!** (nur als Environment Variable)
2. **Nicht den API Key mit anderen teilen**
3. **Keine persönlichen Schülerdaten in Prompts verwenden**
4. **Regelmäßig die Anthropic-Nutzung überwachen**

---

## 📝 Projekt anpassen

### Bewertungskriterien ändern
Bearbeiten Sie in `api/evaluate.js` den `SYSTEM_PROMPT`

### Design ändern
Bearbeiten Sie die CSS-Stile in `index.html`

### Neue Strategien hinzufügen
1. Fügen Sie neue Strategien in `index.html` (select-Options) hinzu
2. Erweitern Sie den `SYSTEM_PROMPT` in `api/evaluate.js`

---

## 🆘 Hilfe & Support

Bei Problemen:
1. Prüfen Sie die Vercel Logs (Dashboard → Functions → Logs)
2. Testen Sie den API Key direkt in der Anthropic Console
3. Stellen Sie sicher, dass alle Dateien korrekt hochgeladen wurden

---

## 🚀 Nächste Schritte

Sobald alles funktioniert:
1. Testen Sie mit verschiedenen Prompts
2. Sammeln Sie Feedback von Schülern
3. Passen Sie die Bewertungskriterien an Ihre Bedürfnisse an
4. Fügen Sie ggf. weitere Lernstrategien hinzu

---

## 📄 Lizenz

Dieses Projekt ist für Bildungszwecke frei verwendbar.

---

**Viel Erfolg mit Ihrer Prompt-Bewertungs-App! 🎉**
