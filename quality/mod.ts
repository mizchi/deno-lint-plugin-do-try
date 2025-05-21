/**
 * コード品質計算モジュール
 *
 * このファイルでは、コード品質計算モジュールの機能をエクスポートします。
 */

// 型定義をエクスポート
export type {
  CodeComplexityMetrics,
  ComplexityComparisonResult,
  ComplexityWeights,
} from "./core/mod.ts";

// 定数をエクスポート
export { DEFAULT_COMPLEXITY_WEIGHTS } from "./core/mod.ts";

// 関数をエクスポート
export {
  // 主要な関数
  analyzeCodeComplexity,
  calculateComplexityScore,
  compareCodeComplexity,
  generateComparisonReport,
  generateDetailedComplexityReport,
  // 追加の関数
  generateHotspotReport,
  generateMetricsReport,
} from "./core/mod.ts";
