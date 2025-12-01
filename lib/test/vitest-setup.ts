import "@testing-library/jest-dom/vitest"

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

