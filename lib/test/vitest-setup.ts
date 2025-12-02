import "@testing-library/jest-dom/vitest"
import type DetachedWindowAPI from "happy-dom/lib/window/DetachedWindowAPI.js"
import { http, HttpResponse } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll } from "vitest"

// Type augmentation for the global window with happy-dom
declare global {
  interface Window {
    happyDOM?: DetachedWindowAPI
  }
}

// Set up MSW server to mock font requests
const server = setupServer(
  http.get("https://rsms.me/inter/inter.css", () => {
    return HttpResponse.text("", {
      headers: { "Content-Type": "text/css" },
    })
  }),
  http.get("https://fonts.googleapis.com/*", () => {
    return HttpResponse.text("", {
      headers: { "Content-Type": "text/css" },
    })
  })
)

// Start server before all tests
beforeAll(() => server.listen())

// Reset handlers and wait for async tasks after each test
afterEach(async () => {
  server.resetHandlers()
  // Wait for happy-dom to complete any pending async tasks
  if (globalThis.window?.happyDOM) {
    await globalThis.window.happyDOM.waitUntilComplete()
  }
})

// Clean up after all tests
afterAll(() => server.close())
