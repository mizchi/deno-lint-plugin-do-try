/**
 * コード品質計算モジュールの型定義
 *
 * このファイルでは、コード品質計算モジュールで使用される型定義を提供します。
 */

// TypeScriptコンパイラを使用
import ts from "npm:typescript";

/**
 * コード複雑度の指標を表すインターフェース
 */
export interface CodeComplexityMetrics {
  // 基本スコア
  totalScore: number;

  // 詳細スコア
  variableMutabilityScore: number; // 変数の変更可能性によるスコア
  scopeComplexityScore: number; // スコープの複雑さによるスコア
  assignmentScore: number; // 代入操作によるスコア
  functionComplexityScore: number; // 関数の複雑さによるスコア
  conditionalComplexityScore: number; // 条件分岐によるスコア
  exceptionHandlingScore: number; // 例外処理によるスコア

  // 詳細情報
  hotspots: Array<{
    nodeType: string;
    line: number;
    score: number;
    reason: string;
  }>;
}

/**
 * 複雑度の重み付け設定
 */
export interface ComplexityWeights {
  variableMutabilityWeight: number;
  scopeComplexityWeight: number;
  assignmentWeight: number;
  functionComplexityWeight: number;
  conditionalComplexityWeight: number;
  exceptionHandlingWeight: number;
}

/**
 * デフォルトの重み付け設定
 */
export const DEFAULT_COMPLEXITY_WEIGHTS: ComplexityWeights = {
  variableMutabilityWeight: 1.5,
  scopeComplexityWeight: 1.0,
  assignmentWeight: 1.2,
  functionComplexityWeight: 1.0,
  conditionalComplexityWeight: 2.0,
  exceptionHandlingWeight: 1.5,
};

/**
 * コード複雑度の比較結果
 */
export interface ComplexityComparisonResult {
  metricsA: CodeComplexityMetrics;
  metricsB: CodeComplexityMetrics;
  scoreA: number;
  scoreB: number;
  betterCode: "A" | "B" | "NEITHER";
}

/**
 * 変数の変更回数を追跡するためのマップ
 */
export type VariableMutationMap = Map<string, number>;
