import { CONFIG } from "./config.js";

const root = document.querySelector("#app");
const appBase = import.meta.env.BASE_URL;
const caregiverUrl = `${appBase}#caregiver`;
const clone = (value) => structuredClone(value);
const config = clone(CONFIG);
const glyphs = {
  Thumb_Up: '<path d="M7 10v10H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3Zm0 10h9a2 2 0 0 0 2-1.6l1.3-6A2 2 0 0 0 17.4 10H13l.7-3.1A2.4 2.4 0 0 0 11.4 4L7 10v10Z"/>',
  Open_Palm: '<path d="M8 12V5a1.5 1.5 0 0 1 3 0v5-7a1.5 1.5 0 0 1 3 0v7-6a1.5 1.5 0 0 1 3 0v7-4a1.5 1.5 0 0 1 3 0v7c0 5-3 8-8 8h-1c-2 0-3.5-1-4.5-2.6L3 15a1.7 1.7 0 0 1 2.7-2L8 15v-3Z"/>',
  Pointing_Up: '<path d="M12 22a3 3 0 0 1-3-3V9a3 3 0 0 1 6 0v10a3 3 0 0 1-3 3ZM9 11l-3 3a2 2 0 0 1-3-3l6-7a4 4 0 0 1 6 0l6 7a2 2 0 0 1-3 3l-3-3"/>',
  Victory: '<path d="M7 11 4 5a1.6 1.6 0 0 1 2.8-1.5L11 9l-2-6a1.6 1.6 0 0 1 3.1-.8L15 9l-.4-6a1.6 1.6 0 0 1 3.2-.2l.4 7.2 1.7-3a1.6 1.6 0 0 1 2.8 1.6l-3.3 7.1A8 8 0 0 1 12 20h-1a7 7 0 0 1-6-3l-2-3a1.7 1.7 0 0 1 2.8-2L8 14"/>',
  Closed_Fist: '<path d="M4 12V9a2 2 0 0 1 4 0V7a2 2 0 0 1 4 0V6a2 2 0 0 1 4 0v2a2 2 0 0 1 4 0v7a7 7 0 0 1-7 7h-1a7 7 0 0 1-6-3l-3-5a1.7 1.7 0 0 1 3-1.7L8 15v-3a2 2 0 0 1 4 0v1"/>',
  Voxeye: '<path d="M2.5 12s3.2-6 9.5-6 9.5 6 9.5 6-3.2 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/><path d="M4 4 2.5 2.5M20 4l1.5-1.5"/>'
};
const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${glyphs[name] || glyphs.Voxeye}</svg>`;

const state = {
  stream: null, face: null, hands: null, vision: null, running: false, lastVideoTime: -1, facePoints: [], handPoints: [],
  lastGestureAt: 0, leftClosed: false, rightClosed: false, eyeStart: 0, eyePeak: 0,
  wink: null, currentCode: "", lastSignalAt: 0, wordSpaceAdded: false,
  heldGesture: "", gestureStart: 0, cooldownUntil: 0, calibration: null,
  aiTimer: 0, aiRequest: 0, aiCache: new Map(), demoTimers: [], suggestions: [], soundContext: null
};
let channel;

function renderHome() {
  root.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <a class="brand" href="${appBase}" aria-label="Voxeye home">${icon("Voxeye")}<span>voxeye</span></a>
        <nav aria-label="Main navigation">
          <button class="text-button" id="theme-button" type="button">Light theme</button>
          <button class="text-button" id="settings-button" type="button">Settings</button>
          <a class="text-button" href="${caregiverUrl}" target="_blank" rel="noreferrer">Caregiver <span aria-hidden="true">↗</span></a>
          <button class="button button-small" id="demo-button" type="button">Try demo</button>
        </nav>
      </header>

      <main>
        <section class="intro" aria-labelledby="page-title">
          <div><p class="eyebrow">YOUR VOICE, YOUR PACE</p><h1 id="page-title">Find the words.<br /><span>We'll help you say them.</span></h1></div>
          <p class="intro-copy">Blink to spell, choose a suggestion, and share your message with someone nearby.</p>
        </section>

        <div class="work-grid">
          <div class="camera-column">
          <section class="camera-card card" aria-labelledby="camera-title">
            <div class="section-heading"><div><p class="eyebrow">EYE + HAND INPUT</p><h2 id="camera-title">Your camera</h2></div><span class="status-pill" id="camera-status" aria-live="polite">Camera off</span></div>
            <div class="camera-stage" id="camera-stage">
              <video id="camera-video" autoplay muted playsinline aria-label="Live camera preview"></video>
              <canvas id="camera-overlay" aria-hidden="true"></canvas>
              <div class="camera-empty" id="camera-empty"><div class="camera-eye">${icon("Voxeye")}</div><strong>Ready when you are</strong><span>Your video stays on this device.</span></div>
              <div class="debug-overlay" id="debug-overlay" hidden></div>
            </div>
            <div class="camera-footer"><button class="button" id="camera-button" type="button">Start camera</button><p id="feedback" role="status" aria-live="polite">Allow camera access to use blinks and gestures, or try the demo.</p></div>
          </section>
          <section class="morse-card card" aria-labelledby="morse-title">
            <div class="section-heading"><div><p class="eyebrow">LETTER GUIDE</p><h2 id="morse-title">Morse alphabet</h2></div><span class="morse-key" aria-label="Dot and dash">· dot &nbsp; — dash</span></div>
            <p class="reference-copy">Short blinks make dots; long blinks make dashes. Example: WAT = ·—— ·— —.</p>
            <div class="morse-letter-grid" id="morse-letter-grid" aria-label="Morse code alphabet"></div>
          </section>
          </div>

          <section class="message-column" aria-labelledby="message-title">
            <div class="message-card card">
              <div class="section-heading"><div><p class="eyebrow">YOUR MESSAGE</p><h2 id="message-title">What would you like to say?</h2></div><span class="message-mark" aria-hidden="true">Aa</span></div>
              <label class="sr-only" for="message-input">Message to speak</label>
              <textarea id="message-input" rows="2" placeholder="Your words will appear here" aria-describedby="morse-output morse-help"></textarea>
              <div class="morse-row"><span class="morse-label">MORSE</span><span id="morse-output" aria-live="polite">Waiting for a blink…</span></div>
              <p class="morse-help" id="morse-help"></p>
              <div class="suggestion-area"><div class="suggestion-heading"><span>Suggestions</span><span id="suggestion-status" aria-live="polite"></span></div><div class="suggestions" id="suggestions" aria-label="Suggested messages"></div></div>
              <div class="message-actions"><button class="button button-primary" id="speak-button" type="button">${icon("Voxeye")}<span>Speak</span></button><button class="button button-secondary" id="delete-button" type="button">Delete</button><button class="button button-secondary" id="clear-button" type="button">Clear</button></div>
            </div>
            <div class="quick-section"><div class="quick-heading"><h2>Quick phrases</h2><span>Tap or hold the matching gesture</span></div><div class="quick-grid" id="quick-grid"></div></div>
          </section>
        </div>

        <footer class="privacy-note"><span class="privacy-dot" aria-hidden="true"></span><p>Voxeye is an assistive communication aid, not a medical or diagnostic device. Video is processed in your browser and is never uploaded or stored.</p></footer>
      </main>
    </div>

    <dialog class="settings-dialog" id="settings-dialog" aria-labelledby="settings-title">
      <form method="dialog" class="dialog-top"><div><p class="eyebrow">MAKE IT YOURS</p><h2 id="settings-title">Settings</h2></div><button class="close-button" aria-label="Close settings">×</button></form>
      <div class="calibrate-card"><div><strong>Calibrate to me</strong><p id="calibration-status">A few normal blinks, then a few longer ones.</p></div><button class="button button-primary" id="calibrate-button" type="button">Calibrate</button></div>
      <div class="settings-group"><h3>Blink timing</h3>
        <label class="range-setting">Blink sensitivity <output id="threshold-value"></output><input id="threshold-range" type="range" min="0.25" max="0.9" step="0.01" aria-label="Blink sensitivity" /></label>
        <label class="range-setting">Dot / dash cutoff <output id="cutoff-value"></output><input id="cutoff-range" type="range" min="250" max="700" step="10" aria-label="Dot and dash cutoff in milliseconds" /></label>
        <label class="range-setting">Letter pause <output id="letter-gap-value"></output><input id="letter-gap-range" type="range" min="800" max="2000" step="50" aria-label="Letter pause in milliseconds" /></label>
        <label class="range-setting">Word pause <output id="word-gap-value"></output><input id="word-gap-range" type="range" min="1700" max="4000" step="50" aria-label="Word pause in milliseconds" /></label>
        <label class="range-setting">Gesture hold <output id="hold-value"></output><input id="hold-range" type="range" min="600" max="2000" step="100" aria-label="Gesture hold time in milliseconds" /></label>
      </div>
      <div class="settings-group"><h3>Gesture phrases</h3><div class="mapping-list" id="mapping-list"></div></div>
      <label class="debug-toggle"><input id="debug-toggle" type="checkbox" /> Show debug overlay</label>
      <button class="text-button reset-button" id="reset-settings" type="button">Reset to defaults</button>
    </dialog>

    <dialog class="onboarding-dialog" id="onboarding-dialog" aria-labelledby="onboarding-title">
      <div class="onboarding-mark">${icon("Voxeye")}</div><p class="eyebrow" id="onboarding-step">STEP 1 OF 3</p><h2 id="onboarding-title">Start with your camera</h2><p id="onboarding-copy">When you are ready, allow camera access. Your video stays on this device.</p>
      <div class="onboarding-actions"><button class="text-button" id="onboarding-skip" type="button">Skip</button><button class="button button-primary" id="onboarding-next" type="button">Allow camera</button></div>
    </dialog>
  `;
  renderQuickPhrases();
  renderMorseReference();
  bindHomeEvents();
  syncSettings();
  setupTheme();
  showOnboarding();
}

