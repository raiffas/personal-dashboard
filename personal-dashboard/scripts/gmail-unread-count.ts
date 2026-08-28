import { GmailAuthError, getUnreadCount } from "../src/lib/gmail";

try {
  const count = await getUnreadCount();
  console.log(`Unread emails: ${count}`);
} catch (err) {
  if (err instanceof GmailAuthError) {
    console.error("Not authorized yet. Run `bun run gmail:auth` first.");
    process.exit(1);
  }
  throw err;
}
