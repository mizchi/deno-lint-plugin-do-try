import { doWithTryRule, throwNeedsDoPrefix } from "../rules/mod.ts";

export default {
  name: "do-try",
  rules: {
    "require-try-catch-for-do-functions": doWithTryRule,
    "throw-needs-do-prefix": throwNeedsDoPrefix,
  },
} satisfies Deno.lint.Plugin;