function renderMorseReference() {
  const grid = document.querySelector("#morse-letter-grid");
  if (!grid) return;
  grid.innerHTML = Object.entries(config.morseLetters).map(([letter, code]) =>
    "<div><strong>" + letter + "</strong><code>" + code.replaceAll(".", "·").replaceAll("-", "—") + "</code></div>"
  ).join("");
}

function renderQuickPhrases() {
  const host = document.querySelector("#quick-grid");
  host.innerHTML = Object.entries(config.gestures.phrases).map(([gesture, phrase]) => `
    <button class="quick-card" data-gesture="${gesture}" type="button" aria-label="Say ${phrase.label}. Gesture: ${gesture.replaceAll("_", " ")}">
      <span class="progress-ring" aria-hidden="true">${icon(gesture)}</span><span class="quick-label">${phrase.label}</span>
    </button>`).join("");
  host.querySelectorAll("[data-gesture]").forEach((button) => button.addEventListener("click", () => confirmMessage(config.gestures.phrases[button.dataset.gesture].text, config.gestures.phrases[button.dataset.gesture].urgent)));
}

function renderCaregiver() {
  root.innerHTML = `
    <div class="shell caregiver-shell">
      <header class="topbar"><a class="brand" href="${appBase}">${icon("Voxeye")}<span>voxeye</span></a><nav><a class="text-button" href="${appBase}">Communication screen</a><button class="text-button" id="sound-button" type="button">Enable alert sound</button></nav></header>
      <main class="caregiver-main"><p class="eyebrow">CAREGIVER SCREEN</p><h1>Messages</h1><p class="caregiver-copy">Confirmed messages from the Voxeye screen appear here.</p>
        <section class="urgent-banner" id="urgent-banner" role="alert" hidden><span class="alert-symbol" aria-hidden="true">!</span><div><strong>Urgent message</strong><span id="urgent-text"></span></div></section>
        <section class="timeline" aria-label="Message history"><div class="timeline-heading"><h2>Recent messages</h2><span id="message-count">0 messages</span></div><div id="timeline-list"><div class="empty-timeline" id="empty-timeline">Messages will appear here when they are spoken or confirmed.</div></div></section>
        <p class="caregiver-note">Voxeye is an assistive communication aid, not a medical or diagnostic device.</p>
      </main>
    </div>`;
  const channel = openChannel();
  channel?.addEventListener("message", (event) => {
    if (event.data?.type !== "message") return;
    addCaregiverMessage(event.data);
  });
  document.querySelector("#sound-button").addEventListener("click", enableAlertSound);
}

