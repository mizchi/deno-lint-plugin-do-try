/**
 * コード品質計算モジュールのコアエントリーポイント
 *
 * このファイルでは、コード品質計算モジュールのコア機能をエクスポートします。
 * ファサードパターンを適用し、内部実装の詳細を隠蔽して、必要最小限のAPIのみを公開します。
 */

// 型定義をエクスポート
export type {
  CodeComplexityMetrics,
  ComplexityComparisonResult,
  ComplexityWeights,
} from "./types.ts";

export type {
  ComplexityContext,
  ComplexityOptions,
  ComplexityResult,
} from "./complexity/common.ts";

// 追加の型定義を直接インポート
export type {
  ModuleComplexityResult,
  ModuleDependency,
} from "./complexity/module.ts";

// 定数をエクスポート
export { DEFAULT_COMPLEXITY_WEIGHTS } from "./types.ts";
export { DEFAULT_COMPLEXITY_OPTIONS } from "./complexity/common.ts";

// コード分析ファサード
import { analyzeCodeComplexity, calculateComplexityScore } from "./metrics.ts";
export { analyzeCodeComplexity, calculateComplexityScore };

// 複雑度計算ファサード - calculateNodeComplexity をメインのエントリーポイントとして使用
import { calculateNodeComplexity } from "./complexity/mod.ts";

export { calculateNodeComplexity };

// モジュール分析とユーティリティファサード - 直接インポート
// import {
//   extractHotspots,
//   flattenComplexityResult,
//   summarizeComplexityResult,
// } from "./complexity/utils.ts";

// export { extractHotspots, flattenComplexityResult, summarizeComplexityResult };

// レポート生成ファサード
import {
  generateDetailedComplexityReport,
  generateHotspotReport,
  generateMetricsReport,
} from "./reporter.ts";

// import { generateModuleComplexityReport } from "./complexity/module.ts";

export {
  generateDetailedComplexityReport,
  generateHotspotReport,
  generateMetricsReport,
  // generateModuleComplexityReport,
};

// 比較機能ファサード
import {
  compareCodeComplexity,
  generateComparisonReport,
} from "./comparator.ts";

export { compareCodeComplexity, generateComparisonReport };

export {
  createComplexityContext,
  extractHotspots,
  flattenComplexityResult,
} from "./complexity.ts";
