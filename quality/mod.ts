/**
 * コード品質計算モジュール
 *
 * このファイルでは、コード品質計算モジュールの機能をエクスポートします。
 */

// 型定義をエクスポート
export type {
  CodeComplexityMetrics,
  ComplexityComparisonResult,
  // 複雑度計算の型定義
  ComplexityContext,
  ComplexityOptions,
  ComplexityResult,
  ComplexityWeights,
  // モジュール複雑度計算の型定義
  ModuleComplexityResult,
  ModuleDependency,
} from "./core/mod.ts";

// 定数をエクスポート
export {
  // 複雑度計算のデフォルト設定
  DEFAULT_COMPLEXITY_OPTIONS,
  DEFAULT_COMPLEXITY_WEIGHTS,
} from "./core/mod.ts";

// 関数をエクスポート
export {
  // 主要な関数
  analyzeCodeComplexity,
  // 複雑度計算の関数
  calculateBlockComplexity,
  calculateCodeComplexity,
  calculateComplexityScore,
  calculateFileComplexity,
  calculateModuleComplexity,
  calculateModuleFileComplexity,
  calculateModulesComplexity,
  calculateNewExpressionComplexity,
  calculateStatementComplexity,
  compareCodeComplexity,
  createComplexityContext,
  extractHotspots,
  flattenComplexityResult,
  generateComparisonReport,
  generateDetailedComplexityReport,
  // 追加の関数
  generateHotspotReport,
  generateMetricsReport,
  generateModuleComplexityReport,
  // 新しく追加した関数
  summarizeComplexityResult,
  topologicalSort,
} from "./core/mod.ts";
