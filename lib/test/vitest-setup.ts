import "@testing-library/jest-dom/vitest"
import { http, HttpResponse } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll } from "vitest"

// Mock CSSOM insertRule to handle Stitches CSS-in-JS
// jsdom's CSSOM doesn't support the custom CSS variables that Stitches uses
const mockInsertRule = CSSStyleSheet.prototype.insertRule
CSSStyleSheet.prototype.insertRule = function (rule: string, index?: number) {
  // Skip Stitches' custom CSS variable rules that jsdom can't parse
  if (rule.includes("--sxs")) {
    return 0
  }
  return mockInsertRule.call(this, rule, index)
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
    await globalThis.window.happyDOM.whenAsyncComplete()
  }
})

// Clean up after all tests
afterAll(() => server.close())
