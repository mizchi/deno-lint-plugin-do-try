/**
 * コード品質計算モジュールの複雑度計算
 *
 * このファイルでは、TypeScriptのASTを解析して複雑度を計算するための機能を提供します。
 * expressionの複雑度、statementごとの複雑度、blockごとの複雑度を再帰的に計算します。
 */

// TypeScriptコンパイラを使用
import ts from "npm:typescript";

/**
 * 複雑度計算の結果を表すインターフェース
 */
export interface ComplexityResult {
  // 総合スコア
  score: number;
  // ノードの種類
  nodeType: string;
  // 子ノードの複雑度結果（再帰構造）
  children: ComplexityResult[];
  // 行番号情報
  lineInfo?: {
    startLine: number;
    endLine: number;
  };
  // 追加情報（理由など）
  metadata?: Record<string, unknown>;
}

/**
 * 複雑度計算のコンテキスト
 * 計算中に必要な情報を保持します
 */
export interface ComplexityContext {
  // ソースファイル（行番号計算に使用）
  sourceFile: ts.SourceFile;
  // 訪問済みノードを追跡（循環参照防止）
  visitedNodes: Set<ts.Node>;
  // 最大再帰深度
  maxDepth: number;
  // 現在の再帰深度
  currentDepth: number;
}

/**
 * 複雑度計算の設定
 */
export interface ComplexityOptions {
  // 最大再帰深度（デフォルト: 20）
  maxDepth?: number;
  // 式の複雑度の重み
  expressionWeight?: number;
  // ステートメントの複雑度の重み
  statementWeight?: number;
  // ブロックの複雑度の重み
  blockWeight?: number;
}

/**
 * デフォルトの複雑度計算オプション
 */
export const DEFAULT_COMPLEXITY_OPTIONS: ComplexityOptions = {
  maxDepth: 20,
  expressionWeight: 1.0,
  statementWeight: 1.5,
  blockWeight: 2.0,
};

/**
 * 複雑度計算のコンテキストを初期化する
 * @param sourceFile ソースファイル
 * @param options 複雑度計算オプション
 * @returns 初期化されたコンテキスト
 */
export function createComplexityContext(
  sourceFile: ts.SourceFile,
  options: ComplexityOptions = DEFAULT_COMPLEXITY_OPTIONS,
): ComplexityContext {
  return {
    sourceFile,
    visitedNodes: new Set<ts.Node>(),
    maxDepth: options.maxDepth || DEFAULT_COMPLEXITY_OPTIONS.maxDepth!,
    currentDepth: 0,
  };
}

/**
 * ノードの行情報を取得する
 * @param node ASTノード
 * @param sourceFile ソースファイル
 * @returns 行情報オブジェクト
 */
function getNodeLineInfo(node: ts.Node, sourceFile: ts.SourceFile) {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
  return {
    startLine: start.line + 1, // 1-based
    endLine: end.line + 1, // 1-based
  };
}

/**
 * 式の複雑度を計算する
 * @param expression 式
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
/**
 * 式の複雑度を計算する（新しいバージョン）
 * 各ノードタイプに対して明確で一貫性のあるスコア計算パターンを実装
 * @param expression 式
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
export function calculateNewExpressionComplexity(
  expression: ts.Expression,
  context: ComplexityContext,
): ComplexityResult {
  return calculateExpressionComplexityWithPattern(expression, context);
}

/**
 * 式の複雑度を計算する（旧バージョン - 互換性のために維持）
 * @param expression 式
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
export function calculateExpressionComplexity(
  expression: ts.Expression,
  context: ComplexityContext,
): ComplexityResult {
  return calculateExpressionComplexityWithPattern(expression, context);
}

/**
 * 式の複雑度を計算する（パターンベースの実装）
 * @param expression 式
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
function calculateExpressionComplexityWithPattern(
  expression: ts.Expression,
  context: ComplexityContext,
): ComplexityResult {
  // 再帰深度チェック
  if (context.currentDepth >= context.maxDepth) {
    return createTruncatedResult(expression);
  }

  // 循環参照チェック
  if (context.visitedNodes.has(expression)) {
    return createCircularReferenceResult(expression);
  }

  // 訪問済みノードに追加
  context.visitedNodes.add(expression);
  context.currentDepth++;

  // ノードタイプに基づいて複雑度を計算
  const result = calculateNodeComplexity(expression, context);

  // 再帰深度を戻す
  context.currentDepth--;

  return result;
}

/**
 * 切り捨てられた結果を作成する
 * @param node ASTノード
 * @returns 複雑度計算結果
 */
