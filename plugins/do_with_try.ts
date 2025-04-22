const plugin: Deno.lint.Plugin = {
  name: "try",
  rules: {
    do_with_try: {
      create(context) {
        // try-catchブロック内にあるかどうかを確認する関数
        function isInsideTryCatch(node: any): boolean {
          let current = node;
          while (current) {
            if (current.type === "TryStatement") {
              return true;
            }
            current = current.parent;
          }
          return false;
        }

        return {
          // await式を検出
          AwaitExpression(node) {
            // awaitの対象が関数呼び出しかどうかを確認
            if (node.argument.type === "CallExpression") {
              const callExpr = node.argument;
              let funcName = "";

              // 直接呼び出し（例：await doSomething()）
              if (callExpr.callee.type === "Identifier") {
                funcName = callExpr.callee.name;
              }
              // メソッド呼び出し（例：await obj.doMethod()）
              else if (
                callExpr.callee.type === "MemberExpression" &&
                callExpr.callee.property.type === "Identifier"
              ) {
                funcName = callExpr.callee.property.name;
              }

              // 関数名が「do」で始まるかどうかを確認
              if (funcName.startsWith("do")) {
                // try-catchブロック内にあるかどうかを確認
                if (!isInsideTryCatch(node)) {
                  context.report({
                    node,
                    message: `Function '${funcName}' starts with 'do', so it must be wrapped in a try-catch block`,
                    fix(fixer) {
                      // 修正を提案
                      const argText = context.sourceCode.getText(callExpr);
                      return fixer.replaceText(
                        node,
                        `try {
  await ${argText}
} catch (error) {
  console.error(error);
}`
                      );
                    },
                  });
                }
              }
            }
          },

          // 通常の関数呼び出しを検出
          CallExpression(node) {
            // 親がawait式の場合はスキップ（AwaitExpressionで処理済み）
            const nodeWithParent = node as any;
            if (
              nodeWithParent.parent &&
              nodeWithParent.parent.type === "AwaitExpression"
            ) {
              return;
            }

            // 呼び出されている関数名を取得
            let funcName = "";

            // 直接呼び出し（例：doSomething()）
            if (node.callee.type === "Identifier") {
              funcName = node.callee.name;
            }
            // メソッド呼び出し（例：obj.doMethod()）
            else if (
              node.callee.type === "MemberExpression" &&
              node.callee.property.type === "Identifier"
            ) {
              funcName = node.callee.property.name;
            }

            // 関数名が「do」で始まるかどうかを確認
            if (funcName.startsWith("do")) {
              // try-catchブロック内にあるかどうかを確認
              if (!isInsideTryCatch(node)) {
                context.report({
                  node,
                  message: `Function '${funcName}' starts with 'do', so it must be wrapped in a try-catch block`,
                  fix(fixer) {
                    // 修正を提案
                    const sourceCode = context.sourceCode.getText(node);
                    return fixer.replaceText(
                      node,
                      `try {
  ${sourceCode}
} catch (error) {
  console.error(error);
}`
                    );
                  },
                });
              }
            }
          },
        };
      },
    },
  },
};
export default plugin;
