/**
 * リント結果と重み付け設定に基づきスコアを計算
 */

import {
  DEFAULT_RULE_WEIGHTS,
  type LintResult,
  type RuleWeights,
} from "./types.ts";

/**
 * リント結果の配列とルールごとの重み付け設定を受け取り、総合品質スコアを計算する
 * スコアが低いほど品質が良いとみなす
 *
 * @param lintResults リント結果の配列
 * @param ruleWeights ルールごとの重み付け設定（省略時はデフォルト設定を使用）
 * @returns 総合品質スコア（低いほど良い）
 */
export function calculateScore(
  lintResults: LintResult[],
  ruleWeights: RuleWeights = DEFAULT_RULE_WEIGHTS,
): number {
  // リント結果がない場合は最高スコア（0）を返す
  if (lintResults.length === 0) {
    return 0;
  }

  // 各リント結果に対応する重みを合計する
  let totalScore = 0;

  for (const result of lintResults) {
    // ルールIDに対応する重みを取得（未定義の場合はデフォルト値1を使用）
    const weight = ruleWeights[result.rule] || 1;
    totalScore += weight;
  }

  return totalScore;
}

/**
 * リント結果の詳細分析を行い、ルールごとの違反数をカウントする
 *
 * @param lintResults リント結果の配列
 * @returns ルールごとの違反数
 */
export function analyzeRuleViolations(
  lintResults: LintResult[],
): Record<string, number> {
  const violations: Record<string, number> = {};

  for (const result of lintResults) {
    const rule = result.rule;
    violations[rule] = (violations[rule] || 0) + 1;
  }

  return violations;
}

/**
 * 追加の品質指標を含めた総合スコアを計算する
 * 注: 現在はリント結果のみに基づくスコアを返しますが、
 * 将来的には追加指標（循環的複雑度、認知複雑度など）も考慮する予定
 *
 * @param lintResults リント結果の配列
 * @param additionalMetrics 追加の品質指標
 * @param ruleWeights ルールごとの重み付け設定
 * @returns 総合品質スコア
 */
export function calculateComprehensiveScore(
  lintResults: LintResult[],
  _additionalMetrics: Record<string, number> = {},
  ruleWeights: RuleWeights = DEFAULT_RULE_WEIGHTS,
): number {
  // 基本スコア（リント結果に基づく）
  const baseScore = calculateScore(lintResults, ruleWeights);

  // 追加指標に基づくスコア（将来的に実装）
  // 現時点では追加指標は考慮せず、基本スコアをそのまま返す
  return baseScore;

  // 将来的な実装例：
  // const complexityScore = additionalMetrics.cyclomatic_complexity * 0.5;
  // const commentScore = (1 - additionalMetrics.comment_density) * 3;
  // return baseScore + complexityScore + commentScore;
}
