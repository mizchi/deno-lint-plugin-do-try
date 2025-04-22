// 親ノードへの参照を持つノード型を表現するための型
type NodeWithParent = Deno.lint.Node & { parent?: NodeWithParent };

export const doWithTryRule: Deno.lint.Rule = {
  create(context) {
    // try-catchブロック内にあるかどうかを確認する関数
    function isInsideTryCatch(node: Deno.lint.Node): boolean {
      let current: NodeWithParent | undefined = node as NodeWithParent;
      while (current) {
        // TryStatementを見つけたら、try-catch内にあると判断
        if (current.type === "TryStatement") {
          return true;
        }

        // 関数定義の境界を超えないようにする
        // 関数式、アロー関数式、関数宣言の場合は、それ以上親を遡らない
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

    // 関数名を取得する共通関数
    function getFunctionName(callee: Deno.lint.Node): string {
      // 直接呼び出し（例：doSomething()）
      if (callee.type === "Identifier") {
        return callee.name;
      }
      // メソッド呼び出し（例：obj.doMethod()）
      else if (
        callee.type === "MemberExpression" &&
        callee.property.type === "Identifier"
      ) {
        return callee.property.name;
      }
      return "";
    }

    // doで始まる関数のチェックと報告を行う共通関数
    function checkAndReportDoFunction(
      node: Deno.lint.Node,
      funcName: string,
      fixGenerator: (fixer: Deno.lint.Fixer) => Deno.lint.Fix
    ) {
      // 関数名が「do」で始まるかどうかを確認
      if (funcName.startsWith("do")) {
        // try-catchブロック内にあるかどうかを確認
        if (!isInsideTryCatch(node)) {
          context.report({
            node,
            message: `Function '${funcName}' starts with 'do', so it must be wrapped in a try-catch block`,
            fix: fixGenerator,
          });
        }
      }
    }

    return {
      // await式を検出
      AwaitExpression(node) {
        // awaitの対象が関数呼び出しかどうかを確認
        if (node.argument.type === "CallExpression") {
          const callExpr = node.argument;
          const funcName = getFunctionName(callExpr.callee);

          checkAndReportDoFunction(node, funcName, (fixer) => {
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
          });
        }
      },

      // 通常の関数呼び出しを検出
      CallExpression(node) {
        // 親がawait式の場合はスキップ（AwaitExpressionで処理済み）
        const nodeWithParent = node as NodeWithParent;
        if (
          nodeWithParent.parent &&
          nodeWithParent.parent.type === "AwaitExpression"
        ) {
          return;
        }

        const funcName = getFunctionName(node.callee);

        checkAndReportDoFunction(node, funcName, (fixer) => {
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
        });
      },
    };
  },
};
