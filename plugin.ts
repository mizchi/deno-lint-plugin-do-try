import { doWithTryRule } from "./rules/do_with_try.ts";

const plugin: Deno.lint.Plugin = {
  name: "try",
  rules: {
    "require-try-catch-for-do-functions": doWithTryRule,
  },
};
export default plugin;
