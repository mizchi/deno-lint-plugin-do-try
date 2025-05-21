/**
 * deno-lint カスタムプラグインのリファレンス実装
 */
export const noDebugger: Deno.lint.Rule = {
  create(context) {
    return {
      DebuggerStatement(node) {
        context.report({
          node,
          message: "Do not use debugger",
        });
      },
    };
  },
};

// test
import { expect } from "jsr:@std/expect";
Deno.test(async function noDebuggerTest(t) {
  const testPlugin: Deno.lint.Plugin = {
    name: "test",
    rules: {
      "no-debugger": noDebugger,
    },
  };

  await t.step("error", () => {
    const input = `debugger;`;
    const expected = {
      id: "test/no-debugger",
      message: "Do not use debugger",
    };
    expect(
      Deno.lint.runPlugin(
        testPlugin,
        "test.ts",
        input,
      ).at(0),
    ).toMatchObject(expected);
  });
  await t.step("ok", () => {
    const input = `1;`;
    expect(
      Deno.lint.runPlugin(
        testPlugin,
        "test.ts",
        input,
      ).length,
    ).toBe(0);
  });
});
