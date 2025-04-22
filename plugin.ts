import { doWithTryRule } from "./rules/do_with_try.ts";
import { throwNeedsDoPrefix } from "./rules/throw_needs_do_prefix.ts";

const plugin: Deno.lint.Plugin = {
  name: "do-try",
  rules: {
    "require-try-catch-for-do-functions": doWithTryRule,
    "throw-needs-do-prefix": throwNeedsDoPrefix,
  },
};
export default plugin;
