import {
  doWithTryRule,
  // noTryWithoutDoPrefix,
  throwNeedsDoPrefix,
} from "../rules/mod.ts";

export default {
  name: "do-try",
  rules: {
    "require-try-catch-for-do-functions": doWithTryRule,
    "throw-needs-do-prefix": throwNeedsDoPrefix,
    // "no-try-without-do-prefix": noTryWithoutDoPrefix,
  },
} satisfies Deno.lint.Plugin;
