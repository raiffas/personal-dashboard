import "dotenv/config";
import { createServer } from "node:http";
import { exchangeCodeForTokens, getAuthorizationUrl, saveTokens } from "../src/lib/gmail";

const PORT = 8765;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

let resolveAuth: () => void;
let rejectAuth: (err: Error) => void;
const done = new Promise<void>((resolve, reject) => {
  resolveAuth = resolve;
  rejectAuth = reject;
});

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", REDIRECT_URI);
  if (url.pathname !== "/oauth2callback") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const error = url.searchParams.get("error");
  if (error) {
    rejectAuth(new Error(`Google returned an error: ${error}`));
    res.end(`Authorization failed: ${error}. You can close this tab.`);
    return;
  }

  const code = url.searchParams.get("code");
  if (!code) {
    res.writeHead(400);
    res.end("Missing code parameter");
    return;
  }

  try {
    const tokens = await exchangeCodeForTokens(code, REDIRECT_URI);
    await saveTokens(tokens);
    resolveAuth();
    res.end("Gmail authorization complete. You can close this tab and return to the terminal.");
  } catch (err) {
    rejectAuth(err as Error);
    res.writeHead(500);
    res.end("Token exchange failed. Check the terminal for details.");
  }
});

server.listen(PORT);

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
  server.close();
}
