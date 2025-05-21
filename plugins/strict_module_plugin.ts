import { onlyImportExternalMod } from "../rules/mod.ts";

export default {
  name: "strict-module",
  rules: {
    "only-import-external-mod": onlyImportExternalMod,
    // "export-only-mod": exportOnlyMod,
  },
} satisfies Deno.lint.Plugin;
