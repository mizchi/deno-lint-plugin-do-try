/**
 * コード品質計算モジュールのコアエントリーポイント
 *
 * このファイルでは、コード品質計算モジュールのコア機能をエクスポートします。
 */

// 型定義をエクスポート
export * from "./types.ts";

// パーサー関連の機能をエクスポート
export {
  countScopeSymbols,
  createSourceFile,
  trackVariableMutations,
  visitNode,
} from "./parser.ts";

// メトリクス計算関連の機能をエクスポート
export {
  addHotspot,
  analyzeCodeComplexity,
  calculateComplexityScore,
  calculateConditionalComplexity,
  calculateExpressionComplexity,
  initializeMetrics,
} from "./metrics.ts";

// レポート生成関連の機能をエクスポート
export {
  generateDetailedComplexityReport,
  generateHotspotReport,
  generateMetricsReport,
} from "./reporter.ts";

// 比較機能をエクスポート
export {
  compareCodeComplexity,
  generateComparisonReport,
} from "./comparator.ts";

// 複雑度計算機能をエクスポート
export {
  calculateBlockComplexity,
  calculateCodeComplexity,
  calculateFileComplexity,
  calculateNewExpressionComplexity,
  calculateStatementComplexity,
  createComplexityContext,
  DEFAULT_COMPLEXITY_OPTIONS,
  extractHotspots,
  flattenComplexityResult,
  summarizeComplexityResult,
} from "./complexity/mod.ts";

// 複雑度計算の型定義をエクスポート
export type {
  ComplexityContext,
  ComplexityOptions,
  ComplexityResult,
} from "./complexity/mod.ts";
