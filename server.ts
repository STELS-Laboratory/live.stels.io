/**
 * SPA Server for Deno Deploy
 * Serves static files and falls back to index.html for SPA routes
 * 
 * This file is copied to dist/ during build, so paths are relative to dist/
 */

import { serveDir } from "https://deno.land/std@0.217.0/http/file_server.ts";

Deno.serve(async (request: Request) => {
  // Try to serve static file first
  const response = await serveDir(request, {
    fsRoot: ".",
    quiet: true,
  });

  // If file found (not 404), return it
  if (response.status !== 404) {
    return response;
  }

  // For SPA routes, serve index.html
  // This handles routes like /auth/github/callback, /?router=welcome, etc.
  try {
    const indexFile = await Deno.readFile("./index.html");
    return new Response(indexFile, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
});