function createTruncatedResult(node: ts.Node): ComplexityResult {
  return {
    score: 1,
    nodeType: ts.SyntaxKind[node.kind],
    children: [],
    metadata: { truncated: true },
  };
}

/**
 * 循環参照の結果を作成する
 * @param expression 式
 * @returns 複雑度計算結果
 */
function createCircularReferenceResult(
  expression: ts.Expression,
): ComplexityResult {
  // ノードタイプに基づいて基本的な複雑度を計算
  let baseScore = 1;
  const metadata: Record<string, unknown> = {
    circular: true,
    estimatedScore: true,
  };

  // 二項演算子の場合
  if (ts.isBinaryExpression(expression)) {
    const operatorComplexity = getBinaryOperatorComplexity(
      expression.operatorToken.kind,
    );
    baseScore += operatorComplexity;
    metadata.operatorType = ts.SyntaxKind[expression.operatorToken.kind];
  } // 条件式の場合
  else if (ts.isConditionalExpression(expression)) {
    baseScore += 1;
  } // 関数呼び出しの場合
  else if (ts.isCallExpression(expression)) {
    const argCount = expression.arguments.length;
    baseScore += argCount * 0.2;
    metadata.argumentCount = argCount;
  }

  return {
    score: baseScore,
    nodeType: ts.SyntaxKind[expression.kind],
    children: [],
    metadata,
  };
}

/**
 * 二項演算子の複雑度を取得する
 * @param kind 演算子の種類
 * @returns 複雑度スコア
 */
function getBinaryOperatorComplexity(kind: ts.SyntaxKind): number {
  // 論理演算子
  if (
    kind === ts.SyntaxKind.AmpersandAmpersandToken ||
    kind === ts.SyntaxKind.BarBarToken
  ) {
    return 0.5;
  }

  // 比較演算子
  if (
    [
      ts.SyntaxKind.EqualsEqualsToken,
      ts.SyntaxKind.EqualsEqualsEqualsToken,
      ts.SyntaxKind.ExclamationEqualsToken,
      ts.SyntaxKind.ExclamationEqualsEqualsToken,
      ts.SyntaxKind.LessThanToken,
      ts.SyntaxKind.LessThanEqualsToken,
      ts.SyntaxKind.GreaterThanToken,
      ts.SyntaxKind.GreaterThanEqualsToken,
    ].includes(kind)
  ) {
    return 0.3;
  }

  // その他の演算子
  return 0.1;
}

