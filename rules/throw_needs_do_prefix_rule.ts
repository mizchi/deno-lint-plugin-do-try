// 親ノードへの参照を持つノード型を表現するための型
import { assertEquals } from "jsr:@std/assert";

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
export const throwNeedsDoPrefix: Deno.lint.Rule = {
  create(context) {
    // doプレフィックスで始まる関数内でawait式を使用しているかをチェックする関数
    function isAwaitDoFunctionCall(node: Deno.lint.Node): boolean {
      // BlockStatementの場合、各ステートメントを直接チェック
      if (node.type === "BlockStatement" && Array.isArray(node.body)) {
        for (const stmt of node.body) {
          // ExpressionStatementの場合、式をチェック
          if (
            stmt.type === "ExpressionStatement" &&
            stmt.expression.type === "AwaitExpression" &&
            stmt.expression.argument.type === "CallExpression"
          ) {
            const callExpr = stmt.expression.argument;
            // 関数名を取得
            if (callExpr.callee.type === "Identifier") {
              if (callExpr.callee.name.startsWith("do")) {
                return true;
              }
            } else if (
              callExpr.callee.type === "MemberExpression" &&
              callExpr.callee.property.type === "Identifier"
            ) {
              if (callExpr.callee.property.name.startsWith("do")) {
                return true;
              }
            }
          }

          // 他のステートメント内も再帰的にチェック
          if (isAwaitDoFunctionCall(stmt)) {
            return true;
          }
        }
        return false;
      }

      // AwaitExpressionノードを探す
      if (
        node.type === "AwaitExpression" &&
        node.argument.type === "CallExpression"
      ) {
        const callExpr = node.argument;
        // 関数名を取得
        if (callExpr.callee.type === "Identifier") {
          return callExpr.callee.name.startsWith("do");
        } else if (
          callExpr.callee.type === "MemberExpression" &&
          callExpr.callee.property.type === "Identifier"
        ) {
          return callExpr.callee.property.name.startsWith("do");
        }
      }

      // 子ノードを再帰的にチェック
      for (const key in node) {
        const value = (node as any)[key];
        // 配列の場合、各要素をチェック
        if (Array.isArray(value)) {
          for (const item of value) {
            if (item && typeof item === "object" && "type" in item) {
              if (isAwaitDoFunctionCall(item)) {
                return true;
              }
            }
          }
        } // オブジェクトの場合、再帰的にチェック
        else if (value && typeof value === "object" && "type" in value) {
          if (isAwaitDoFunctionCall(value)) {
            return true;
          }
        }
      }

      return false;
    }

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
          } // オブジェクトの場合、再帰的にチェック
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

    // 関数定義をチェックする共通関数
    function checkFunctionDefinition(
      node: Deno.lint.Node,
      body: Deno.lint.Node | null,
    ) {
      // bodyがnullの場合は処理をスキップ
      if (!body) return;

      // 関数本体内にthrowステートメントが含まれているかチェック
      if (hasThrowStatement(body)) {
        const funcName = getFunctionName(node);

        // 関数名が取得できて、かつdoで始まっていない場合
        if (funcName && !funcName.startsWith("do")) {
          // doプレフィックスで始まる関数の中で定義されている場合は、doプレフィックスを強制しない
          if (isInsideDoFunction(node)) {
            return;
          }

          // 関数本体内でawait doXxx()を使用している場合も、doプレフィックスを強制しない
          if (isAwaitDoFunctionCall(body)) {
            return;
          }

          context.report({
            node,
            message:
              `Function '${funcName}' contains throw statement, so it must start with 'do'`,
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

const testPlugin: Deno.lint.Plugin = {
  name: "test-plugin",
  rules: {
    "throw-needs-do-prefix": throwNeedsDoPrefix,
  },
};

Deno.test(
  "try: throw-needs-do-prefix - function declaration with throw without do prefix",
  () => {
    const diagnostics = Deno.lint.runPlugin(
      testPlugin,
      "test.ts",
      `function getData() {
        if (Math.random() > 0.5) {
          throw new Error("Random error");
        }
        return "data";
      }`,
    );

    assertEquals(diagnostics.length, 1);
    const d = diagnostics[0];
    assertEquals(d.id, "test-plugin/throw-needs-do-prefix");
    assertEquals(
      d.message,
      "Function 'getData' contains throw statement, so it must start with 'do'",
    );
    // 修正の内容をチェック
    if (d.fix && d.fix.length > 0) {
      assertEquals(d.fix.length, 1);
      assertEquals(d.fix[0]?.text?.includes("doGetData"), true);
    } else {
      throw new Error("Expected fix to be defined and not empty");
    }
  },
);

Deno.test(
  "try: throw-needs-do-prefix - function with do prefix and throw is valid",
  () => {
    const diagnostics = Deno.lint.runPlugin(
      testPlugin,
      "test.ts",
      `async function doGetData() {
        if (Math.random() > 0.5) {
          throw new Error("Random error");
        }
        return "data";
      }`,
    );

    // doで始まっているので、エラーは報告されないはず
    assertEquals(
      diagnostics.filter((d) => d.id === "do-try/throw-needs-do-prefix").length,
      0,
    );
  },
);

Deno.test(
  "try: throw-needs-do-prefix - function inside do-prefixed function doesn't need do prefix",
  () => {
    const diagnostics = Deno.lint.runPlugin(
      testPlugin,
      "test.ts",
      `async function doMain() {
        // この中で定義される関数は、throwステートメントがあっても
        // doプレフィックスを強制されない
        await doA();
        
        // 例：この関数はthrowを含むが、doMainの中で定義されているので
        // doプレフィックスが不要
        const processData = () => {
          if (Math.random() > 0.5) {
            throw new Error("Error in processing");
          }
          return "data";
        };
        
        const result = processData();
        await doB();
      }`,
    );

    // doMainの中で定義されたprocessData関数はthrowを含むが、
    // doプレフィックスを強制されないので、エラーは報告されないはず
    assertEquals(
      diagnostics.filter((d) => d.id === "test-plugin/throw-needs-do-prefix")
        .length,
      0,
    );
  },
);

Deno.test(
  "try: throw-needs-do-prefix - function outside do-prefixed function needs do prefix",
  () => {
    const diagnostics = Deno.lint.runPlugin(
      testPlugin,
      "test.ts",
      `// この関数はdoプレフィックスで始まる関数の外で定義されているので
      // throwステートメントがある場合はdoプレフィックスが必要
      const processData = () => {
        if (Math.random() > 0.5) {
          throw new Error("Error in processing");
        }
        return "data";
      };
      
      async function doMain() {
        await doA();
        const result = processData();
        await doB();
      }`,
    );

    // processData関数はdoMainの外で定義されていて、throwを含むので
    // doプレフィックスを強制される
    assertEquals(diagnostics.length, 1);
    const d = diagnostics[0];
    assertEquals(d.id, "test-plugin/throw-needs-do-prefix");
    assertEquals(
      d.message,
      "Function 'processData' contains throw statement, so it must start with 'do'",
    );
  },
);

Deno.test(
  "try: throw-needs-do-prefix - function with await doXxx() doesn't need do prefix",
  () => {
    const diagnostics = Deno.lint.runPlugin(
      testPlugin,
      "test.ts",
      `async function processData() {
        // この関数はthrowを含むが、await doXxx()を使用しているので
        // doプレフィックスが不要
        if (Math.random() > 0.5) {
          throw new Error("Error in processing");
        }
        await doSomethingAsync();
        return "data";
      }
      
      async function doMain() {
        const result = await processData();
      }`,
    );

    // processData関数はthrowを含むが、await doXxx()を使用しているので
    // doプレフィックスを強制されないはず
    assertEquals(
      diagnostics.length,
      0,
    );
  },
);

Deno.test(
  "try: throw-needs-do-prefix - function without throw doesn't need do prefix",
  () => {
    const diagnostics = Deno.lint.runPlugin(
      testPlugin,
      "test.ts",
      `function getData() {
        return "data";
      }`,
    );

    // throwを含まないので、エラーは報告されないはず
    assertEquals(
      diagnostics.filter((d) => d.id === "do-try/throw-needs-do-prefix").length,
      0,
    );
  },
);

Deno.test(
  "try: throw-needs-do-prefix - arrow function with throw without do prefix",
  () => {
    const diagnostics = Deno.lint.runPlugin(
      testPlugin,
      "test.ts",
      `const getData = () => {
        if (Math.random() > 0.5) {
          throw new Error("Random error");
        }
        return "data";
      }`,
    );

    assertEquals(diagnostics.length, 1);
    const d = diagnostics[0];
    assertEquals(d.id, "test-plugin/throw-needs-do-prefix");
    assertEquals(
      d.message,
      "Function 'getData' contains throw statement, so it must start with 'do'",
    );
  },
);

Deno.test(
  "try: throw-needs-do-prefix - method with throw without do prefix",
  () => {
    const diagnostics = Deno.lint.runPlugin(
      testPlugin,
      "test.ts",
      `class DataService {
        getData() {
          if (Math.random() > 0.5) {
            throw new Error("Random error");
          }
          return "data";
        }
      }`,
    );

    assertEquals(diagnostics.length, 1);
    const d = diagnostics[0];
    assertEquals(d.id, "test-plugin/throw-needs-do-prefix");
    assertEquals(
      d.message,
      "Function 'getData' contains throw statement, so it must start with 'do'",
    );
  },
);
