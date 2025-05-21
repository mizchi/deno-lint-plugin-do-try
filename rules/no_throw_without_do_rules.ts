// このルールは現在使っていない
export const noTryWithoutDoPrefix: Deno.lint.Rule = {
  create(context) {
    // 関数名の修正提案を生成する関数
    function generateFix(
      node: Deno.lint.Node,
      funcName: string,
    ): (fixer: Deno.lint.Fixer) => Deno.lint.Fix {
      return (fixer) => {
        if (node.type === "FunctionDeclaration" && node.id) {
          return fixer.replaceText(
            node.id,
            `do${funcName.charAt(0).toUpperCase()}${funcName.slice(1)}`,
          );
        } else if (
          node.type === "VariableDeclarator" &&
          node.id.type === "Identifier"
        ) {
          return fixer.replaceText(
            node.id,
            `do${funcName.charAt(0).toUpperCase()}${funcName.slice(1)}`,
          );
        } else if (
          node.type === "AssignmentExpression" &&
          node.left.type === "Identifier"
        ) {
          return fixer.replaceText(
            node.left,
            `do${funcName.charAt(0).toUpperCase()}${funcName.slice(1)}`,
          );
        } else if (node.type === "Property" && node.key.type === "Identifier") {
          return fixer.replaceText(
            node.key,
            `do${funcName.charAt(0).toUpperCase()}${funcName.slice(1)}`,
          );
        } else if (
          node.type === "MethodDefinition" &&
          node.key.type === "Identifier"
        ) {
          return fixer.replaceText(
            node.key,
            `do${funcName.charAt(0).toUpperCase()}${funcName.slice(1)}`,
          );
        }

        // 修正できない場合は空の修正を返す
        return fixer.replaceText(node, context.sourceCode.getText(node));
      };
    }

    // 関数定義ノードから関数名を取得する関数
    function getFunctionNameFromDefinition(node: Deno.lint.Node): string {
      if (node.type === "FunctionDeclaration" && node.id) {
        return node.id.name;
      } else if (
        node.type === "VariableDeclarator" &&
        node.id.type === "Identifier" &&
        (node.init?.type === "FunctionExpression" ||
          node.init?.type === "ArrowFunctionExpression")
      ) {
        return node.id.name;
      } else if (
        node.type === "AssignmentExpression" &&
        node.left.type === "Identifier" &&
        (node.right.type === "FunctionExpression" ||
          node.right.type === "ArrowFunctionExpression")
      ) {
        return node.left.name;
      } else if (
        node.type === "Property" &&
        node.key.type === "Identifier" &&
        (node.value.type === "FunctionExpression" ||
          node.value.type === "ArrowFunctionExpression")
      ) {
        return node.key.name;
      } else if (
        node.type === "MethodDefinition" &&
        node.key.type === "Identifier"
      ) {
        return node.key.name;
      }

      return "";
    }

    // TryStatementを含む最も近い関数定義を見つける関数
    function findEnclosingFunction(
      node: Deno.lint.Node,
    ): Deno.lint.Node | null {
      let current: Deno.lint.Node | undefined = node;

      while (current && "parent" in current) {
        // 関数宣言、関数式、アロー関数の場合
        if (
          current.type === "FunctionDeclaration" ||
          current.type === "FunctionExpression" ||
          current.type === "ArrowFunctionExpression"
        ) {
          // 親ノードを確認して、変数宣言や代入式の場合はそちらを返す
          if ("parent" in current) {
            const parent = (current as any).parent;
            if (parent.type === "VariableDeclarator") {
              return parent;
            } else if (parent.type === "AssignmentExpression") {
              return parent;
            } else if (parent.type === "Property") {
              return parent;
            } else if (parent.type === "MethodDefinition") {
              return parent;
            }
          }
          return current;
        }

        // 変数宣言の場合
        if (
          current.type === "VariableDeclarator" &&
          current.init &&
          (current.init.type === "FunctionExpression" ||
            current.init.type === "ArrowFunctionExpression")
        ) {
          return current;
        }

        // 代入式の場合
        if (
          current.type === "AssignmentExpression" &&
          (current.right.type === "FunctionExpression" ||
            current.right.type === "ArrowFunctionExpression")
        ) {
          return current;
        }

        // オブジェクトのプロパティの場合
        if (
          current.type === "Property" &&
          (current.value.type === "FunctionExpression" ||
            current.value.type === "ArrowFunctionExpression")
        ) {
          return current;
        }

        // クラスのメソッド定義の場合
        if (
          current.type === "MethodDefinition" &&
          current.value.type === "FunctionExpression"
        ) {
          return current;
        }

        // 変数宣言の親を確認
        if (current.type === "VariableDeclaration" && "parent" in current) {
          const parent = (current as any).parent;
          // 親が変数宣言子の場合
          if (
            parent.type === "VariableDeclarator" && parent.id &&
            parent.id.type === "Identifier"
          ) {
            return parent;
          }
        }

        current = (current as any).parent;
      }

      return null;
    }

    return {
      TryStatement(node) {
        // TryStatementを含む関数を見つける
        const funcNode = findEnclosingFunction(node);

        if (funcNode) {
          // 関数名を取得
          const funcName = getFunctionNameFromDefinition(funcNode);

          // 関数名が取得でき、かつdoで始まっていない場合
          if (funcName && !funcName.startsWith("do")) {
            context.report({
              node: funcNode,
              message:
                `Function '${funcName}' contains try-catch block, so it must start with 'do'`,
              fix: generateFix(funcNode, funcName),
            });
          }
        }
      },
    };
  },
};

