/**
 * コード品質計算モジュール
 *
 * このファイルでは、コード品質計算モジュールの機能をエクスポートします。
 * core/mod.ts からエクスポートされた関数を単純に再エクスポートします。
 */

// 型定義をエクスポート
export type {
  CodeComplexityMetrics,
  ComplexityComparisonResult,
  ComplexityContext,
  ComplexityOptions,
  ComplexityResult,
  ComplexityWeights,
  ModuleComplexityResult,
  ModuleDependency,
} from "./core/mod.ts";

// 定数をエクスポート
export {
  DEFAULT_COMPLEXITY_OPTIONS,
  DEFAULT_COMPLEXITY_WEIGHTS,
} from "./core/mod.ts";

// コア機能をエクスポート
export {
  // 複雑度分析 - calculateNodeComplexity をメインのファサード関数として使用
  analyzeCodeComplexity,
  calculateComplexityScore,
  calculateNodeComplexity,
  // 比較機能
  compareCodeComplexity,
  // ユーティリティ
  // レポート生成
  generateComparisonReport,
  generateDetailedComplexityReport,
  generateHotspotReport,
  generateMetricsReport,
} from "./core/mod.ts";