function openChannel() {
  if (!("BroadcastChannel" in window)) return null;
  return new BroadcastChannel("voxeye-messages");
}

function setFeedback(message) {
  const item = document.querySelector("#feedback");
  if (item) item.textContent = message;
}

function setCameraStatus(message) {
  const pill = document.querySelector("#camera-status");
  if (pill && pill.textContent !== message) pill.textContent = message;
}

function setInputMessage(value) {
  const input = document.querySelector("#message-input");
  if (!input) return;
  input.value = value;
  scheduleSuggestions(value);
}

function renderMorse() {
  const output = document.querySelector("#morse-output");
  if (!output) return;
  const label = state.currentCode ? state.currentCode.replaceAll(".", "•").replaceAll("-", "—") : "Waiting for a blink…";
  output.textContent = label;
}

function decodeCurrentLetter() {
  if (!state.currentCode) return;
  const letter = config.morseLetters[state.currentCode];
  if (letter) setInputMessage(document.querySelector("#message-input").value + letter);
  state.currentCode = "";
  renderMorse();
}

function processMorseTimers(now) {
  if (!state.lastSignalAt) return;
  const idle = now - state.lastSignalAt;
  if (state.currentCode && idle >= config.morse.letterGapMs) decodeCurrentLetter();
  if (idle >= config.morse.wordGapMs && !state.wordSpaceAdded) {
    const input = document.querySelector("#message-input");
    if (input?.value && !input.value.endsWith(" ")) setInputMessage(`${input.value} `);
    state.wordSpaceAdded = true;
  }
}

function recordMorseBlink(duration) {
  if (duration < config.morse.ignoreBlinkMs) return;
  state.currentCode += duration < config.morse.dotDashMs ? "." : "-";
  state.lastSignalAt = performance.now();
  state.wordSpaceAdded = false;
  renderMorse();
  const stage = document.querySelector("#camera-stage");
  stage?.classList.add("blink-flash");
  setTimeout(() => stage?.classList.remove("blink-flash"), 280);
  setFeedback(duration < config.morse.dotDashMs ? "Dot received" : "Dash received");
}

function processEyeFrame(leftValue, rightValue, now) {
  const threshold = config.morse.blinkThreshold;
  const reopen = threshold * config.morse.releaseRatio;
  state.leftClosed = state.leftClosed ? leftValue > reopen : leftValue >= threshold;
  state.rightClosed = state.rightClosed ? rightValue > reopen : rightValue >= threshold;
  const both = state.leftClosed && state.rightClosed;
  const cal = state.calibration;
  if (cal && !both) {
    cal.open.push((leftValue + rightValue) / 2);
    if (cal.open.length > 30) cal.open.shift();
  }

  if (both && !state.eyeStart) {
    state.eyeStart = now;
    state.eyePeak = (leftValue + rightValue) / 2;
  } else if (both && state.eyeStart) {
    state.eyePeak = Math.max(state.eyePeak, (leftValue + rightValue) / 2);
  } else if (!both && state.eyeStart) {
    const duration = now - state.eyeStart;
    state.eyeStart = 0;
    if (duration >= config.morse.pauseMs) {
      setCameraStatus("Face detected");
      setFeedback("Rest break complete");
    } else if (cal) collectCalibrationBlink(duration, state.eyePeak, cal);
    else recordMorseBlink(duration);
  }

  if (both && state.eyeStart && now - state.eyeStart >= config.morse.pauseMs) {
    setCameraStatus("Paused");
    setFeedback("Paused — open your eyes when you are ready");
  }

  const oneEye = state.leftClosed !== state.rightClosed;
  const side = state.leftClosed ? "left" : state.rightClosed ? "right" : "";
  if (!oneEye) state.wink = null;
  else if (!state.wink || state.wink.side !== side) state.wink = { side, start: now, fired: false };
  else if (!state.wink.fired && now - state.wink.start >= config.morse.winkMs) {
    state.wink.fired = true;
    if (cal) setFeedback("Calibration is reading your blink timing");
    else if (side === "left") deleteLast();
    else speakCurrent();
  }
  if (state.calibration) updateCalibrationText();
}

