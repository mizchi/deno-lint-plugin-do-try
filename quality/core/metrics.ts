/**
 * コード品質計算モジュールのメトリクス計算
 *
 * このファイルでは、コードの複雑度指標を計算するための機能を提供します。
 * ファサードパターンを適用し、内部実装の詳細を隠蔽して、必要最小限のAPIのみを公開します。
 */

// TypeScriptコンパイラを使用
import ts from "npm:typescript";
import {
  type CodeComplexityMetrics,
  type ComplexityWeights,
  DEFAULT_COMPLEXITY_WEIGHTS,
  type VariableMutationMap,
} from "./types.ts";
import {
  createSourceFile,
  trackVariableMutations,
  visitNode,
} from "./parser.ts";

// 内部関数: コード複雑度の指標を初期化する
function initializeMetrics(): CodeComplexityMetrics {
  return {
    totalScore: 1, // 基本スコアは1から開始
    variableMutabilityScore: 0,
    scopeComplexityScore: 0,
    assignmentScore: 0,
    functionComplexityScore: 0,
    conditionalComplexityScore: 0,
    exceptionHandlingScore: 0,
    hotspots: [],
  };
}

// 内部関数: 複雑度の高いホットスポットを追加する
function addHotspot(
  metrics: CodeComplexityMetrics,
  node: ts.Node,
  sourceFile: ts.SourceFile,
  score: number,
  reason: string,
): void {
  // スコアが一定以上の場合のみホットスポットとして記録
  if (score >= 3) {
    const line =
      sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
    metrics.hotspots.push({
      nodeType: ts.SyntaxKind[node.kind],
      line,
      score,
      reason,
    });
  }
}

// 内部関数: 式の複雑さを計算する（子ノードの累計）
function calculateExpressionComplexity(
  expression: ts.Expression,
): number {
  let complexity = 1; // 基本スコア

  // 二項演算子を使用した式
  if (ts.isBinaryExpression(expression)) {
    // 左辺と右辺の複雑さを再帰的に計算して合計（子ノードの累計）
    complexity += calculateExpressionComplexity(expression.left);
    complexity += calculateExpressionComplexity(expression.right);

    // 演算子の種類に応じて追加スコア
    if (
      expression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
      expression.operatorToken.kind === ts.SyntaxKind.BarBarToken
    ) {
      // 論理演算子は複雑さが高い
      complexity += 0.5;
    } else if (
      [
        ts.SyntaxKind.EqualsEqualsToken,
        ts.SyntaxKind.EqualsEqualsEqualsToken,
        ts.SyntaxKind.ExclamationEqualsToken,
        ts.SyntaxKind.ExclamationEqualsEqualsToken,
        ts.SyntaxKind.LessThanToken,
        ts.SyntaxKind.LessThanEqualsToken,
        ts.SyntaxKind.GreaterThanToken,
        ts.SyntaxKind.GreaterThanEqualsToken,
      ].includes(expression.operatorToken.kind)
    ) {
      // 比較演算子
      complexity += 0.3;
    }
  } // 前置単項演算子
  else if (ts.isPrefixUnaryExpression(expression)) {
    complexity += calculateExpressionComplexity(expression.operand);

    // 否定演算子は複雑さを増す
    if (expression.operator === ts.SyntaxKind.ExclamationToken) {
      complexity += 0.3;
    }
  } // 後置単項演算子
  else if (ts.isPostfixUnaryExpression(expression)) {
    complexity += calculateExpressionComplexity(expression.operand);
  } // 三項演算子
  else if (ts.isConditionalExpression(expression)) {
    complexity += calculateExpressionComplexity(expression.condition);
    complexity += calculateExpressionComplexity(expression.whenTrue);
    complexity += calculateExpressionComplexity(expression.whenFalse);
    complexity += 1; // 三項演算子自体の複雑さ
  } // 関数呼び出し
  else if (ts.isCallExpression(expression)) {
    // 関数名の複雑さ
    complexity += calculateExpressionComplexity(expression.expression);

    // 引数の複雑さを累計
    for (const arg of expression.arguments) {
      complexity += calculateExpressionComplexity(arg as ts.Expression);
    }
  } // プロパティアクセス
  else if (ts.isPropertyAccessExpression(expression)) {
    complexity += calculateExpressionComplexity(expression.expression);
  } // 配列要素アクセス
  else if (ts.isElementAccessExpression(expression)) {
    complexity += calculateExpressionComplexity(expression.expression);
    complexity += calculateExpressionComplexity(expression.argumentExpression);
  }

  return complexity;
}

/**
 * コードを解析して複雑度指標を計算する
 * @param code 解析対象のコード
 * @returns 計算された複雑度指標
 */
export function analyzeCodeComplexity(code: string): CodeComplexityMetrics {
  const sourceFile = createSourceFile(code);
  const metrics = initializeMetrics();
  const mutationMap: VariableMutationMap = new Map();

  // 変数の変更回数を追跡
  trackVariableMutations(sourceFile, mutationMap);

  // ASTを走査して指標を計算
  visitNode(
    sourceFile,
    metrics,
    sourceFile,
    mutationMap,
    addHotspot,
    calculateExpressionComplexity,
  );

  // ホットスポットをスコアの降順でソート
  metrics.hotspots.sort((a, b) => b.score - a.score);

  return metrics;
}

/**
 * 複雑度指標に基づいてスコアを計算する
 * @param metrics 複雑度指標
 * @param weights 重み付け設定（省略時はデフォルト設定を使用）
 * @returns 計算されたスコア（低いほど良い）
 */
export function calculateComplexityScore(
  metrics: CodeComplexityMetrics,
  weights: ComplexityWeights = DEFAULT_COMPLEXITY_WEIGHTS,
): number {
  return (
    metrics.variableMutabilityScore * weights.variableMutabilityWeight +
    metrics.scopeComplexityScore * weights.scopeComplexityWeight +
    metrics.assignmentScore * weights.assignmentWeight +
    metrics.functionComplexityScore * weights.functionComplexityWeight +
    metrics.conditionalComplexityScore * weights.conditionalComplexityWeight +
    metrics.exceptionHandlingScore * weights.exceptionHandlingWeight
  );
}

// 公開するAPIは以下の2つのみ
// - analyzeCodeComplexity: コードを解析して複雑度指標を計算する
// - calculateComplexityScore: 複雑度指標に基づいてスコアを計算する

// 以下の関数は内部実装の詳細であり、外部からは直接アクセスできないようにします
// - initializeMetrics
// - addHotspot
// - calculateExpressionComplexity
// - calculateConditionalComplexity
