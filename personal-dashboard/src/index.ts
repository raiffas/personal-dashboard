import { serve } from "bun";
import index from "./index.html";
import {
  GmailAuthError,
  archiveMessage,
  getUnreadCount,
  listUnreadMessages,
  moveMessageToLabel,
  trashMessage,
} from "./lib/gmail";

const MAX_MESSAGES_LIMIT = 100;
const DEFAULT_MESSAGES_LIMIT = 50;

async function handleGmailAction(action: () => Promise<void>): Promise<Response> {
  try {
    await action();
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof GmailAuthError) {
      return Response.json({ error: err.message }, { status: 401 });
    }
    console.error("Gmail action failed:", err);
    return Response.json({ error: "Gmail action failed" }, { status: 502 });
  }
}

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/gmail/unread-count": {
      async GET() {
        try {
          const count = await getUnreadCount();
          return Response.json({ count });
        } catch (err) {
          if (err instanceof GmailAuthError) {
            return Response.json({ error: err.message }, { status: 401 });
          }
          console.error("Failed to fetch Gmail unread count:", err);
          return Response.json({ error: "Failed to fetch unread count" }, { status: 502 });
        }
      },
    },

    "/api/gmail/messages": {
      async GET(req) {
        const url = new URL(req.url);
        const requested = Number(url.searchParams.get("maxResults"));
        const maxResults = Number.isFinite(requested) && requested > 0
          ? Math.min(requested, MAX_MESSAGES_LIMIT)
          : DEFAULT_MESSAGES_LIMIT;
        try {
          const messages = await listUnreadMessages(maxResults);
          return Response.json({ messages });
        } catch (err) {
          if (err instanceof GmailAuthError) {
            return Response.json({ error: err.message }, { status: 401 });
          }
          console.error("Failed to fetch Gmail messages:", err);
          return Response.json({ error: "Failed to fetch messages" }, { status: 502 });
        }
      },
    },

    "/api/gmail/messages/:id/archive": {
      async POST(req) {
        return handleGmailAction(() => archiveMessage(req.params.id));
      },
    },

    "/api/gmail/messages/:id/trash": {
      async POST(req) {
        return handleGmailAction(() => trashMessage(req.params.id));
      },
    },

    "/api/gmail/messages/:id/label": {
      async POST(req) {
        const body = await req.json().catch(() => null);
        const label = body?.label;
        if (typeof label !== "string" || !label.trim()) {
          return Response.json({ error: "Missing label" }, { status: 400 });
        }
        return handleGmailAction(() => moveMessageToLabel(req.params.id, label));
      },
    },

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async req => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
