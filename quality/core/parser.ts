/**
 * コード品質計算モジュールのパーサー
 *
 * このファイルでは、TypeScriptのソースコードを解析するための機能を提供します。
 */

// TypeScriptコンパイラを使用
import ts from "npm:typescript";
import { VariableMutationMap } from "./types.ts";

/**
 * TypeScriptのソースファイルを作成する
 * @param code 解析対象のコード
 * @returns ソースファイル
 */
export function createSourceFile(code: string): ts.SourceFile {
  return ts.createSourceFile(
    "temp.ts",
    code,
    ts.ScriptTarget.Latest,
    true,
  );
}

/**
 * スコープ内のシンボル数を計算する
 * @param scope スコープノード
 * @returns シンボル数
 */
export function countScopeSymbols(scope: ts.Node): number {
  let count = 0;

  // スコープ内の変数宣言をカウント
  function visit(node: ts.Node) {
    if (
      ts.isVariableDeclaration(node) ||
      ts.isParameter(node) ||
      ts.isFunctionDeclaration(node) ||
      ts.isClassDeclaration(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeAliasDeclaration(node)
    ) {
      count++;
    }

    ts.forEachChild(node, visit);
  }

  visit(scope);
  return count;
}

/**
 * 変数の変更回数を追跡する
 * @param node ASTノード
 * @param mutationMap 変数変更マップ
 */
export function trackVariableMutations(
  node: ts.Node,
  mutationMap: VariableMutationMap,
): void {
  // 代入式を検出
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.EqualsToken
  ) {
    // 左辺が識別子（変数名）の場合
    if (ts.isIdentifier(node.left)) {
      const varName = node.left.text;
      mutationMap.set(varName, (mutationMap.get(varName) || 0) + 1);
    } // 左辺がプロパティアクセス式の場合
    else if (ts.isPropertyAccessExpression(node.left)) {
      // オブジェクトのプロパティへの代入も追跡
      if (ts.isIdentifier(node.left.expression)) {
        const objName = node.left.expression.text;
        const propName = `${objName}.${node.left.name.text}`;
        mutationMap.set(propName, (mutationMap.get(propName) || 0) + 1);
      }
    }
  }

  // 複合代入演算子（+=, -=など）も検出
  if (
    ts.isBinaryExpression(node) &&
    [
      ts.SyntaxKind.PlusEqualsToken,
      ts.SyntaxKind.MinusEqualsToken,
      ts.SyntaxKind.AsteriskEqualsToken,
      ts.SyntaxKind.SlashEqualsToken,
      ts.SyntaxKind.PercentEqualsToken,
    ].includes(node.operatorToken.kind)
  ) {
    if (ts.isIdentifier(node.left)) {
      const varName = node.left.text;
      mutationMap.set(varName, (mutationMap.get(varName) || 0) + 1);
    }
  }

  // 前置・後置インクリメント/デクリメント演算子も検出
  if (
    ts.isPrefixUnaryExpression(node) &&
    [
      ts.SyntaxKind.PlusPlusToken,
      ts.SyntaxKind.MinusMinusToken,
    ].includes(node.operator)
  ) {
    if (ts.isIdentifier(node.operand)) {
      const varName = node.operand.text;
      mutationMap.set(varName, (mutationMap.get(varName) || 0) + 1);
    }
  }

  if (
    ts.isPostfixUnaryExpression(node) &&
    [
      ts.SyntaxKind.PlusPlusToken,
      ts.SyntaxKind.MinusMinusToken,
    ].includes(node.operator)
  ) {
    if (ts.isIdentifier(node.operand)) {
      const varName = node.operand.text;
      mutationMap.set(varName, (mutationMap.get(varName) || 0) + 1);
    }
  }

  // 子ノードを再帰的に処理
  ts.forEachChild(node, (child) => trackVariableMutations(child, mutationMap));
}

/**
 * ASTノードを再帰的に走査して複雑度を計算する
 * @param node 走査対象のノード
 * @param metrics 計算中の指標
 * @param sourceFile ソースファイル
 * @param mutationMap 変数変更マップ
 */
