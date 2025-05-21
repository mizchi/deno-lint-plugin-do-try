import { expect } from "jsr:@std/expect/expect";
import { getFunctionName, isInsideTryCatch } from "../utils/mod.ts";

// doで始まる関数のチェックと報告を行う共通関数
function checkAndReportDoFunction(
  context: Deno.lint.RuleContext,
  node: Deno.lint.Node,
  funcName: string,
  fixGenerator: (fixer: Deno.lint.Fixer) => Deno.lint.Fix,
) {
  // 関数名が「do」で始まるかどうかを確認
  if (funcName.startsWith("do")) {
    // try-catchブロック内にあるかどうかを確認
    if (!isInsideTryCatch(node)) {
      context.report({
        node,
        message:
          `Function '${funcName}' starts with 'do', so it must be wrapped in a try-catch block`,
        fix: fixGenerator,
      });
    }
  }
}

export const doWithTryRule: Deno.lint.Rule = {
  create(context) {
    return {
      // await式を検出
      AwaitExpression(node) {
        // awaitの対象が関数呼び出しかどうかを確認
        if (node.argument.type === "CallExpression") {
          const callExpr = node.argument;
          const funcName = getFunctionName(callExpr.callee);
          checkAndReportDoFunction(context, node, funcName, (fixer) => {
            // 修正を提案
            const argText = context.sourceCode.getText(callExpr);
            return fixer.replaceText(
              node,
              `try {
        await ${argText}
      } catch (error) {
        console.error(error);
      }`,
            );
          });
        }
      },

      // 通常の関数呼び出しを検出
      CallExpression(node) {
        // 親がawait式の場合はスキップ（AwaitExpressionで処理済み）
        const nodeWithParent = node;
        if (
          nodeWithParent.parent &&
          nodeWithParent.parent.type === "AwaitExpression"
        ) {
          return;
        }

        const funcName = getFunctionName(node.callee);

        checkAndReportDoFunction(context, node, funcName, (fixer) => {
          // 修正を提案
          const sourceCode = context.sourceCode.getText(node);
          return fixer.replaceText(
            node,
            `try {
      ${sourceCode}
    } catch (error) {
      console.error(error);
    }`,
          );
        });
      },
    };
  },
};

const testPlugin: Deno.lint.Plugin = {
  name: "do-try",
  rules: {
    "require-try-catch-for-do-functions": doWithTryRule,
  },
};

Deno.test(
  "try: require-try-catch-for-do-functions - direct call without try-catch",
  async (t) => {
    await t.step(
      "direct call without try-catch",
      () => {
        const diagnostics = Deno.lint.runPlugin(
          testPlugin,
          "test.ts",
          `function test() {
            doSomething();
          }`,
        );

        expect(diagnostics.length).toBe(1);
        const d = diagnostics[0];
        expect(d.id).toBe("do-try/require-try-catch-for-do-functions");
        expect(d.message).toBe(
          "Function 'doSomething' starts with 'do', so it must be wrapped in a try-catch block",
        );
      },
    );
    const diagnostics = Deno.lint.runPlugin(
      testPlugin,
      "test.ts",
      `function test() {
        doSomething();
      }`,
    );

    expect(diagnostics.length).toBe(1);
    const d = diagnostics[0];
    expect(d.id).toBe("do-try/require-try-catch-for-do-functions");
    expect(d.message).toBe(
      "Function 'doSomething' starts with 'do', so it must be wrapped in a try-catch block",
    );
    // 修正の内容をチェック
    if (d.fix && d.fix.length > 0) {
      expect(d.fix.length).toBe(1);
      expect(d.fix[0]?.text?.includes("try {")).toBe(true);
      expect(d.fix[0]?.text?.includes("catch (error)")).toBe(true);
    } else {
      throw new Error("Expected fix to be defined and not empty");
    }
  },
);

Deno.test(
  "try: require-try-catch-for-do-functions - method call without try-catch",
  () => {
    const diagnostics = Deno.lint.runPlugin(
      testPlugin,
      "test.ts",
      `function test() {
        obj.doMethod();
      }`,
    );

    expect(diagnostics.length).toBe(1);
    const d = diagnostics[0];
    expect(d.id).toBe("do-try/require-try-catch-for-do-functions");
    expect(d.message).toBe(
      "Function 'doMethod' starts with 'do', so it must be wrapped in a try-catch block",
    );
  },
);

Deno.test(
  "try: require-try-catch-for-do-functions - call with try-catch",
  () => {
    const diagnostics = Deno.lint.runPlugin(
      testPlugin,
      "test.ts",
      `function test() {
        try {
          doSomething();
        } catch (error) {
          console.error(error);
        }
      }`,
    );

    // try-catchで囲まれているので、エラーは報告されないはず
    expect(
      diagnostics.filter(
        (d) => d.id === "do-try/require-try-catch-for-do-functions",
      ).length,
    ).toBe(0);
  },
);

Deno.test(
  "try: require-try-catch-for-do-functions - non-do function call",
  () => {
    const diagnostics = Deno.lint.runPlugin(
      testPlugin,
      "test.ts",
      `function test() {
        normalFunction();
      }`,
    );

    // do~から始まらない関数名なので、エラーは報告されないはず
    expect(
      diagnostics.filter(
        (d) => d.id === "test/require-try-catch-for-do-functions",
      ).length,
    ).toBe(0);
  },
);
