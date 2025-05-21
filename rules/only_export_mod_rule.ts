/**
 * deno-lint カスタムプラグインのリファレンス実装
 */
const ERROR_MESSAGE = "allow only export statements";
function isExportedNode(node: Deno.lint.Node) {
  if ("parent" in node) {
    return node.parent.type === "ExportNamedDeclaration";
  }
  return false;
}
export const exportOnlyMod: Deno.lint.Rule = {
  create(context) {
    const isModTs = context.filename.split("/").at(-1)?.endsWith("mod.ts");
    if (!isModTs) {
      return {};
    }

    return {
      VariableDeclaration(node) {
        if (isExportedNode(node)) return;
        context.report({ node, message: ERROR_MESSAGE });
      },
      FunctionDeclaration(node) {
        if (isExportedNode(node)) return;
        context.report({ node, message: ERROR_MESSAGE });
      },
      ClassDeclaration(node) {
        if (isExportedNode(node)) return;
        context.report({ node, message: ERROR_MESSAGE });
      },
      TSTypeAliasDeclaration(node) {
        if (isExportedNode(node)) return;
        context.report({ node, message: ERROR_MESSAGE });
      },
      DebuggerStatement(node) {
        context.report({ node, message: ERROR_MESSAGE });
      },
      IfStatement(node) {
        context.report({ node, message: ERROR_MESSAGE });
      },
      ForStatement(node) {
        context.report({ node, message: ERROR_MESSAGE });
      },
      WhileStatement(node) {
        context.report({ node, message: ERROR_MESSAGE });
      },
      DoWhileStatement(node) {
        context.report({ node, message: ERROR_MESSAGE });
      },
      SwitchStatement(node) {
        context.report({ node, message: ERROR_MESSAGE });
      },
      TryStatement(node) {
        context.report({ node, message: ERROR_MESSAGE });
      },
      WithStatement(node) {
        context.report({ node, message: ERROR_MESSAGE });
      },
      ForInStatement(node) {
        context.report({ node, message: ERROR_MESSAGE });
      },
      ForOfStatement(node) {
        context.report({ node, message: ERROR_MESSAGE });
      },
      LabeledStatement(node) {
        context.report({ node, message: ERROR_MESSAGE });
      },
      BreakStatement(node) {
        context.report({ node, message: ERROR_MESSAGE });
      },
      ContinueStatement(node) {
        context.report({ node, message: ERROR_MESSAGE });
      },
      ReturnStatement(node) {
        context.report({ node, message: ERROR_MESSAGE });
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
      "export-only-mod": exportOnlyMod,
    },
  };

  await t.step("active only for ./mod.ts", () => {
    const input = `const a = 1`;
    const result = Deno.lint.runPlugin(
      testPlugin,
      "other.ts",
      input,
    );
    expect(result).toEqual([]);
  });
  await t.step("ignore comments", () => {
    const input = `///xxx`;
    const result = Deno.lint.runPlugin(
      testPlugin,
      "/mod.ts",
      input,
    );
    expect(result).toEqual([]);
  });

  await t.step("error variable", () => {
    const input = `const a = 1`;
    const expected = {
      id: "test/export-only-mod",
      message: "allow only export statements",
    };
    const result = Deno.lint.runPlugin(
      testPlugin,
      "/mod.ts",
      input,
    );
    expect(result.at(0)).toMatchObject(expected);
  });
  await t.step("error function", () => {
    const input = `function foo() {}`;
    const expected = {
      id: "test/export-only-mod",
      message: "allow only export statements",
    };
    const result = Deno.lint.runPlugin(
      testPlugin,
      "/mod.ts",
      input,
    );
    expect(result.at(0)).toMatchObject(expected);
  });
  await t.step("ok: export const", () => {
    const input = `export const a = 1`;
    const result = Deno.lint.runPlugin(
      testPlugin,
      "/mod.ts",
      input,
    );
    expect(result).toEqual([]);
  });
  await t.step("ok: export function", () => {
    const input = `export function foo() {}`;
    const result = Deno.lint.runPlugin(
      testPlugin,
      "/mod.ts",
      input,
    );
    expect(result).toEqual([]);
  });
});