function collectCalibrationBlink(duration, peak, cal) {
  const open = cal.open.length ? cal.open.reduce((sum, value) => sum + value, 0) / cal.open.length : 0.08;
  const sample = { duration, peak, open };
  if (cal.phase === "normal" && duration <= config.calibration.minimumLongMs) cal.normal.push(sample);
  if (cal.phase === "long" && duration >= config.calibration.minimumLongMs) cal.long.push(sample);
  const count = config.calibration.sampleCount;
  if (cal.normal.length >= count && cal.phase === "normal") {
    cal.phase = "long";
    setFeedback("Normal blinks recorded. Now make three longer blinks.");
  }
  if (cal.long.length >= count) finishCalibration(cal);
  updateCalibrationText();
}

function updateCalibrationText() {
  const cal = state.calibration;
  const item = document.querySelector("#calibration-status");
  const button = document.querySelector("#calibrate-button");
  if (!cal || !item || !button) return;
  const count = cal.phase === "normal" ? cal.normal.length : cal.long.length;
  item.textContent = cal.phase === "normal" ? `Blink normally ${count} of ${config.calibration.sampleCount} times.` : `Make a longer blink ${count} of ${config.calibration.sampleCount} times.`;
  button.textContent = "Cancel";
}

function finishCalibration(cal) {
  const normalMax = Math.max(...cal.normal.map((item) => item.duration));
  const longMin = Math.min(...cal.long.map((item) => item.duration));
  config.morse.dotDashMs = Math.round((normalMax + longMin) / 2 / 10) * 10;
  const open = [...cal.normal, ...cal.long].reduce((sum, item) => sum + item.open, 0) / (cal.normal.length + cal.long.length);
  const closed = [...cal.normal, ...cal.long].reduce((sum, item) => sum + item.peak, 0) / (cal.normal.length + cal.long.length);
  config.morse.blinkThreshold = Math.min(config.calibration.maxThreshold, Math.max(config.calibration.minThreshold, (open + closed) / 2));
  state.calibration = null;
  syncSettings();
  const button = document.querySelector("#calibrate-button");
  if (button) button.textContent = "Calibrate";
  const label = document.querySelector("#calibration-status");
  if (label) label.textContent = "Calibration complete. Your timing has been updated.";
  setFeedback("Calibration complete");
}

function startCalibration() {
  if (!state.running || !state.face) {
    setFeedback(state.running ? "The face model is unavailable, so calibration cannot start." : "Start the camera before calibrating.");
    return;
  }
  if (state.calibration) {
    state.calibration = null;
    const button = document.querySelector("#calibrate-button");
    if (button) button.textContent = "Calibrate";
    const status = document.querySelector("#calibration-status");
    if (status) status.textContent = "Calibration stopped.";
    return;
  }
  state.calibration = { phase: "normal", normal: [], long: [], open: [] };
  setFeedback("Blink normally three times to begin calibration.");
  updateCalibrationText();
}

function updateGesture(gesture, confidence, now) {
  const accepted = gesture && confidence >= config.gestures.minConfidence && config.gestures.phrases[gesture];
  const name = accepted ? gesture : "";
  const progress = name && now >= state.cooldownUntil ? (state.heldGesture === name ? Math.min(1, (now - state.gestureStart) / config.gestures.holdMs) : 0) : 0;
  if (name && now >= state.cooldownUntil) {
    if (state.heldGesture !== name) {
      if (state.heldGesture) setGestureRing(state.heldGesture, 0);
      state.heldGesture = name;
      state.gestureStart = now;
    }
    const currentProgress = Math.min(1, (now - state.gestureStart) / config.gestures.holdMs);
    setGestureRing(name, currentProgress);
    if (currentProgress >= 1) {
      const phrase = config.gestures.phrases[name];
      state.cooldownUntil = now + config.gestures.cooldownMs;
      state.heldGesture = "";
      setGestureRing(name, 0);
      confirmMessage(phrase.text, phrase.urgent);
    }
  } else {
    if (state.heldGesture) setGestureRing(state.heldGesture, 0);
    state.heldGesture = "";
  }
  const debug = document.querySelector("#debug-overlay");
  if (debug && !debug.hidden) debug.dataset.gesture = `${name || "none"} ${Math.round(progress * 100)}%`;
}

