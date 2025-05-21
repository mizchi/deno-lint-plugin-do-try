import { expect } from "jsr:@std/expect/expect";
import { getFunctionName, isInsideTryCatch } from "../utils/mod.ts";

// 親ノードを持つノードかどうかをチェックする関数
function hasNodeParent(
  node: Deno.lint.Node,
): node is Deno.lint.Node & { parent: Deno.lint.Node } {
  return "parent" in node;
}

// 関数がdoプレフィックスで始まる関数の中で定義されているかどうかをチェックする関数
function isInsideDoFunction(node: Deno.lint.Node): boolean {
  let current: Deno.lint.Node | undefined = node;
  while (current) {
    if (!hasNodeParent(current)) {
      return false;
    }

    // 関数定義を見つけたら、その関数名をチェック
    if (
      current.type === "FunctionDeclaration" &&
      current.id &&
      current.id.name.startsWith("do")
    ) {
      return true;
    }

    // 変数宣言で関数が定義されている場合
    if (
      current.type === "VariableDeclarator" &&
      current.id.type === "Identifier" &&
      current.id.name.startsWith("do") &&
      (current.init?.type === "FunctionExpression" ||
        current.init?.type === "ArrowFunctionExpression")
    ) {
      return true;
    }

    // 代入式で関数が定義されている場合
    if (
      current.type === "AssignmentExpression" &&
      current.left.type === "Identifier" &&
      current.left.name.startsWith("do") &&
      (current.right.type === "FunctionExpression" ||
        current.right.type === "ArrowFunctionExpression")
    ) {
      return true;
    }

    // オブジェクトのプロパティとして関数が定義されている場合
    if (
      current.type === "Property" &&
      current.key.type === "Identifier" &&
      current.key.name.startsWith("do") &&
      (current.value.type === "FunctionExpression" ||
        current.value.type === "ArrowFunctionExpression")
    ) {
      return true;
    }

    // クラスのメソッド定義
    if (
      current.type === "MethodDefinition" &&
      current.key.type === "Identifier" &&
      current.key.name.startsWith("do")
    ) {
      return true;
    }

    // 関数定義の境界を超えない（別の関数に入ったら探索を終了）
    if (
      current.type === "FunctionExpression" ||
      current.type === "ArrowFunctionExpression" ||
      current.type === "FunctionDeclaration"
    ) {
      return false;
    }

    current = current.parent;
  }
  return false;
}

// doで始まる関数のチェックと報告を行う共通関数
function checkAndReportDoFunction(
  context: Deno.lint.RuleContext,
  node: Deno.lint.Node,
  funcName: string,
  fixGenerator: (fixer: Deno.lint.Fixer) => Deno.lint.Fix,
) {
  // 関数名が「do」で始まるかどうかを確認
  if (funcName.startsWith("do")) {
    // doプレフィックスで始まる関数の中で定義されている場合は、警告を出さない
    if (isInsideDoFunction(node)) {
      return;
    }

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
