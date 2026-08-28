import { serve } from "bun";
import index from "./index.html";
import { GmailAuthError, getUnreadCount } from "./lib/gmail";

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