/**
 * ノードの複雑度を計算する
 * @param expression 式
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
function calculateNodeComplexity(
  expression: ts.Expression,
  context: ComplexityContext,
): ComplexityResult {
  // 基本スコア
  let score = 1;
  const children: ComplexityResult[] = [];
  const metadata: Record<string, unknown> = {};

  // ノードタイプに基づいて複雑度を計算
  if (ts.isBinaryExpression(expression)) {
    const result = calculateBinaryExpressionComplexity(expression, context);
    score = result.score;
    children.push(...result.children);
    Object.assign(metadata, result.metadata || {});
  } else if (ts.isPrefixUnaryExpression(expression)) {
    const result = calculatePrefixUnaryExpressionComplexity(
      expression,
      context,
    );
    score = result.score;
    children.push(...result.children);
    Object.assign(metadata, result.metadata || {});
  } else if (ts.isPostfixUnaryExpression(expression)) {
    const result = calculatePostfixUnaryExpressionComplexity(
      expression,
      context,
    );
    score = result.score;
    children.push(...result.children);
    Object.assign(metadata, result.metadata || {});
  } else if (ts.isConditionalExpression(expression)) {
    const result = calculateConditionalExpressionComplexity(
      expression,
      context,
    );
    score = result.score;
    children.push(...result.children);
    Object.assign(metadata, result.metadata || {});
  } else if (ts.isCallExpression(expression)) {
    const result = calculateCallExpressionComplexity(expression, context);
    score = result.score;
    children.push(...result.children);
    Object.assign(metadata, result.metadata || {});
  } else if (ts.isPropertyAccessExpression(expression)) {
    const result = calculatePropertyAccessExpressionComplexity(
      expression,
      context,
    );
    score = result.score;
    children.push(...result.children);
    Object.assign(metadata, result.metadata || {});
  } else if (ts.isElementAccessExpression(expression)) {
    const result = calculateElementAccessExpressionComplexity(
      expression,
      context,
    );
    score = result.score;
    children.push(...result.children);
    Object.assign(metadata, result.metadata || {});
  } else if (ts.isObjectLiteralExpression(expression)) {
    const result = calculateObjectLiteralExpressionComplexity(
      expression,
      context,
    );
    score = result.score;
    children.push(...result.children);
    Object.assign(metadata, result.metadata || {});
  } else if (ts.isArrayLiteralExpression(expression)) {
    const result = calculateArrayLiteralExpressionComplexity(
      expression,
      context,
    );
    score = result.score;
    children.push(...result.children);
    Object.assign(metadata, result.metadata || {});
  }

  return {
    score,
    nodeType: ts.SyntaxKind[expression.kind],
    children,
    lineInfo: getNodeLineInfo(expression, context.sourceFile),
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
}

/**
 * 二項演算式の複雑度を計算する
 * 左辺と右辺の複雑度の合計 + 演算子の複雑度
 * @param expression 二項演算式
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
function calculateBinaryExpressionComplexity(
  expression: ts.BinaryExpression,
  context: ComplexityContext,
): ComplexityResult {
  // 左辺と右辺の複雑さを再帰的に計算
  const leftComplexity = calculateExpressionComplexityWithPattern(
    expression.left,
    context,
  );
  const rightComplexity = calculateExpressionComplexityWithPattern(
    expression.right,
    context,
  );

  const children = [leftComplexity, rightComplexity];

  // 左辺と右辺の複雑度の合計
  let score = leftComplexity.score + rightComplexity.score;

  // 演算子の複雑度を追加
  const operatorComplexity = getBinaryOperatorComplexity(
    expression.operatorToken.kind,
  );
  score += operatorComplexity;

  // 基本スコアを追加
  score += 1;

  return {
    score,
    nodeType: ts.SyntaxKind[expression.kind],
    children,
    metadata: {
      operatorType: ts.SyntaxKind[expression.operatorToken.kind],
      operatorComplexity: operatorComplexity,
    },
  };
}

/**
 * 前置単項演算式の複雑度を計算する
 * オペランドの複雑度 + 演算子の複雑度
 * @param expression 前置単項演算式
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
function calculatePrefixUnaryExpressionComplexity(
  expression: ts.PrefixUnaryExpression,
  context: ComplexityContext,
): ComplexityResult {
  const operandComplexity = calculateExpressionComplexityWithPattern(
    expression.operand,
    context,
  );

  let operatorComplexity = 0.1;

  // 否定演算子は複雑さを増す
  if (expression.operator === ts.SyntaxKind.ExclamationToken) {
    operatorComplexity = 0.3;
  }

  const score = 1 + operandComplexity.score + operatorComplexity;

  return {
    score,
    nodeType: ts.SyntaxKind[expression.kind],
    children: [operandComplexity],
    metadata: {
      operatorType: ts.SyntaxKind[expression.operator],
      operatorComplexity,
    },
  };
}

/**
 * 後置単項演算式の複雑度を計算する
 * オペランドの複雑度 + 演算子の複雑度
 * @param expression 後置単項演算式
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
function calculatePostfixUnaryExpressionComplexity(
  expression: ts.PostfixUnaryExpression,
  context: ComplexityContext,
): ComplexityResult {
  const operandComplexity = calculateExpressionComplexityWithPattern(
    expression.operand,
    context,
  );

  const operatorComplexity = 0.2;
  const score = 1 + operandComplexity.score + operatorComplexity;

  return {
    score,
    nodeType: ts.SyntaxKind[expression.kind],
    children: [operandComplexity],
    metadata: {
      operatorType: ts.SyntaxKind[expression.operator],
      operatorComplexity,
    },
  };
}

/**
 * 条件式（三項演算子）の複雑度を計算する
 * 条件の複雑度 + 真の式の複雑度 + 偽の式の複雑度 + 基本スコア
 * @param expression 条件式
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
function calculateConditionalExpressionComplexity(
  expression: ts.ConditionalExpression,
  context: ComplexityContext,
): ComplexityResult {
  const conditionComplexity = calculateExpressionComplexityWithPattern(
    expression.condition,
    context,
  );
  const trueExprComplexity = calculateExpressionComplexityWithPattern(
    expression.whenTrue,
    context,
  );
  const falseExprComplexity = calculateExpressionComplexityWithPattern(
    expression.whenFalse,
    context,
  );

  const children = [
    conditionComplexity,
    trueExprComplexity,
    falseExprComplexity,
  ];

  // 条件式の複雑度 = 条件の複雑度 + 真の式の複雑度 + 偽の式の複雑度 + 基本スコア
  const score = 1 + conditionComplexity.score + trueExprComplexity.score +
    falseExprComplexity.score;

  return {
    score,
    nodeType: ts.SyntaxKind[expression.kind],
    children,
    metadata: {
      conditionalComplexity: conditionComplexity.score,
      branchComplexity: trueExprComplexity.score + falseExprComplexity.score,
    },
  };
}

/**
 * 関数呼び出し式の複雑度を計算する
 * 関数名の複雑度 + (引数の数 * 引数の複雑度の合計)
 * @param expression 関数呼び出し式
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
function calculateCallExpressionComplexity(
  expression: ts.CallExpression,
  context: ComplexityContext,
): ComplexityResult {
  // 関数名の複雑さ
  const calleeComplexity = calculateExpressionComplexityWithPattern(
    expression.expression,
    context,
  );

  const children = [calleeComplexity];
  let argumentsComplexity = 0;

  // 引数の複雑さを計算
  for (const arg of expression.arguments) {
    const argComplexity = calculateExpressionComplexityWithPattern(
      arg as ts.Expression,
      context,
    );
    children.push(argComplexity);
    argumentsComplexity += argComplexity.score;
  }

  // 関数呼び出しの複雑度 = 関数名の複雑度 + (引数の数 * 引数の複雑度の合計)
  const argMultiplier = Math.max(1, expression.arguments.length * 0.2);
  const score = 1 + calleeComplexity.score +
    (argumentsComplexity * argMultiplier);

  return {
    score,
    nodeType: ts.SyntaxKind[expression.kind],
    children,
    metadata: {
      calleeComplexity: calleeComplexity.score,
      argumentCount: expression.arguments.length,
      argumentsComplexity,
      argMultiplier,
    },
  };
}

/**
 * プロパティアクセス式の複雑度を計算する
 * オブジェクトの複雑度 + 基本スコア
 * @param expression プロパティアクセス式
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
function calculatePropertyAccessExpressionComplexity(
  expression: ts.PropertyAccessExpression,
  context: ComplexityContext,
): ComplexityResult {
  const objectComplexity = calculateExpressionComplexityWithPattern(
    expression.expression,
    context,
  );

  // プロパティアクセスの複雑度 = オブジェクトの複雑度 + 基本スコア
  const score = 1 + objectComplexity.score;

  return {
    score,
    nodeType: ts.SyntaxKind[expression.kind],
    children: [objectComplexity],
    metadata: {
      propertyName: expression.name.text,
      objectComplexity: objectComplexity.score,
    },
  };
}

/**
 * 配列要素アクセス式の複雑度を計算する
 * オブジェクトの複雑度 + インデックスの複雑度 + 基本スコア
 * @param expression 配列要素アクセス式
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
function calculateElementAccessExpressionComplexity(
  expression: ts.ElementAccessExpression,
  context: ComplexityContext,
): ComplexityResult {
  const objectComplexity = calculateExpressionComplexityWithPattern(
    expression.expression,
    context,
  );
  const indexComplexity = calculateExpressionComplexityWithPattern(
    expression.argumentExpression,
    context,
  );

  // 配列要素アクセスの複雑度 = オブジェクトの複雑度 + インデックスの複雑度 + 基本スコア
  const score = 1 + objectComplexity.score + indexComplexity.score;

  return {
    score,
    nodeType: ts.SyntaxKind[expression.kind],
    children: [objectComplexity, indexComplexity],
    metadata: {
      objectComplexity: objectComplexity.score,
      indexComplexity: indexComplexity.score,
    },
  };
}

/**
 * オブジェクトリテラル式の複雑度を計算する
 * プロパティの複雑度の合計 + 基本スコア
 * @param expression オブジェクトリテラル式
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
function calculateObjectLiteralExpressionComplexity(
  expression: ts.ObjectLiteralExpression,
  context: ComplexityContext,
): ComplexityResult {
  const children: ComplexityResult[] = [];
  let propertiesComplexity = 0;

  // プロパティごとの複雑さを計算
  for (const property of expression.properties) {
    if (
      ts.isPropertyAssignment(property) &&
      ts.isExpression(property.initializer)
    ) {
      const propComplexity = calculateExpressionComplexityWithPattern(
        property.initializer,
        context,
      );
      children.push(propComplexity);
      propertiesComplexity += propComplexity.score;
    }
  }

  // オブジェクトリテラルの複雑度 = プロパティの複雑度の合計 + 基本スコア
  const score = 1 + propertiesComplexity;

  return {
    score,
    nodeType: ts.SyntaxKind[expression.kind],
    children,
    metadata: {
      propertyCount: expression.properties.length,
      propertiesComplexity,
    },
  };
}

/**
 * 配列リテラル式の複雑度を計算する
 * 要素の複雑度の合計 + 基本スコア
 * @param expression 配列リテラル式
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
function calculateArrayLiteralExpressionComplexity(
  expression: ts.ArrayLiteralExpression,
  context: ComplexityContext,
): ComplexityResult {
  const children: ComplexityResult[] = [];
  let elementsComplexity = 0;

  // 要素ごとの複雑さを計算
  for (const element of expression.elements) {
    const elementComplexity = calculateExpressionComplexityWithPattern(
      element as ts.Expression,
      context,
    );
    children.push(elementComplexity);
    elementsComplexity += elementComplexity.score;
  }

  // 配列リテラルの複雑度 = 要素の複雑度の合計 + 基本スコア
  const score = 1 + elementsComplexity;

  return {
    score,
    nodeType: ts.SyntaxKind[expression.kind],
    children,
    metadata: {
      elementCount: expression.elements.length,
      elementsComplexity,
    },
  };
}

/**
 * ステートメントの複雑度を計算する（新しいバージョン）
 * 各ノードタイプに対して明確で一貫性のあるスコア計算パターンを実装
 * @param statement ステートメント
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
export function calculateNewStatementComplexity(
  statement: ts.Statement,
  context: ComplexityContext,
): ComplexityResult {
  return calculateStatementComplexityWithPattern(statement, context);
}

/**
 * ステートメントの複雑度を計算する
 * @param statement ステートメント
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
export function calculateStatementComplexity(
  statement: ts.Statement,
  context: ComplexityContext,
): ComplexityResult {
  return calculateStatementComplexityWithPattern(statement, context);
}

/**
 * ステートメントの複雑度を計算する（パターンベースの実装）
 * @param statement ステートメント
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
function calculateStatementComplexityWithPattern(
  statement: ts.Statement,
  context: ComplexityContext,
): ComplexityResult {
  // 再帰深度チェック
  if (context.currentDepth >= context.maxDepth) {
    return createTruncatedResult(statement);
  }

  // 循環参照チェック
  if (context.visitedNodes.has(statement)) {
    return createCircularReferenceStatementResult(statement);
  }

  // 訪問済みノードに追加
  context.visitedNodes.add(statement);
  context.currentDepth++;

  // ノードタイプに基づいて複雑度を計算
  const result = calculateStatementNodeComplexity(statement, context);

  // 再帰深度を戻す
  context.currentDepth--;

  return result;
}

/**
 * 循環参照のステートメント結果を作成する
 * @param statement ステートメント
 * @returns 複雑度計算結果
 */
