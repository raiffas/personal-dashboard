import { exchangeCodeForTokens, getAuthorizationUrl, saveTokens } from "../src/lib/gmail";

const PORT = 8765;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

let resolveAuth: () => void;
let rejectAuth: (err: Error) => void;
const done = new Promise<void>((resolve, reject) => {
  resolveAuth = resolve;
  rejectAuth = reject;
});

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname !== "/oauth2callback") {
      return new Response("Not found", { status: 404 });
    }

    const error = url.searchParams.get("error");
    if (error) {
      rejectAuth(new Error(`Google returned an error: ${error}`));
      return new Response(`Authorization failed: ${error}. You can close this tab.`);
    }

    const code = url.searchParams.get("code");
    if (!code) {
      return new Response("Missing code parameter", { status: 400 });
    }

    try {
      const tokens = await exchangeCodeForTokens(code, REDIRECT_URI);
      await saveTokens(tokens);
      resolveAuth();
      return new Response("Gmail authorization complete. You can close this tab and return to the terminal.");
    } catch (err) {
      rejectAuth(err as Error);
      return new Response("Token exchange failed. Check the terminal for details.", { status: 500 });
    }
  },
});

console.log("Open this URL in your browser to authorize Gmail access:\n");
console.log(getAuthorizationUrl(REDIRECT_URI));
console.log("\nWaiting for authorization...");

try {
  await done;
  console.log("\nSuccess — tokens saved to .gmail-tokens.json");
} catch (err) {
  console.error("\nAuthorization failed:", err);
  process.exitCode = 1;
} finally {
  server.stop();
}
