# Voxeye

Voxeye is a website that lets people who struggle to speak communicate using only their eyes and hands. Blink Morse code to build a message, choose an AI-suggested sentence, and speak it aloud, or hold a hand gesture for a quick phrase. Open **Caregiver** in another tab to receive confirmed messages and urgent alerts.

Features
a) Blink translates directly to Morse code
b) Speak confirmed message out loud
c) Hold a gesture for quick phrase like Yes, No, Water, Help, or Pain
d) Caregiver can receive confirmed messages and urgent alerts in a second tab
e) Google Gemini turns a few typed letters into full, natural sentences (only if user has access to Gemini's API key)

## How to run it locally

### 1. Install Node.js (version 22 or newer)

Check what you have with `node -v`.

**macOS / Linux** (requires [nvm](https://github.com/nvm-sh/nvm)):

```sh
nvm install 22
```

**Windows**: download the installer from [nodejs.org](https://nodejs.org/en/download), or run:

```powershell
winget install OpenJS.NodeJS
```

Then **close and reopen your terminal** so it picks up the new install, and confirm with `node -v`.
