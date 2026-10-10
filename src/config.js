export const CONFIG = {
  geminiModel: "gemini-3.8-flash",
  mediapipe: {
    version: "1.1.0",
    faceModel: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
    gestureModel: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
    gestureIntervalMs: 90
  },
  morse: {
    blinkThreshold: 0.62,
    releaseRatio: 0.62,
    ignoreBlinkMs: 120,
    dotDashMs: 400,
    letterGapMs: 1200,
    wordGapMs: 2500,
    pauseMs: 2000,
    winkMs: 300
  },
  gestures: {
    holdMs: 1000,
    cooldownMs: 2000,
    minConfidence: 0.55,
    phrases: {
      Thumb_Up: { label: "Yes", text: "Yes" },
      Open_Palm: { label: "No", text: "No" },
      Pointing_Up: { label: "Water", text: "I would like some water." },
      Victory: { label: "Help", text: "I need help.", urgent: true },
      Closed_Fist: { label: "Pain", text: "I am in pain.", urgent: true }
    }
  },
  suggestions: { debounceMs: 800, minimumLetters: 2, cacheSize: 20, maxCount: 3, maxChars: 120, maxOutputTokens: 160 },
  demo: { messageMs: 450, selectMs: 1500, speakMs: 3200, helpStartMs: 5200 },
  calibration: { sampleCount: 3, minimumLongMs: 600, minThreshold: 0.25, maxThreshold: 0.9 },
  morseLetters: {
    ".-": "A", "-...": "B", "-.-.": "C", "-..": "D", ".": "E", "..-.": "F",
    "--.": "G", "....": "H", "..": "I", ".---": "J", "-.-": "K", ".-..": "L",
    "--": "M", "-.": "N", "---": "O", ".--.": "P", "--.-": "Q", ".-.": "R",
    "...": "S", "-": "T", "..-": "U", "...-": "V", ".--": "W", "-..-": "X",
    "-.--": "Y", "--..": "Z"
  }
};
