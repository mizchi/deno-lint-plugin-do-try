/**
 * コード品質計算モジュールの複雑度計算 - Expression関連
 *
 * このファイルでは、TypeScriptのExpression（式）の複雑度を計算するための機能を提供します。
 */

// TypeScriptコンパイラを使用
import ts from "npm:typescript";
import {
  ComplexityContext,
  ComplexityResult,
  createTruncatedResult,
  getNodeLineInfo,
} from "./common.ts";

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
/**
 * 早期リターン条件をチェックする
 * @param expression 式
 * @param context 複雑度計算コンテキスト
 * @returns 早期リターン結果または null
 */
function checkEarlyReturn(
  expression: ts.Expression,
  context: ComplexityContext,
): ComplexityResult | null {
  // 再帰深度チェック
  if (context.currentDepth >= context.maxDepth) {
    return createTruncatedResult(expression);
  }

  // 循環参照チェック
  if (context.visitedNodes.has(expression)) {
    return createCircularReferenceResult(expression);
  }

  return null;
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
  // 早期リターン条件をチェック
  const earlyResult = checkEarlyReturn(expression, context);
  if (earlyResult !== null) {
    return earlyResult;
  }

  // 訪問済みノードに追加
  context.visitedNodes.add(expression);
  context.currentDepth++;

  try {
    // ノードタイプに基づいて複雑度を計算
    return calculateNodeComplexity(expression, context);
  } finally {
    // 再帰深度を戻す（例外が発生しても確実に実行）
    context.currentDepth--;
  }
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
/**
 * 式の種類に基づいて適切な計算関数を選択する
 * @param expression 式
 * @param context 複雑度計算コンテキスト
 * @returns 計算関数と式のタイプ
 */
function selectExpressionCalculator(
  expression: ts.Expression,
  context: ComplexityContext,
): {
  calculator: (expr: any, ctx: ComplexityContext) => ComplexityResult;
  type: string;
} {
  if (ts.isBinaryExpression(expression)) {
    return {
      calculator: calculateBinaryExpressionComplexity,
      type: "binary",
    };
  } else if (ts.isPrefixUnaryExpression(expression)) {
    return {
      calculator: calculatePrefixUnaryExpressionComplexity,
      type: "prefixUnary",
    };
  } else if (ts.isPostfixUnaryExpression(expression)) {
    return {
      calculator: calculatePostfixUnaryExpressionComplexity,
      type: "postfixUnary",
    };
  } else if (ts.isConditionalExpression(expression)) {
    return {
      calculator: calculateConditionalExpressionComplexity,
      type: "conditional",
    };
  } else if (ts.isCallExpression(expression)) {
    return {
      calculator: calculateCallExpressionComplexity,
      type: "call",
    };
  } else if (ts.isPropertyAccessExpression(expression)) {
    return {
      calculator: calculatePropertyAccessExpressionComplexity,
      type: "propertyAccess",
    };
  } else if (ts.isElementAccessExpression(expression)) {
    return {
      calculator: calculateElementAccessExpressionComplexity,
      type: "elementAccess",
    };
  } else if (ts.isObjectLiteralExpression(expression)) {
    return {
      calculator: calculateObjectLiteralExpressionComplexity,
      type: "objectLiteral",
    };
  } else if (ts.isArrayLiteralExpression(expression)) {
    return {
      calculator: calculateArrayLiteralExpressionComplexity,
      type: "arrayLiteral",
    };
  }

  // デフォルトの計算関数（基本スコアのみ）
  return {
    calculator: (expr: ts.Expression, ctx: ComplexityContext) => ({
      score: 1,
      nodeType: ts.SyntaxKind[expr.kind],
      children: [],
      lineInfo: getNodeLineInfo(expr, ctx.sourceFile),
    }),
    type: "default",
  };
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
  // 式の種類に基づいて適切な計算関数を選択
  const { calculator, type } = selectExpressionCalculator(expression, context);

  // 選択した関数で複雑度を計算
  const result = calculator(expression, context);

  // メタデータに式のタイプを追加
  if (!result.metadata) {
    result.metadata = {};
  }
  result.metadata.expressionType = type;

  // 行情報が設定されていない場合は追加
  if (!result.lineInfo) {
    result.lineInfo = getNodeLineInfo(expression, context.sourceFile);
  }

  return result;
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