function setGestureRing(name, progress) {
  const ring = document.querySelector(`[data-gesture="${name}"] .progress-ring`);
  if (ring) ring.style.setProperty("--progress", `${Math.round(progress * 100)}%`);
}

async function loadVision() {
  const bundle = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${config.mediapipe.version}/vision_bundle.mjs`;
  const { FilesetResolver, FaceLandmarker, GestureRecognizer } = await import(/* @vite-ignore */ bundle);
  state.vision = await FilesetResolver.forVisionTasks(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${config.mediapipe.version}/wasm`);
  const makeTask = async (Task, model, options) => {
    try { return await Task.createFromOptions(state.vision, { ...options, baseOptions: { modelAssetPath: model, delegate: "GPU" } }); }
    catch { return Task.createFromOptions(state.vision, { ...options, baseOptions: { modelAssetPath: model, delegate: "CPU" } }); }
  };
  const [face, hands] = await Promise.allSettled([
    makeTask(FaceLandmarker, config.mediapipe.faceModel, { runningMode: "VIDEO", numFaces: 1, outputFaceBlendshapes: true }),
    makeTask(GestureRecognizer, config.mediapipe.gestureModel, { runningMode: "VIDEO", numHands: 1, minHandDetectionConfidence: config.gestures.minConfidence })
  ]);
  state.face = face.status === "fulfilled" ? face.value : null;
  state.hands = hands.status === "fulfilled" ? hands.value : null;
  if (!state.face && !state.hands) throw new Error("The camera models could not be loaded.");
  if (!state.face) setFeedback("Hand gestures are ready. The face model could not load.");
  else if (!state.hands) setFeedback("Blink input is ready. The hand model could not load.");
  else setFeedback("Face detected when you are in view. Blink to begin.");
}

async function startCamera() {
  if (state.running) { stopCamera(); return; }
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
    const video = document.querySelector("#camera-video");
    video.srcObject = state.stream;
    await video.play();
    state.running = true;
    document.querySelector("#camera-empty").hidden = true;
    document.querySelector("#camera-button").textContent = "Stop camera";
    setCameraStatus("Finding face");
    setFeedback("Loading on-device vision models…");
    try { await loadVision(); }
    catch (error) { console.warn(error); setFeedback("Camera is on, but a vision model did not load. You can still type or use demo mode."); }
    requestAnimationFrame(detectionLoop);
  } catch (error) {
    setCameraStatus("Camera unavailable");
    setFeedback(error.name === "NotAllowedError" ? "Camera access was declined. You can type a message or try demo mode." : "Camera is unavailable. Try demo mode or type a message.");
  }
}

function stopCamera() {
  state.running = false;
  state.stream?.getTracks().forEach((track) => track.stop());
  state.stream = null;
  state.face?.close();
  state.hands?.close();
  state.face = state.hands = null;
  const video = document.querySelector("#camera-video");
  if (video) video.srcObject = null;
  const empty = document.querySelector("#camera-empty");
  if (empty) empty.hidden = false;
  const button = document.querySelector("#camera-button");
  if (button) button.textContent = "Start camera";
  setCameraStatus("Camera off");
  setFeedback("Camera is off. You can still type, use quick phrases, or try demo mode.");
}

function detectionLoop() {
  if (!state.running) return;
  const video = document.querySelector("#camera-video");
  const now = performance.now();
  processMorseTimers(now);
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.currentTime !== state.lastVideoTime) {
    state.lastVideoTime = video.currentTime;
    let faceFound = false;
    if (state.face) {
      try {
        const result = state.face.detectForVideo(video, now);
        const categories = result.faceBlendshapes?.[0]?.categories || [];
        const value = (name) => categories.find((item) => item.categoryName === name)?.score || 0;
        if (result.faceLandmarks?.length) {
          faceFound = true;
          state.facePoints = result.faceLandmarks[0];
          processEyeFrame(value("eyeBlinkLeft"), value("eyeBlinkRight"), now);
          if (state.calibration && !state.eyeStart) setCameraStatus("Calibrating");
          else if (document.querySelector("#camera-status")?.textContent !== "Paused") setCameraStatus("Face detected");
          updateDebug(`${Math.round(value("eyeBlinkLeft") * 100)} / ${Math.round(value("eyeBlinkRight") * 100)} · ${state.leftClosed || state.rightClosed ? "closed" : "open"} · ${state.currentCode || "—"}`, result.faceLandmarks[0].length, 0);
        } else {
          state.facePoints = [];
          state.leftClosed = state.rightClosed = false;
          if (state.eyeStart) { state.eyeStart = 0; state.currentCode = ""; renderMorse(); }
        }
      } catch (error) { console.warn("Face recognition stopped", error); state.face?.close(); state.face = null; state.facePoints = []; }
    } else state.facePoints = [];
    let handFound = false;
    if (state.hands && now - state.lastGestureAt >= config.mediapipe.gestureIntervalMs) {
      state.lastGestureAt = now;
      try {
        const result = state.hands.recognizeForVideo(video, now);
        const category = result.gestures?.[0]?.[0];
        handFound = Boolean(result.handLandmarks?.length);
        state.handPoints = result.handLandmarks?.[0] || [];
        updateGesture(category?.categoryName, category?.score || 0, now);
        updateDebug(null, faceFound ? 478 : 0, result.handLandmarks?.[0]?.length || 0);
      } catch (error) { console.warn("Gesture recognition stopped", error); state.hands?.close(); state.hands = null; state.handPoints = []; }
    } else if (!state.hands) { state.handPoints = []; updateGesture("", 0, now); }
    drawLandmarks(state.facePoints, state.handPoints);
    if (faceFound && document.querySelector("#camera-status")?.textContent !== "Paused") setCameraStatus(handFound ? "Hand detected" : "Face detected");
    else if (!faceFound && document.querySelector("#camera-status")?.textContent !== "Paused") setCameraStatus("Find your face");
  }
  requestAnimationFrame(detectionLoop);
}