// テスト
import { expect } from "jsr:@std/expect";

const testPlugin: Deno.lint.Plugin = {
  name: "test",
  rules: {
    "no-try-without-do-prefix": noTryWithoutDoPrefix,
  },
};

Deno.test(async function noThrowWithoutDoTest(t) {
  await t.step("error - function without do prefix", () => {
    const input = `function xxx() {
      try {
        doSomething();
      } catch (error) {
        console.error(error);
      }
    }`;
    const diagnostics = Deno.lint.runPlugin(
      testPlugin,
      "test.ts",
      input,
    );

    expect(diagnostics.length).toBe(1);
    const d = diagnostics[0];
    expect(d.id).toBe("test/no-try-without-do-prefix");
    expect(d.message).toBe(
      "Function 'xxx' contains try-catch block, so it must start with 'do'",
    );

    // 修正の内容をチェック
    if (d.fix && d.fix.length > 0) {
      expect(d.fix.length).toBe(1);
      expect(d.fix[0]?.text?.includes("doXxx")).toBe(true);
    } else {
      throw new Error("Expected fix to be defined and not empty");
    }
  });

  await t.step("ok - function with do prefix", () => {
    const input = `function doRun() {
      try {
        doSomething();
      } catch (error) {
        console.error(error);
      }
    }`;
    const diagnostics = Deno.lint.runPlugin(
      testPlugin,
      "test.ts",
      input,
    );

    // doで始まっているので、エラーは報告されないはず
    expect(diagnostics.length).toBe(0);
  });

  await t.step("error - arrow function without do prefix", () => {
    const input = `const run = () => {
      try {
        doSomething();
      } catch (error) {
        console.error(error);
      }
    }`;
    const diagnostics = Deno.lint.runPlugin(
      testPlugin,
      "test.ts",
      input,
    );

    expect(diagnostics.length).toBe(1);
    const d = diagnostics[0];
    expect(d.id).toBe("test/no-try-without-do-prefix");
    expect(d.message).toBe(
      "Function 'run' contains try-catch block, so it must start with 'do'",
    );
  });

  await t.step("error - method without do prefix", () => {
    const input = `class Service {
      getData() {
        try {
          return doFetch();
        } catch (error) {
          console.error(error);
          return null;
        }
      }
    }`;
    const diagnostics = Deno.lint.runPlugin(
      testPlugin,
      "test.ts",
      input,
    );

    expect(diagnostics.length).toBe(1);
    const d = diagnostics[0];
    expect(d.id).toBe("test/no-try-without-do-prefix");
    expect(d.message).toBe(
      "Function 'getData' contains try-catch block, so it must start with 'do'",
    );
  });
});
