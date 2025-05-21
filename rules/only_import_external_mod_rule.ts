// function isRelativeImportPath(importSource: string): boolean {
//   return importSource.startsWith(".");
// }
export const onlyImportExternalMod: Deno.lint.Rule = {
  create(context) {
    return {
      ImportDeclaration(node) {
        const importSource = node.source.value;
        // check ./ or ../
        const isRelativeImport = importSource.startsWith(".");
        if (!isRelativeImport) return;
        // check local directory import
        const isExternalModuleImport = importSource.split("/").length > 2;
        if (!isExternalModuleImport) return;
        // check ../parent
        const isAnscetorImport = importSource.startsWith("../");
        if (isAnscetorImport) {
          // strip ../../xxx to xxx
          const parentPath = importSource.split("/");
          while (parentPath.at(-1) === "..") {
            parentPath.pop();
          }
          // allow ../local.ts
          // allow ../../local.ts
          // allow ../../../../local.ts
          if (parentPath.length === 1) {
            // allow ../local.ts
            return;
          }
          // deny: ../local/other.ts
          // deny: ../../local/other.ts
          if (parentPath.length > 2) {
            // allow ../../local/mod.ts
            const lastModule = parentPath.at(-1);
            if (lastModule === "mod.ts") {
              return;
            }
            // allow ../../local/types.ts
            if (lastModule === "types.ts") {
              // check if the import is a type import
              const isTypeImport = node.importKind === "type";
              if (isTypeImport) return;
              context.report({
                node,
                message: "Do not import parent sub modules",
              });
              return;
            }
            context.report({
              node,
              message: "Do not import parent sub modules",
            });
          }
          return;
        }
        // allow ./external/types.ts
        const isTypesImport = importSource.endsWith("/types.ts");
        if (isTypesImport) {
          // check if the import is a type import
          const isTypeImport = node.importKind === "type";
          if (isTypeImport) return;
          context.report({
            node,
            message: "Do not import external/types without type import",
          });
          return;
        }
        // allow ./external/mod.ts
        const isModEntryImport = importSource.endsWith("/mod.ts");
        if (isModEntryImport) return;
        // report ./external/*.ts
        context.report({
          node,
          message: "Do not import direct external modules",
        });
        return;
      },
    };
  },
};

// test
import { expect } from "jsr:@std/expect";
Deno.test(async function testOnlyImportExternalMod(t) {
  const testPlugin: Deno.lint.Plugin = {
    name: "test",
    rules: {
      "only-import-external-only": onlyImportExternalMod,
    },
  };
  const successFixtures = [
    {
      name: "allow local",
      input: `import {} from "./xxx.ts";`,
      expected: [],
    },
    {
      name: "allow module import",
      input: `import {} from "node:fs";`,
      expected: [],
    },
    {
      name: "allow module type import",
      input: `import type {} from "./external/types.ts";`,
      expected: [],
    },
    {
      name: "allow direct parent module import",
      input: `import type {} from "../local.ts";`,
      expected: [],
    },
    // {
    //   name: "allow direct parent module import",
    //   input: `import type {} from "../../local.ts";`,
    //   expected: [],
    // },
    {
      name: "allow ../local/mod.ts",
      input: `import {} from "../local/mod.ts";`,
      expected: [],
    },
    {
      name: "allow ../local/types.ts",
      input: `import type {} from "../local/types.ts";`,
      expected: [],
    },
  ];
  const errorFixtures = [
    {
      name: "error ./external/direct.ts",
      input: `import {a} from "./external/direct.ts";`,
      expected: {
        id: "test/only-import-external-only",
        message: "Do not import direct external modules",
      },
    },
    {
      name: "error: import type without type - ./external/types.ts",
      input: `import {} from "./external/types.ts";`,
      expected: {
        id: "test/only-import-external-only",
        message: "Do not import external/types without type import",
      },
    },
    {
      name: "error ../parent/other/direct.ts",
      input: `import {} from "../parent/other/direct.ts";`,
      expected: {
        id: "test/only-import-external-only",
        message: "Do not import parent sub modules",
      },
    },
  ];
  for (const fixture of successFixtures) {
    await t.step(`${fixture.name}`, () => {
      const result = Deno.lint.runPlugin(
        testPlugin,
        "test.ts",
        fixture.input,
      );
      expect(result).toEqual(fixture.expected);
    });
  }
  for (const fixture of errorFixtures) {
    await t.step(`${fixture.name}`, () => {
      const result = Deno.lint.runPlugin(
        testPlugin,
        "test.ts",
        fixture.input,
      );
      expect(result.at(0)).toMatchObject(fixture.expected);
    });
  }
});