function drawLandmarks(facePoints, handPoints) {
  const canvas = document.querySelector("#camera-overlay");
  const video = document.querySelector("#camera-video");
  if (!canvas || !video.videoWidth) return;
  if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (document.querySelector("#debug-overlay")?.hidden !== false) return;
  const draw = (points, color, radius) => {
    context.fillStyle = color;
    for (const point of points || []) {
      context.beginPath();
      context.arc(point.x * canvas.width, point.y * canvas.height, radius, 0, Math.PI * 2);
      context.fill();
    }
  };
  const style = getComputedStyle(document.documentElement);
  draw(facePoints, style.getPropertyValue("--accent"), 1.5);
  draw(handPoints, style.getPropertyValue("--amber"), 3);
}

function updateDebug(blinks, faces, hands) {
  const debug = document.querySelector("#debug-overlay");
  if (!debug || debug.hidden) return;
  if (blinks) debug.dataset.eyes = blinks;
  debug.dataset.landmarks = `face ${faces} · hand ${hands}`;
  debug.dataset.morse = state.currentCode || "—";
  debug.textContent = `Eyes: ${debug.dataset.eyes || "waiting"}\nLandmarks: ${debug.dataset.landmarks}\nGesture: ${debug.dataset.gesture || "none"}\nMorse: ${debug.dataset.morse}`;
}

function localSuggestions(value) {
  const text = value.trim().toUpperCase();
  const matches = [
    [/WAT|WATER|DRINK/, ["I would like some water.", "Please bring me a drink.", "I am thirsty."]],
    [/HEL|HELP/, ["I need help.", "Please come help me.", "I need assistance."]],
    [/PAI|PAIN/, ["I am in pain.", "Something hurts.", "Please help me feel comfortable."]],
    [/YES|Y$/, ["Yes, please.", "That sounds good.", "I would like that."]],
    [/NO|N$/, ["No, thank you.", "I would rather not.", "Please give me a moment."]]
  ].find(([pattern]) => pattern.test(text));
  if (matches) return matches[1];
  const words = value.replace(/[^a-z\s]/gi, " ").trim();
  return words ? [`I would like to say ${words.toLowerCase()}.`, `Please help me with ${words.toLowerCase()}.`] : [];
}

function scheduleSuggestions(value) {
  clearTimeout(state.aiTimer);
  const text = value.trim();
  const letters = text.replace(/[^a-z]/gi, "").length;
  const box = document.querySelector("#suggestions");
  const status = document.querySelector("#suggestion-status");
  if (!box || !status) return;
  if (letters < config.suggestions.minimumLetters) {
    box.innerHTML = "";
    status.textContent = "";
    return;
  }
  if (state.aiCache.has(text)) { renderSuggestions(state.aiCache.get(text)); return; }
  status.textContent = "Finding a few words…";
  const requestId = ++state.aiRequest;
  state.aiTimer = setTimeout(async () => {
    let results = [];
    if (__VOXEYE_GEMINI_READY__) {
      try {
        const response = await fetch("/api/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
        if (response.ok) results = (await response.json()).suggestions || [];
      } catch { /* Local phrases keep suggestions available offline. */ }
    }
    if (!results.length) results = localSuggestions(text);
    if (requestId !== state.aiRequest) return;
    state.aiCache.set(text, results);
    if (state.aiCache.size > config.suggestions.cacheSize) state.aiCache.delete(state.aiCache.keys().next().value);
    renderSuggestions(results);
  }, config.suggestions.debounceMs);
}

function renderSuggestions(items) {
  state.suggestions = items.slice(0, config.suggestions.maxCount);
  const box = document.querySelector("#suggestions");
  const status = document.querySelector("#suggestion-status");
  if (!box || !status) return;
  box.innerHTML = state.suggestions.map((item, index) => `<button class="suggestion-chip" type="button" data-suggestion="${index}">${escapeHTML(item)}</button>`).join("");
  box.querySelectorAll("[data-suggestion]").forEach((button) => button.addEventListener("click", () => setInputMessage(state.suggestions[Number(button.dataset.suggestion)])));
  status.textContent = state.suggestions.length ? "Choose one to use it" : "Keep typing to see suggestions";
}

function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function deleteLast() {
  const input = document.querySelector("#message-input");
  if (!input) return;
  if (state.currentCode) state.currentCode = state.currentCode.slice(0, -1);
  else input.value = input.value.slice(0, -1);
  renderMorse();
  scheduleSuggestions(input.value);
  setFeedback("Deleted");
}

function speakCurrent() {
  decodeCurrentLetter();
  const text = document.querySelector("#message-input")?.value.trim();
  if (text) confirmMessage(text);
  else setFeedback("There is no message to speak yet.");
}

function confirmMessage(text, urgent = false) {
  const message = String(text || "").trim();
  if (!message) { setFeedback("Type or blink a message first."); return; }
  setInputMessage(message);
  const isUrgent = urgent || /\b(help|pain)\b/i.test(message);
  const event = { type: "message", text: message, urgent: isUrgent, timestamp: Date.now() };
  channel ||= openChannel();
  channel?.postMessage(event);
  if (!channel) setFeedback("Message ready. BroadcastChannel is not available in this browser.");
  else setFeedback(isUrgent ? "Urgent message sent to caregiver" : "Message sent to caregiver");
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  }
}