function createCircularReferenceStatementResult(
  statement: ts.Statement,
): ComplexityResult {
  // ノードタイプに基づいて基本的な複雑度を計算
  let baseScore = 1;
  const metadata: Record<string, unknown> = {
    circular: true,
    estimatedScore: true,
  };

  // ステートメントの種類に基づいて複雑度を追加
  if (ts.isIfStatement(statement)) {
    baseScore += 0.5;
    metadata.statementType = "if";
  } else if (
    ts.isForStatement(statement) || ts.isForOfStatement(statement) ||
    ts.isForInStatement(statement)
  ) {
    baseScore += 0.8;
    metadata.statementType = "loop";
  } else if (ts.isWhileStatement(statement)) {
    baseScore += 0.8;
    metadata.statementType = "while";
  } else if (ts.isDoStatement(statement)) {
    baseScore += 1;
    metadata.statementType = "doWhile";
  } else if (ts.isSwitchStatement(statement)) {
    // caseブロックの数が分からないので平均的な値を使用
    baseScore += 1.5;
    metadata.statementType = "switch";
  } else if (ts.isTryStatement(statement)) {
    baseScore += 3; // try + catch(2)
    metadata.statementType = "try";
  } else if (ts.isThrowStatement(statement)) {
    baseScore += 1;
    metadata.statementType = "throw";
  }

  return {
    score: baseScore,
    nodeType: ts.SyntaxKind[statement.kind],
    children: [],
    metadata,
  };
}

