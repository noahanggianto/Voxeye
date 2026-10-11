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

### 2. Install dependencies

From the project folder (the one containing `package.json`):

```sh
npm install
```

### 3. Set up the Gemini API key (optional but recommended)

Voxeye uses the Gemini API to suggest full sentences from what you blink. This step is optional: without a key, Voxeye falls back to a small local phrase matcher, which still works for a demo.

**a) Get a key**

1. Go to [Google AI Studio](https://aistudio.google.com/) and sign in with a Google account.
2. Click **Get API key** and create a new key. It's a long string, usually starting with `AIza`.

**b) Create your `.env` file**

The repo includes a template called `.env.example`. Copy it to a new file named `.env`:

**macOS / Linux**
```sh
cp .env.example .env
```

**Windows (PowerShell)**
```powershell
Copy-Item .env.example .env
```

**c) Add your key**

Open `.env` in a text editor. You'll see a placeholder line:

```
GEMINI_API_KEY=your_key_here
```

Replace `your_key_here` with your real key. No quotes, no spaces around the `=`:

```
GEMINI_API_KEY=AIzaSyYourRealKeyGoesHere
```
### 4. Start the app

```sh
npm run dev
```

If you add or change the key while the app is running, stop it with `Ctrl+C` and run `npm run dev` again.

### 5. Open it in your browser

Go to **http://127.0.0.1:4173/** (Chrome or Edge recommended) and click **Allow** when asked for camera access.

> [!TIP]
> No camera, or the vision model won't load? Click **Try demo** or type directly in the message field.

### 6. Open the caregiver screen

Click **Caregiver** to open it in a second tab. Keep both tabs in the **same browser**, since they share messages through `BroadcastChannel`.

### 5. Settings
The settings are located at the top-right of the website. 

<details>
<summary>npm warns about install scripts and esbuild</summary>

This is a warning, not an error. Try `npm run dev` first. If you get an esbuild error, run:

```sh
npm install-scripts approve esbuild
npm install
```

</details>

<details>
<summary>Clean reinstall</summary>

**Windows (PowerShell)**
```powershell
Remove-Item -Recurse -Force node_modules
npm install
npm run dev
```

**macOS / Linux**
```sh
rm -rf node_modules
npm install
npm run dev
```