function runDemo() {
  state.demoTimers.forEach(clearTimeout);
  state.demoTimers = [];
  state.currentCode = "";
  renderMorse();
  setInputMessage("");
  setCameraStatus("Demo mode");
  setFeedback("Demo started: blink Morse, choose a sentence, then send an urgent Help alert.");
  const schedule = (delay, action) => state.demoTimers.push(setTimeout(action, delay));
  const phrases = ["I would like some water.", "Please bring me a drink.", "I am thirsty."];
  schedule(config.demo.messageMs, () => {
    setInputMessage("WAT");
    renderSuggestions(phrases);
    setFeedback("Demo: W · A · T decoded. Choose a suggestion below.");
  });
  schedule(config.demo.selectMs, () => {
    setInputMessage(phrases[0]);
    setFeedback("Demo: sentence selected. Speaking next.");
  });
  schedule(config.demo.speakMs, () => confirmMessage(phrases[0]));
  schedule(config.demo.helpStartMs, () => {
    const button = document.querySelector('[data-gesture="Victory"] .progress-ring');
    if (button) { button.style.setProperty("--progress", "100%"); button.classList.add("holding"); }
    setFeedback("Demo: holding the Help gesture…");
    state.demoTimers.push(setTimeout(() => {
      if (button) { button.style.setProperty("--progress", "0%"); button.classList.remove("holding"); }
      const phrase = config.gestures.phrases.Victory;
      confirmMessage(phrase.text, phrase.urgent);
      setCameraStatus("Demo complete");
      setFeedback("Demo complete. Open Caregiver to see both messages.");
    }, config.gestures.holdMs));
  });
}

function setupTheme() {
  let theme = "dark";
  try { theme = localStorage.getItem("voxeye-theme") || "dark"; } catch { /* private browsing */ }
  document.documentElement.dataset.theme = theme;
  document.querySelector("#theme-button").textContent = theme === "dark" ? "Light theme" : "Dark theme";
  document.querySelector("#theme-button").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.querySelector("#theme-button").textContent = next === "dark" ? "Light theme" : "Dark theme";
    try { localStorage.setItem("voxeye-theme", next); } catch { /* private browsing */ }
  });
}

function syncSettings() {
  const sliders = [
    ["threshold", config.morse.blinkThreshold, (value) => `${Math.round(value * 100)}%`],
    ["cutoff", config.morse.dotDashMs, (value) => `${value} ms`],
    ["letter-gap", config.morse.letterGapMs, (value) => `${value} ms`],
    ["word-gap", config.morse.wordGapMs, (value) => `${value} ms`],
    ["hold", config.gestures.holdMs, (value) => `${value} ms`]
  ];
  for (const [name, value, format] of sliders) {
    const slider = document.querySelector(`#${name}-range`);
    const output = document.querySelector(`#${name}-value`);
    if (slider && output) { slider.value = value; output.value = format(value); }
  }
  const help = document.querySelector("#morse-help");
  if (help) help.textContent = "Short blink (" + config.morse.ignoreBlinkMs + "–" + (config.morse.dotDashMs - 1) + " ms) = dot ·; long blink (" + config.morse.dotDashMs + " ms or more) = dash —. Example: SOS = ··· ——— ···.";
  const mappings = document.querySelector("#mapping-list");
  if (mappings) mappings.innerHTML = Object.entries(config.gestures.phrases).map(([gesture, phrase]) => `<label class="mapping-row"><span>${gesture.replaceAll("_", " ")}</span><input data-phrase="${gesture}" value="${escapeHTML(phrase.text)}" aria-label="Phrase for ${gesture.replaceAll("_", " ")}" /></label>`).join("");
}

