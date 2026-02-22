import { createRequestHandler } from "@remix-run/cloudflare";
import * as build from "./build/server/index.js";

const handler = createRequestHandler(build);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Serve static assets (CSS, JS, images) from Cloudflare Pages ASSETS binding
    // ASSETS is automatically available in Pages _worker.js environments
    if (url.pathname.startsWith("/assets/") && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    try {
      return await handler(request, { env, ctx });
    } catch (err) {
      console.error(err);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};