/**
 * ステートメントノードの複雑度を計算する
 * @param statement ステートメント
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
function calculateStatementNodeComplexity(
  statement: ts.Statement,
  context: ComplexityContext,
): ComplexityResult {
  // 基本スコア
  let score = 1;
  const children: ComplexityResult[] = [];
  const metadata: Record<string, unknown> = {};

  // 式文
  if (ts.isExpressionStatement(statement)) {
    if (statement.expression) {
      const exprComplexity = calculateExpressionComplexity(
        statement.expression,
        context,
      );
      children.push(exprComplexity);
      score += exprComplexity.score;
    }
  } // 変数宣言
  else if (ts.isVariableStatement(statement)) {
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.initializer) {
        const initComplexity = calculateExpressionComplexity(
          declaration.initializer,
          context,
        );
        children.push(initComplexity);
        score += initComplexity.score;
      }
    }

    // let宣言は複雑度が高い（変更可能性）
    if ((statement.declarationList.flags & ts.NodeFlags.Let) !== 0) {
      score += 0.5;
      metadata.mutable = true;
    }
  } // if文
  else if (ts.isIfStatement(statement)) {
    // 条件式の複雑さ
    const conditionComplexity = calculateExpressionComplexity(
      statement.expression,
      context,
    );
    children.push(conditionComplexity);
    score += conditionComplexity.score;

    // then節の複雑さ
    const thenComplexity = calculateStatementComplexity(
      statement.thenStatement,
      context,
    );
    children.push(thenComplexity);
    score += thenComplexity.score;

    // else節の複雑さ（存在する場合）
    if (statement.elseStatement) {
      const elseComplexity = calculateStatementComplexity(
        statement.elseStatement,
        context,
      );
      children.push(elseComplexity);
      score += elseComplexity.score;
    }

    // if文自体の複雑さ
    score += 0.5;
  } // for文
  else if (ts.isForStatement(statement)) {
    // 初期化式の複雑さ
    if (statement.initializer) {
      if (ts.isVariableDeclarationList(statement.initializer)) {
        for (const declaration of statement.initializer.declarations) {
          if (declaration.initializer) {
            const initComplexity = calculateExpressionComplexity(
              declaration.initializer,
              context,
            );
            children.push(initComplexity);
            score += initComplexity.score;
          }
        }
      } else if (ts.isExpression(statement.initializer)) {
        const initComplexity = calculateExpressionComplexity(
          statement.initializer,
          context,
        );
        children.push(initComplexity);
        score += initComplexity.score;
      }
    }

    // 条件式の複雑さ
    if (statement.condition) {
      const conditionComplexity = calculateExpressionComplexity(
        statement.condition,
        context,
      );
      children.push(conditionComplexity);
      score += conditionComplexity.score;
    }

    // 増分式の複雑さ
    if (statement.incrementor) {
      const incrementorComplexity = calculateExpressionComplexity(
        statement.incrementor,
        context,
      );
      children.push(incrementorComplexity);
      score += incrementorComplexity.score;
    }

    // 本体の複雑さ
    const bodyComplexity = calculateStatementComplexity(
      statement.statement,
      context,
    );
    children.push(bodyComplexity);
    score += bodyComplexity.score;

    // for文自体の複雑さ
    score += 1;
  } // for-of文/for-in文
  else if (ts.isForOfStatement(statement) || ts.isForInStatement(statement)) {
    // 初期化部分の複雑さ
    if (ts.isVariableDeclarationList(statement.initializer)) {
      for (const declaration of statement.initializer.declarations) {
        if (declaration.initializer) {
          const initComplexity = calculateExpressionComplexity(
            declaration.initializer,
            context,
          );
          children.push(initComplexity);
          score += initComplexity.score;
        }
      }
    }

    // 反復対象の複雑さ
    const expressionComplexity = calculateExpressionComplexity(
      statement.expression,
      context,
    );
    children.push(expressionComplexity);
    score += expressionComplexity.score;

    // 本体の複雑さ
    const bodyComplexity = calculateStatementComplexity(
      statement.statement,
      context,
    );
    children.push(bodyComplexity);
    score += bodyComplexity.score;

    // for-of/for-in文自体の複雑さ
    score += 0.8;
  } // while文
  else if (ts.isWhileStatement(statement)) {
    // 条件式の複雑さ
    const conditionComplexity = calculateExpressionComplexity(
      statement.expression,
      context,
    );
    children.push(conditionComplexity);
    score += conditionComplexity.score;

    // 本体の複雑さ
    const bodyComplexity = calculateStatementComplexity(
      statement.statement,
      context,
    );
    children.push(bodyComplexity);
    score += bodyComplexity.score;

    // while文自体の複雑さ
    score += 0.8;
  } // do-while文
  else if (ts.isDoStatement(statement)) {
    // 本体の複雑さ
    const bodyComplexity = calculateStatementComplexity(
      statement.statement,
      context,
    );
    children.push(bodyComplexity);
    score += bodyComplexity.score;

    // 条件式の複雑さ
    const conditionComplexity = calculateExpressionComplexity(
      statement.expression,
      context,
    );
    children.push(conditionComplexity);
    score += conditionComplexity.score;

    // do-while文自体の複雑さ
    score += 1;
  } // switch文
  else if (ts.isSwitchStatement(statement)) {
    // 条件式の複雑さ
    const conditionComplexity = calculateExpressionComplexity(
      statement.expression,
      context,
    );
    children.push(conditionComplexity);
    score += conditionComplexity.score;

    // 各caseの複雑さ
    for (const clause of statement.caseBlock.clauses) {
      // case式の複雑さ（default節でない場合）
      if (ts.isCaseClause(clause) && clause.expression) {
        const caseExprComplexity = calculateExpressionComplexity(
          clause.expression,
          context,
        );
        children.push(caseExprComplexity);
        score += caseExprComplexity.score * 0.3; // case式は比較的単純なので重みを下げる
      }

      // case本体の複雑さ
      for (const stmt of clause.statements) {
        const stmtComplexity = calculateStatementComplexity(stmt, context);
        children.push(stmtComplexity);
        score += stmtComplexity.score;
      }
    }

    // switch文自体の複雑さ（ケース数に基づく）
    const caseCount = statement.caseBlock.clauses.length;
    score += caseCount * 0.5;
    metadata.caseCount = caseCount;
  } // try-catch文
  else if (ts.isTryStatement(statement)) {
    // tryブロックの複雑さ
    const tryBlockComplexity = calculateBlockComplexity(
      statement.tryBlock,
      context,
    );
    children.push(tryBlockComplexity);
    score += tryBlockComplexity.score;

    // catchブロックの複雑さ（存在する場合）
    if (statement.catchClause) {
      // catch変数の複雑さ
      if (statement.catchClause.variableDeclaration) {
        score += 0.5;
      }

      // catchブロックの複雑さ
      const catchBlockComplexity = calculateBlockComplexity(
        statement.catchClause.block,
        context,
      );
      children.push(catchBlockComplexity);
      score += catchBlockComplexity.score;
      score += 2; // catchブロック自体の複雑さ
    }

    // finallyブロックの複雑さ（存在する場合）
    if (statement.finallyBlock) {
      const finallyBlockComplexity = calculateBlockComplexity(
        statement.finallyBlock,
        context,
      );
      children.push(finallyBlockComplexity);
      score += finallyBlockComplexity.score;
      score += 1.5; // finallyブロック自体の複雑さ
    }

    // try-catch文自体の複雑さ
    score += 1;
  } // throw文
  else if (ts.isThrowStatement(statement)) {
    if (statement.expression) {
      const exprComplexity = calculateExpressionComplexity(
        statement.expression,
        context,
      );
      children.push(exprComplexity);
      score += exprComplexity.score;
    }

    // throw文自体の複雑さ
    score += 1;
  } // return文
  else if (ts.isReturnStatement(statement)) {
    if (statement.expression) {
      const exprComplexity = calculateExpressionComplexity(
        statement.expression,
        context,
      );
      children.push(exprComplexity);
      score += exprComplexity.score;
    }
  } // ブロック文
  else if (ts.isBlock(statement)) {
    const blockComplexity = calculateBlockComplexity(statement, context);
    children.push(blockComplexity);
    score += blockComplexity.score;
  }

  // 再帰深度を戻す
  context.currentDepth--;

  return {
    score,
    nodeType: ts.SyntaxKind[statement.kind],
    children,
    lineInfo: getNodeLineInfo(statement, context.sourceFile),
    metadata,
  };
}

/**
 * ブロックの複雑度を計算する
 * @param block ブロック
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
export function calculateBlockComplexity(
  block: ts.Block,
  context: ComplexityContext,
): ComplexityResult {
  // 再帰深度チェック
  if (context.currentDepth >= context.maxDepth) {
    return {
      score: 1,
      nodeType: ts.SyntaxKind[block.kind],
      children: [],
      metadata: { truncated: true },
    };
  }

  // 循環参照チェック
  if (context.visitedNodes.has(block)) {
    return {
      score: 1,
      nodeType: ts.SyntaxKind[block.kind],
      children: [],
      metadata: { circular: true },
    };
  }

  // 訪問済みノードに追加
  context.visitedNodes.add(block);
  context.currentDepth++;

  // 基本スコア
  let score = 1;
  const children: ComplexityResult[] = [];

  // 各ステートメントの複雑さを計算
  for (const statement of block.statements) {
    const stmtComplexity = calculateStatementComplexity(statement, context);
    children.push(stmtComplexity);
    score += stmtComplexity.score;
  }

  // ブロック内のステートメント数に基づく追加スコア
  const statementCount = block.statements.length;
  score += statementCount * 0.1;

  // 再帰深度を戻す
  context.currentDepth--;

  return {
    score,
    nodeType: ts.SyntaxKind[block.kind],
    children,
    lineInfo: getNodeLineInfo(block, context.sourceFile),
    metadata: { statementCount },
  };
}

/**
 * ソースファイル全体の複雑度を計算する
 * @param sourceFile ソースファイル
 * @param options 複雑度計算オプション
 * @returns 複雑度計算結果
 */