function bindHomeEvents() {
  channel = openChannel();
  document.querySelector("#camera-button").addEventListener("click", startCamera);
  document.querySelector("#speak-button").addEventListener("click", speakCurrent);
  document.querySelector("#delete-button").addEventListener("click", deleteLast);
  document.querySelector("#clear-button").addEventListener("click", () => {
    state.currentCode = ""; state.lastSignalAt = 0; renderMorse(); setInputMessage(""); setFeedback("Message cleared");
  });
  document.querySelector("#message-input").addEventListener("input", (event) => scheduleSuggestions(event.currentTarget.value));
  document.querySelector("#demo-button").addEventListener("click", runDemo);
  const dialog = document.querySelector("#settings-dialog");
  document.querySelector("#settings-button").addEventListener("click", () => dialog.showModal());
  document.querySelector("#calibrate-button").addEventListener("click", startCalibration);
  document.querySelector("#debug-toggle").addEventListener("change", (event) => {
    const overlay = document.querySelector("#debug-overlay");
    overlay.hidden = !event.currentTarget.checked;
  });
  const settings = [
    ["threshold-range", (value) => config.morse.blinkThreshold = Number(value)],
    ["cutoff-range", (value) => config.morse.dotDashMs = Number(value)],
    ["letter-gap-range", (value) => config.morse.letterGapMs = Number(value)],
    ["word-gap-range", (value) => config.morse.wordGapMs = Number(value)],
    ["hold-range", (value) => config.gestures.holdMs = Number(value)]
  ];
  settings.forEach(([id, setValue]) => document.querySelector(`#${id}`).addEventListener("input", (event) => {
    setValue(event.currentTarget.value); syncSettings();
  }));
  document.querySelector("#mapping-list").addEventListener("change", (event) => {
    const gesture = event.target.dataset.phrase;
    if (gesture) config.gestures.phrases[gesture].text = event.target.value.trim() || CONFIG.gestures.phrases[gesture].text;
    renderQuickPhrases();
  });
  document.querySelector("#reset-settings").addEventListener("click", () => {
    Object.assign(config.morse, clone(CONFIG.morse));
    config.gestures.holdMs = CONFIG.gestures.holdMs;
    config.gestures.phrases = clone(CONFIG.gestures.phrases);
    syncSettings(); renderQuickPhrases();
  });
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); speakCurrent(); }
    if (event.key === "Escape" && state.calibration) startCalibration();
    if (!event.target.matches("input, textarea, button") && /^[1-5]$/.test(event.key)) {
      const phrase = Object.values(config.gestures.phrases)[Number(event.key) - 1];
      if (phrase) confirmMessage(phrase.text, phrase.urgent);
    }
  });
  document.querySelector("#onboarding-skip").addEventListener("click", closeOnboarding);
  document.querySelector("#onboarding-next").addEventListener("click", async () => {
    const step = Number(document.querySelector("#onboarding-step").dataset.step || 1);
    if (step === 1) await startCamera();
    if (step >= 3) { closeOnboarding(); return; }
    showOnboardingStep(step + 1);
  });
}

function showOnboarding() {
  let seen = false;
  try { seen = localStorage.getItem("voxeye-onboarding-complete") === "true"; } catch { /* private browsing */ }
  if (!seen) document.querySelector("#onboarding-dialog").showModal();
}

function showOnboardingStep(step) {
  const content = [
    ["Start with your camera", "When you are ready, allow camera access. Your video stays on this device.", "Allow camera"],
    ["Calibrate to you", "A few normal blinks and longer blinks help set timing that feels comfortable.", "Next"],
    ["Try a message", "Blink Morse, tap a phrase, or use the demo. Speak confirms and shares your message.", "Get started"]
  ][step - 1];
  const label = document.querySelector("#onboarding-step");
  label.dataset.step = step;
  label.textContent = `STEP ${step} OF 3`;
  document.querySelector("#onboarding-title").textContent = content[0];
  document.querySelector("#onboarding-copy").textContent = content[1];
  document.querySelector("#onboarding-next").textContent = content[2];
}

function closeOnboarding() {
  document.querySelector("#onboarding-dialog").close();
  try { localStorage.setItem("voxeye-onboarding-complete", "true"); } catch { /* private browsing */ }
}

function addCaregiverMessage(message) {
  const host = document.querySelector("#timeline-list");
  document.querySelector("#empty-timeline")?.remove();
  const item = document.createElement("article");
  item.className = `timeline-message${message.urgent ? " urgent-message" : ""}`;
  const time = new Date(message.timestamp || Date.now());
  item.innerHTML = `<p>${escapeHTML(message.text)}</p><time datetime="${time.toISOString()}">${time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time>${message.urgent ? '<span class="urgent-label">URGENT</span>' : ""}`;
  host.prepend(item);
  const count = host.querySelectorAll(".timeline-message").length;
  document.querySelector("#message-count").textContent = `${count} ${count === 1 ? "message" : "messages"}`;
  if (message.urgent) {
    const banner = document.querySelector("#urgent-banner");
    banner.hidden = false;
    document.querySelector("#urgent-text").textContent = message.text;
    playAlert();
  }
}

async function enableAlertSound() {
  try {
    state.soundContext ||= new AudioContext();
    await state.soundContext.resume();
    document.querySelector("#sound-button").textContent = "Alert sound enabled";
  } catch { document.querySelector("#sound-button").textContent = "Sound unavailable"; }
}

function playAlert() {
  if (!state.soundContext || state.soundContext.state !== "running") return;
  const context = state.soundContext;
  [0, 0.22].forEach((delay) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 660;
    gain.gain.setValueAtTime(0.0001, context.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + delay + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + delay + 0.16);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(context.currentTime + delay);
    oscillator.stop(context.currentTime + delay + 0.17);
  });
}

const isCaregiver = location.hash === "#caregiver" || location.pathname.replace(/\/$/, "").endsWith("/caregiver");
if (isCaregiver) renderCaregiver(); else renderHome();

if (!isCaregiver) {
  window.addEventListener("pagehide", stopCamera, { once: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.running) setCameraStatus("Camera running");
  });
}
