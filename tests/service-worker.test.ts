import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";

test("service worker never stores account HTML or API results, including across sign-out", async () => {
  const handlers = new Map<string, (event: unknown) => void>();
  const writes: string[] = [];
  const fallback = new Response("Public offline screen");
  const shell: string[] = [];
  const cache = {
    addAll: async (paths: string[]) => shell.push(...paths),
    put: async (request: Request) => writes.push(request.url),
  };
  let offline = false;
  vm.runInNewContext(readFileSync(new URL("../public/sw.js", import.meta.url), "utf8"), {
    self: {
      location: { origin: "https://civicwise.example" },
      addEventListener: (name: string, handler: (event: unknown) => void) =>
        handlers.set(name, handler),
      skipWaiting: () => {},
      clients: { claim: () => {} },
    },
    URL,
    Response,
    fetch: async () => {
      if (offline) throw new Error("Offline");
      return new Response("Private account HTML");
    },
    caches: {
      open: async () => cache,
      match: async (path: string) => (path === "/offline.html" ? fallback.clone() : undefined),
    },
  });
  let installation: Promise<unknown> | undefined;
  handlers.get("install")!({
    waitUntil: (promise: Promise<unknown>) => {
      installation = promise;
    },
  });
  await installation;
  assert.deepEqual(shell, ["/offline.html", "/manifest.webmanifest", "/icon.svg"]);
  for (const path of [
    "/account",
    "/reports/private-id",
    "/api/auth/get-session",
    "/api/reports?m=CPT",
  ]) {
    let response: Promise<Response> | undefined;
    const request = {
      url: `https://civicwise.example${path}`,
      method: "GET",
      mode: "navigate",
      headers: new Headers(),
    };
    handlers.get("fetch")!({
      request,
      respondWith: (promise: Promise<Response>) => {
        response = promise;
      },
      waitUntil: () => {
        throw new Error("Navigation may not cache private HTML");
      },
    });
    if (path.startsWith("/api/")) assert.equal(response, undefined);
    else {
      assert.ok(response);
      assert.equal(await (await response).text(), "Private account HTML");
    }
  }
  assert.deepEqual(writes, []);
  offline = true;
  let response: Promise<Response> | undefined;
  handlers.get("fetch")!({
    request: {
      url: "https://civicwise.example/account",
      method: "GET",
      mode: "navigate",
      headers: new Headers(),
    },
    respondWith: (promise: Promise<Response>) => {
      response = promise;
    },
  });
  assert.ok(response);
  assert.equal(await (await response).text(), "Public offline screen");
});