export function calculateFileComplexity(
  sourceFile: ts.SourceFile,
  options: ComplexityOptions = DEFAULT_COMPLEXITY_OPTIONS,
): ComplexityResult {
  const context = createComplexityContext(sourceFile, options);

  // 基本スコア
  let score = 1;
  const children: ComplexityResult[] = [];

  // 各ステートメントの複雑さを計算
  for (const statement of sourceFile.statements) {
    const stmtComplexity = calculateStatementComplexity(statement, context);
    children.push(stmtComplexity);

    // ステートメントの種類に基づいて重み付けを行う
    let weight = 1.0;

    // クラス宣言は内部構造が複雑なので重みを増やす
    if (ts.isClassDeclaration(statement)) {
      // クラスのメンバー数に基づいて重みを調整
      const memberCount = statement.members.length;
      weight = 1.0 + (memberCount * 0.1);

      // 継承がある場合はさらに複雑
      if (statement.heritageClauses && statement.heritageClauses.length > 0) {
        weight += 0.5;
      }
    } // インターフェース宣言も複雑な構造を持つ
    else if (ts.isInterfaceDeclaration(statement)) {
      const memberCount = statement.members.length;
      weight = 1.0 + (memberCount * 0.05);
    } // 関数宣言は比較的シンプル
    else if (ts.isFunctionDeclaration(statement)) {
      // パラメータ数に基づいて重みを調整
      const paramCount = statement.parameters.length;
      weight = 0.8 + (paramCount * 0.05);
    }

    score += stmtComplexity.score * weight;
  }

  return {
    score,
    nodeType: ts.SyntaxKind[sourceFile.kind],
    children,
    lineInfo: {
      startLine: 1,
      endLine:
        sourceFile.getLineAndCharacterOfPosition(sourceFile.getEnd()).line + 1,
    },
    metadata: {
      fileName: sourceFile.fileName,
      statementCount: sourceFile.statements.length,
      weightedScore: true,
    },
  };
}