export function visitNode(
  node: ts.Node,
  metrics: any, // CodeComplexityMetricsを直接インポートすると循環参照になるため、anyを使用
  sourceFile: ts.SourceFile,
  mutationMap: VariableMutationMap,
  addHotspot: (
    metrics: any,
    node: ts.Node,
    sourceFile: ts.SourceFile,
    score: number,
    reason: string,
  ) => void,
  calculateExpressionComplexity: (expression: ts.Expression) => number,
): void {
  // 変数宣言の複雑度を計算
  if (ts.isVariableDeclaration(node)) {
    // let宣言の場合は変更可能性を考慮
    if (
      node.parent &&
      (node.parent.flags & ts.NodeFlags.Let) !== 0
    ) {
      // 変数名を取得
      if (ts.isIdentifier(node.name)) {
        const varName = node.name.text;
        const mutations = mutationMap.get(varName) || 0;

        // 変更回数に応じてスコアを加算
        if (mutations > 0) {
          const score = mutations;
          metrics.variableMutabilityScore += score;
          metrics.totalScore += score;

          addHotspot(
            metrics,
            node,
            sourceFile,
            score,
            `let変数 '${varName}' が ${mutations} 回変更されています`,
          );
        }
      }
    }
  }

  // スコープの複雑さを計算
  if (ts.isBlock(node) || ts.isSourceFile(node)) {
    const symbolCount = countScopeSymbols(node);
    const score = symbolCount * 0.5; // シンボルごとに0.5ポイント加算

    metrics.scopeComplexityScore += score;
    metrics.totalScore += score;

    if (symbolCount > 5) {
      addHotspot(
        metrics,
        node,
        sourceFile,
        score,
        `スコープ内に ${symbolCount} 個のシンボルが存在します`,
      );
    }
  }

  // 代入操作の複雑度を計算
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.EqualsToken
  ) {
    metrics.assignmentScore += 1;
    metrics.totalScore += 1;
  }

  // 関数の複雑さを計算
  if (
    ts.isFunctionDeclaration(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node)
  ) {
    // 関数本体の複雑さを計算
    let bodyComplexity = 1;

    if (node.body) {
      if (ts.isBlock(node.body)) {
        // ブロック内の各ステートメントの複雑さを計算
        node.body.statements.forEach((stmt) => {
          if (ts.isExpressionStatement(stmt) && stmt.expression) {
            bodyComplexity += calculateExpressionComplexity(stmt.expression);
          } else if (ts.isReturnStatement(stmt) && stmt.expression) {
            bodyComplexity += calculateExpressionComplexity(stmt.expression);
          }
        });
      } else if (ts.isExpression(node.body)) {
        // 式本体の関数（アロー関数など）
        bodyComplexity += calculateExpressionComplexity(node.body);
      }
    }

    // 引数の数に基づいてスコアを計算
    const paramCount = node.parameters.length;

    // 関数呼び出し回数を推定（実際の呼び出し回数は静的解析では正確に把握できないため、
    // ここでは引数の数と本体の複雑さに基づいて推定値を使用）
    const estimatedCallCount = Math.max(1, Math.ceil(bodyComplexity / 2));

    // 関数の複雑さ = 推定呼び出し回数 * (本体の複雑さ + 引数の数)
    const score = estimatedCallCount * (bodyComplexity + paramCount);

    metrics.functionComplexityScore += score;
    metrics.totalScore += score;

    if (score > 5) {
      addHotspot(
        metrics,
        node,
        sourceFile,
        score,
        `関数の複雑さが高い (スコア: ${score.toFixed(1)})`,
      );
    }
  }

  // 条件分岐の複雑さを計算
  if (ts.isIfStatement(node)) {
    const complexity = calculateExpressionComplexity(node.expression);
    const score = complexity;

    metrics.conditionalComplexityScore += score;
    metrics.totalScore += score;

    if (complexity > 2) {
      addHotspot(
        metrics,
        node,
        sourceFile,
        score,
        `条件式の複雑さが ${complexity.toFixed(1)} です`,
      );
    }
  }

  // switch文の複雑さを計算
  if (ts.isSwitchStatement(node)) {
    const caseCount = node.caseBlock.clauses.length;
    const score = caseCount * 0.5;

    metrics.conditionalComplexityScore += score;
    metrics.totalScore += score;

    if (caseCount > 5) {
      addHotspot(
        metrics,
        node,
        sourceFile,
        score,
        `switch文に ${caseCount} 個のケースがあります`,
      );
    }
  }

  // 例外処理の複雑さを計算
  if (ts.isThrowStatement(node)) {
    // throw文の複雑さを計算
    let score = 1;

    // throwされる式の複雑さを加算
    if (node.expression) {
      score += calculateExpressionComplexity(node.expression);
    }

    metrics.exceptionHandlingScore += score;
    metrics.totalScore += score;
  }

  if (ts.isTryStatement(node)) {
    // try-catch-finallyブロックの複雑さを計算
    let score = 1; // 基本スコア

    // tryブロックの行数に基づいてスコアを計算
    if (node.tryBlock) {
      const tryBlockStartLine =
        sourceFile.getLineAndCharacterOfPosition(node.tryBlock.getStart()).line;
      const tryBlockEndLine =
        sourceFile.getLineAndCharacterOfPosition(node.tryBlock.getEnd()).line;
      const tryBlockLines = tryBlockEndLine - tryBlockStartLine + 1;

      // tryブロックの行数でn倍（ここでは行数 * 0.5）
      score += tryBlockLines * 0.5;
    }

    // catchブロックがある場合
    if (node.catchClause) {
      score += 2;

      // catchされる例外の型が指定されている場合
      if (node.catchClause.variableDeclaration) {
        score += 0.5;
      }
    }

    // finallyブロックがある場合
    if (node.finallyBlock) {
      score += 1.5;
    }

    metrics.exceptionHandlingScore += score;
    metrics.totalScore += score;

    if (score > 5) {
      addHotspot(
        metrics,
        node,
        sourceFile,
        score,
        `try-catchブロックの複雑さが高い (スコア: ${score.toFixed(1)})`,
      );
    }
  }

  // 子ノードを再帰的に走査
  ts.forEachChild(
    node,
    (child) =>
      visitNode(
        child,
        metrics,
        sourceFile,
        mutationMap,
        addHotspot,
        calculateExpressionComplexity,
      ),
  );
}
