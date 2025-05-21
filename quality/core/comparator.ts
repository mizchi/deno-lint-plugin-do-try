/**
 * コード品質計算モジュールの比較機能
 *
 * このファイルでは、2つのコードの複雑度を比較するための機能を提供します。
 * ファサードパターンを適用し、内部実装の詳細を隠蔽して、必要最小限のAPIのみを公開します。
 */

import {
  CodeComplexityMetrics,
  ComplexityComparisonResult,
  ComplexityWeights,
  DEFAULT_COMPLEXITY_WEIGHTS,
} from "./types.ts";
import { analyzeCodeComplexity, calculateComplexityScore } from "./metrics.ts";

// 内部関数: 比較結果からレポートを生成する
function generateComparisonTable(
  comparison: ComplexityComparisonResult,
  nameA: string,
  nameB: string,
): string {
  let table = "| 指標 | " + nameA + " | " + nameB + " |\n";
  table += "|------|" + "-".repeat(nameA.length) + "|" +
    "-".repeat(nameB.length) + "|\n";

  table += `| 変数の変更可能性 | ${
    comparison.metricsA.variableMutabilityScore.toFixed(2)
  } | ${comparison.metricsB.variableMutabilityScore.toFixed(2)} |\n`;
  table += `| スコープの複雑さ | ${
    comparison.metricsA.scopeComplexityScore.toFixed(2)
  } | ${comparison.metricsB.scopeComplexityScore.toFixed(2)} |\n`;
  table += `| 代入操作 | ${comparison.metricsA.assignmentScore.toFixed(2)} | ${
    comparison.metricsB.assignmentScore.toFixed(2)
  } |\n`;
  table += `| 関数の複雑さ | ${
    comparison.metricsA.functionComplexityScore.toFixed(2)
  } | ${comparison.metricsB.functionComplexityScore.toFixed(2)} |\n`;
  table += `| 条件分岐の複雑さ | ${
    comparison.metricsA.conditionalComplexityScore.toFixed(2)
  } | ${comparison.metricsB.conditionalComplexityScore.toFixed(2)} |\n`;
  table += `| 例外処理の複雑さ | ${
    comparison.metricsA.exceptionHandlingScore.toFixed(2)
  } | ${comparison.metricsB.exceptionHandlingScore.toFixed(2)} |\n`;

  return table;
}

/**
 * 2つのコードの複雑度を比較する
 * @param codeA 比較対象のコードA
 * @param codeB 比較対象のコードB
 * @param weights 重み付け設定（省略時はデフォルト設定を使用）
 * @returns 比較結果
 */
export function compareCodeComplexity(
  codeA: string,
  codeB: string,
  weights: ComplexityWeights = DEFAULT_COMPLEXITY_WEIGHTS,
): ComplexityComparisonResult {
  const metricsA = analyzeCodeComplexity(codeA);
  const metricsB = analyzeCodeComplexity(codeB);

  const scoreA = calculateComplexityScore(metricsA, weights);
  const scoreB = calculateComplexityScore(metricsB, weights);

  let betterCode: "A" | "B" | "NEITHER";

  if (scoreA < scoreB) {
    betterCode = "A";
  } else if (scoreB < scoreA) {
    betterCode = "B";
  } else {
    betterCode = "NEITHER";
  }

  return {
    metricsA,
    metricsB,
    scoreA,
    scoreB,
    betterCode,
  };
}

/**
 * 2つのコードの複雑度比較レポートを生成する
 * @param codeA 比較対象のコードA
 * @param codeB 比較対象のコードB
 * @param nameA コードAの名前（省略時は「コードA」）
 * @param nameB コードBの名前（省略時は「コードB」）
 * @param weights 重み付け設定（省略時はデフォルト設定を使用）
 * @returns 比較レポート
 */
export function generateComparisonReport(
  codeA: string,
  codeB: string,
  nameA: string = "コードA",
  nameB: string = "コードB",
  weights: ComplexityWeights = DEFAULT_COMPLEXITY_WEIGHTS,
): string {
  const comparison = compareCodeComplexity(codeA, codeB, weights);

  let report = `## ${nameA} と ${nameB} の複雑度比較\n\n`;

  report += `${nameA} のスコア: **${comparison.scoreA.toFixed(2)}**\n`;
  report += `${nameB} のスコア: **${comparison.scoreB.toFixed(2)}**\n\n`;

  if (comparison.betterCode === "A") {
    report += `**結果**: ${nameA} の方が複雑度が低く、より良いコードです。\n`;
  } else if (comparison.betterCode === "B") {
    report += `**結果**: ${nameB} の方が複雑度が低く、より良いコードです。\n`;
  } else {
    report += `**結果**: 両方のコードの複雑度は同等です。\n`;
  }

  report += "\n### 詳細な比較\n\n";
  report += generateComparisonTable(comparison, nameA, nameB);

  return report;
}

// 公開するAPIは以下の2つのみ
// - compareCodeComplexity: 2つのコードの複雑度を比較する
// - generateComparisonReport: 2つのコードの複雑度比較レポートを生成する

// 以下の関数は内部実装の詳細であり、外部からは直接アクセスできないようにします
// - generateComparisonTable
