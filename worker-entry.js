import { createRequestHandler } from "@remix-run/cloudflare";
import * as build from "./build/server/index.js";

const handler = createRequestHandler(build);

export default {
  async fetch(request, env, ctx) {
    try {
      return await handler(request, { env, ctx });
    } catch (err) {
      console.error(err);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};