/**
 * コードの複雑度を計算する
 * @param code TypeScriptコード
 * @param options 複雑度計算オプション
 * @returns 複雑度計算結果
 */
export function calculateCodeComplexity(
  code: string,
  options: ComplexityOptions = DEFAULT_COMPLEXITY_OPTIONS,
): ComplexityResult {
  // ソースファイルを作成
  const sourceFile = ts.createSourceFile(
    "temp.ts",
    code,
    ts.ScriptTarget.Latest,
    true,
  );

  // ファイル全体の複雑度を計算
  return calculateFileComplexity(sourceFile, options);
}

/**
 * 複雑度結果からホットスポットを抽出する
 * @param result 複雑度計算結果
 * @param threshold ホットスポットとみなすスコアの閾値
 * @returns ホットスポットの配列
 */
export function extractHotspots(
  result: ComplexityResult,
  threshold: number = 5,
): ComplexityResult[] {
  const hotspots: ComplexityResult[] = [];

  // 現在のノードがホットスポットかチェック
  if (result.score >= threshold) {
    hotspots.push(result);
  }

  // 子ノードを再帰的に処理
  for (const child of result.children) {
    hotspots.push(...extractHotspots(child, threshold));
  }

  // スコアの降順でソート
  return hotspots.sort((a, b) => b.score - a.score);
}

/**
 * 複雑度結果を平坦化する（デバッグ用）
 * @param result 複雑度計算結果
 * @returns 平坦化された複雑度情報の配列
 */
export function flattenComplexityResult(
  result: ComplexityResult,
): Array<{
  nodeType: string;
  score: number;
  lineInfo?: { startLine: number; endLine: number };
  metadata?: Record<string, unknown>;
}> {
  const flattened: Array<{
    nodeType: string;
    score: number;
    lineInfo?: { startLine: number; endLine: number };
    metadata?: Record<string, unknown>;
  }> = [];

  // 現在のノードを追加
  flattened.push({
    nodeType: result.nodeType,
    score: result.score,
    lineInfo: result.lineInfo,
    metadata: result.metadata,
  });

  // 子ノードを再帰的に処理
  for (const child of result.children) {
    flattened.push(...flattenComplexityResult(child));
  }

  return flattened;
}
