import { doWithTryRule } from "./rules/do_with_try.ts";

const plugin: Deno.lint.Plugin = {
  name: "try",
  rules: {
    do_with_try: doWithTryRule,
  },
};
export default plugin;
