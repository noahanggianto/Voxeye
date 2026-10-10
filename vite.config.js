import { defineConfig, loadEnv } from "vite";
import process from "node:process";
import { CONFIG } from "./src/config.js";

function githubPagesBase() {
  if (process.env.GITHUB_ACTIONS !== "true") return "/";

  const [owner, repository] = (process.env.GITHUB_REPOSITORY || "").split("/");
  if (!repository || repository.toLowerCase() === `${owner}.github.io`.toLowerCase()) return "/";
  return `/${repository}/`;
}

function geminiProxy(apiKey) {
  return {
    name: "voxeye-gemini-proxy",
    configureServer(server) {
      server.middlewares.use("/api/complete", async (req, res) => {
        if (req.method !== "POST") {
          res.writeHead(405).end();
          return;
        }
        if (!apiKey) {
          res.writeHead(503, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Gemini key is not configured" }));
          return;
        }
        try {
          let body = "";
          for await (const part of req) body += part;
          const { text = "" } = JSON.parse(body);
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.geminiModel}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `Complete this partial assistive message. Suggest up to ${CONFIG.suggestions.maxCount} short, natural, first-person sentences. Return only JSON with a suggestions array. Message: ${String(text).slice(0, CONFIG.suggestions.maxChars)}` }] }],
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema: { type: "OBJECT", properties: { suggestions: { type: "ARRAY", items: { type: "STRING" } } }, required: ["suggestions"] },
                maxOutputTokens: CONFIG.suggestions.maxOutputTokens
              }
            })
          });
          if (!response.ok) throw new Error(`Gemini returned ${response.status}`);
          const result = await response.json();
          const raw = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
          const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, ""));
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, CONFIG.suggestions.maxCount) : [] }));
        } catch {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Suggestions are unavailable" }));
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    base: githubPagesBase(),
    define: { __VOXEYE_GEMINI_READY__: JSON.stringify(Boolean(env.GEMINI_API_KEY)) },
    plugins: [geminiProxy(env.GEMINI_API_KEY)]
  };
});
