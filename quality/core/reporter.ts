/**
 * コード品質計算モジュールのレポート生成
 *
 * このファイルでは、コード複雑度の詳細レポートを生成するための機能を提供します。
 * ファサードパターンを適用し、内部実装の詳細を隠蔽して、必要最小限のAPIのみを公開します。
 */

import {
  type CodeComplexityMetrics,
  type ComplexityWeights,
  DEFAULT_COMPLEXITY_WEIGHTS,
} from "./types.ts";
import { analyzeCodeComplexity, calculateComplexityScore } from "./metrics.ts";

// 内部関数: 複雑度の内訳を計算する
function calculateBreakdown(
  metrics: CodeComplexityMetrics,
  weights: ComplexityWeights,
): Record<string, { value: number; weightedScore: number }> {
  return {
    "変数の変更可能性": {
      value: metrics.variableMutabilityScore,
      weightedScore: metrics.variableMutabilityScore *
        weights.variableMutabilityWeight,
    },
    "スコープの複雑さ": {
      value: metrics.scopeComplexityScore,
      weightedScore: metrics.scopeComplexityScore *
        weights.scopeComplexityWeight,
    },
    "代入操作": {
      value: metrics.assignmentScore,
      weightedScore: metrics.assignmentScore * weights.assignmentWeight,
    },
    "関数の複雑さ": {
      value: metrics.functionComplexityScore,
      weightedScore: metrics.functionComplexityScore *
        weights.functionComplexityWeight,
    },
    "条件分岐の複雑さ": {
      value: metrics.conditionalComplexityScore,
      weightedScore: metrics.conditionalComplexityScore *
        weights.conditionalComplexityWeight,
    },
    "例外処理の複雑さ": {
      value: metrics.exceptionHandlingScore,
      weightedScore: metrics.exceptionHandlingScore *
        weights.exceptionHandlingWeight,
    },
  };
}

/**
 * コード複雑度の詳細レポートを生成する
 * @param code 解析対象のコード
 * @param weights 重み付け設定（省略時はデフォルト設定を使用）
 * @returns 詳細レポート
 */
export function generateDetailedComplexityReport(
  code: string,
  weights: ComplexityWeights = DEFAULT_COMPLEXITY_WEIGHTS,
): {
  metrics: CodeComplexityMetrics;
  score: number;
  breakdown: Record<string, { value: number; weightedScore: number }>;
  hotspots: Array<{
    nodeType: string;
    line: number;
    score: number;
    reason: string;
  }>;
} {
  const metrics = analyzeCodeComplexity(code);
  const score = calculateComplexityScore(metrics, weights);
  const breakdown = calculateBreakdown(metrics, weights);

  return {
    metrics,
    score,
    breakdown,
    hotspots: metrics.hotspots,
  };
}

/**
 * ホットスポットの詳細レポートを生成する
 * @param metrics 複雑度指標
 * @param limit 表示するホットスポットの最大数（省略時は全て）
 * @returns ホットスポットの詳細レポート
 */
export function generateHotspotReport(
  metrics: CodeComplexityMetrics,
  limit?: number,
): string {
  const hotspots = limit ? metrics.hotspots.slice(0, limit) : metrics.hotspots;

  if (hotspots.length === 0) {
    return "ホットスポットはありません。";
  }

  let report = "## コード複雑度のホットスポット\n\n";

  hotspots.forEach((hotspot, index) => {
    report += `${
      index + 1
    }. **${hotspot.nodeType}** (行: ${hotspot.line}): スコア ${
      hotspot.score.toFixed(2)
    }\n`;
    report += `   理由: ${hotspot.reason}\n\n`;
  });

  return report;
}

/**
 * 複雑度指標の詳細レポートを生成する
 * @param metrics 複雑度指標
 * @param weights 重み付け設定（省略時はデフォルト設定を使用）
 * @returns 詳細レポート
 */
export function generateMetricsReport(
  metrics: CodeComplexityMetrics,
  weights: ComplexityWeights = DEFAULT_COMPLEXITY_WEIGHTS,
): string {
  const score = calculateComplexityScore(metrics, weights);
  const breakdown = calculateBreakdown(metrics, weights);

  let report = "## コード複雑度の詳細指標\n\n";
  report += `総合スコア: **${score.toFixed(2)}**\n\n`;
  report += "### 詳細指標の内訳:\n\n";

  for (const [metric, data] of Object.entries(breakdown)) {
    report += `- **${metric}**: ${data.value.toFixed(2)} (重み付けスコア: ${
      data.weightedScore.toFixed(2)
    })\n`;
  }

  return report;
}

// 公開するAPIは以下の3つのみ
// - generateDetailedComplexityReport: コード複雑度の詳細レポートを生成する
// - generateHotspotReport: ホットスポットの詳細レポートを生成する
// - generateMetricsReport: 複雑度指標の詳細レポートを生成する

// 以下の関数は内部実装の詳細であり、外部からは直接アクセスできないようにします
// - calculateBreakdown
