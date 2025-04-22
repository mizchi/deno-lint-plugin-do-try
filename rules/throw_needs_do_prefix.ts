// 親ノードへの参照を持つノード型を表現するための型
type NodeWithParent = Deno.lint.Node & { parent?: NodeWithParent };

export const throwNeedsDoPrefix: Deno.lint.Rule = {
  create(context) {
    // 関数本体内にthrowステートメントが含まれているかをチェックする関数
    function hasThrowStatement(body: Deno.lint.Node): boolean {
      // 関数本体が単一の式の場合（アロー関数など）
      if (body.type !== "BlockStatement") {
        return body.type === "ThrowStatement";
      }

      // BlockStatementの場合、bodyプロパティ内の各ステートメントを直接チェック
      if (body.type === "BlockStatement" && Array.isArray(body.body)) {
        // 直接的なThrowStatementをチェック
        for (const stmt of body.body) {
          if (stmt.type === "ThrowStatement") {
            return true;
          }

          // IfStatementの中のThrowStatementをチェック
          if (stmt.type === "IfStatement") {
            if (stmt.consequent && stmt.consequent.type === "BlockStatement") {
              for (const ifStmt of stmt.consequent.body) {
                if (ifStmt.type === "ThrowStatement") {
                  return true;
                }
              }
            } else if (
              stmt.consequent &&
              stmt.consequent.type === "ThrowStatement"
            ) {
              return true;
            }

            // else部分もチェック
            if (stmt.alternate) {
              if (stmt.alternate.type === "BlockStatement") {
                for (const elseStmt of stmt.alternate.body) {
                  if (elseStmt.type === "ThrowStatement") {
                    return true;
                  }
                }
              } else if (stmt.alternate.type === "ThrowStatement") {
                return true;
              }
            }
          }

          // TryStatementの中のThrowStatementをチェック
          if (stmt.type === "TryStatement") {
            if (stmt.block && stmt.block.body) {
              for (const tryStmt of stmt.block.body) {
                if (tryStmt.type === "ThrowStatement") {
                  return true;
                }
              }
            }
          }
        }
      }

      // 再帰的に全てのステートメントをチェック（より複雑なケース用）
      function checkNode(node: Deno.lint.Node): boolean {
        // ThrowStatementを見つけたら、throwが含まれていると判断
        if (node.type === "ThrowStatement") {
          return true;
        }

        // 子ノードを再帰的にチェック
        for (const key in node) {
          const value = (node as any)[key];

          // 配列の場合、各要素をチェック
          if (Array.isArray(value)) {
            for (const item of value) {
              if (item && typeof item === "object" && "type" in item) {
                if (checkNode(item)) {
                  return true;
                }
              }
            }
          }
          // オブジェクトの場合、再帰的にチェック
          else if (value && typeof value === "object" && "type" in value) {
            if (checkNode(value)) {
              return true;
            }
          }
        }

        return false;
      }

      return checkNode(body);
    }

    // 関数名を取得する関数
    function getFunctionName(node: Deno.lint.Node): string {
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

    // 関数名の修正提案を生成する関数
    function generateFix(
      node: Deno.lint.Node,
      funcName: string
    ): (fixer: Deno.lint.Fixer) => Deno.lint.Fix {
      return (fixer) => {
        if (node.type === "FunctionDeclaration" && node.id) {
          return fixer.replaceText(
            node.id,
            `do${funcName.charAt(0).toUpperCase()}${funcName.slice(1)}`
          );
        } else if (
          node.type === "VariableDeclarator" &&
          node.id.type === "Identifier"
        ) {
          return fixer.replaceText(
            node.id,
            `do${funcName.charAt(0).toUpperCase()}${funcName.slice(1)}`
          );
        } else if (
          node.type === "AssignmentExpression" &&
          node.left.type === "Identifier"
        ) {
          return fixer.replaceText(
            node.left,
            `do${funcName.charAt(0).toUpperCase()}${funcName.slice(1)}`
          );
        } else if (node.type === "Property" && node.key.type === "Identifier") {
          return fixer.replaceText(
            node.key,
            `do${funcName.charAt(0).toUpperCase()}${funcName.slice(1)}`
          );
        } else if (
          node.type === "MethodDefinition" &&
          node.key.type === "Identifier"
        ) {
          return fixer.replaceText(
            node.key,
            `do${funcName.charAt(0).toUpperCase()}${funcName.slice(1)}`
          );
        }

        // 修正できない場合は空の修正を返す
        return fixer.replaceText(node, context.sourceCode.getText(node));
      };
    }

    // 関数定義をチェックする共通関数
    function checkFunctionDefinition(
      node: Deno.lint.Node,
      body: Deno.lint.Node | null
    ) {
      // bodyがnullの場合は処理をスキップ
      if (!body) return;

      // 関数本体内にthrowステートメントが含まれているかチェック
      if (hasThrowStatement(body)) {
        const funcName = getFunctionName(node);

        // 関数名が取得できて、かつdoで始まっていない場合
        if (funcName && !funcName.startsWith("do")) {
          context.report({
            node,
            message: `Function '${funcName}' contains throw statement, so it must start with 'do'`,
            fix: generateFix(node, funcName),
          });
        }
      }
    }

    return {
      // 関数宣言を検出
      FunctionDeclaration(node) {
        checkFunctionDefinition(node, node.body);
      },

      // 変数宣言で関数式やアロー関数式が代入されている場合
      VariableDeclarator(node) {
        if (node.init?.type === "FunctionExpression") {
          checkFunctionDefinition(node, node.init.body);
        } else if (node.init?.type === "ArrowFunctionExpression") {
          checkFunctionDefinition(node, node.init.body);
        }
      },

      // 代入式で関数式やアロー関数式が代入されている場合
      AssignmentExpression(node) {
        if (node.right.type === "FunctionExpression") {
          checkFunctionDefinition(node, node.right.body);
        } else if (node.right.type === "ArrowFunctionExpression") {
          checkFunctionDefinition(node, node.right.body);
        }
      },

      // オブジェクトのプロパティとして関数が定義されている場合
      Property(node) {
        if (node.value.type === "FunctionExpression") {
          checkFunctionDefinition(node, node.value.body);
        } else if (node.value.type === "ArrowFunctionExpression") {
          checkFunctionDefinition(node, node.value.body);
        }
      },

      // クラスのメソッド定義
      MethodDefinition(node) {
        if (node.value.type === "FunctionExpression") {
          checkFunctionDefinition(node, node.value.body);
        }
      },
    };
  },
};
