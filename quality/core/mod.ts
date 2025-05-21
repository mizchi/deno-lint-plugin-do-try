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
  ModuleComplexityResult,
  ModuleDependency,
} from "./complexity/mod.ts";

// 定数をエクスポート
export { DEFAULT_COMPLEXITY_WEIGHTS } from "./types.ts";
export { DEFAULT_COMPLEXITY_OPTIONS } from "./complexity/common.ts";

// コード分析ファサード
import { analyzeCodeComplexity, calculateComplexityScore } from "./metrics.ts";
export { analyzeCodeComplexity, calculateComplexityScore };

// 複雑度計算ファサード
import {
  calculateBlockComplexity,
  calculateCodeComplexity,
  calculateFileComplexity,
  calculateNewExpressionComplexity,
  calculateStatementComplexity,
  createComplexityContext,
} from "./complexity/mod.ts";

export {
  calculateBlockComplexity,
  calculateCodeComplexity,
  calculateFileComplexity,
  calculateNewExpressionComplexity,
  calculateStatementComplexity,
  createComplexityContext,
};

// モジュール分析ファサード
import {
  calculateModuleComplexity,
  calculateModuleFileComplexity,
  calculateModulesComplexity,
  extractHotspots,
  flattenComplexityResult,
  summarizeComplexityResult,
  topologicalSort,
} from "./complexity/mod.ts";

export {
  calculateModuleComplexity,
  calculateModuleFileComplexity,
  calculateModulesComplexity,
  extractHotspots,
  flattenComplexityResult,
  summarizeComplexityResult,
  topologicalSort,
};

// レポート生成ファサード
import {
  generateDetailedComplexityReport,
  generateHotspotReport,
  generateMetricsReport,
} from "./reporter.ts";

import { generateModuleComplexityReport } from "./complexity/mod.ts";

export {
  generateDetailedComplexityReport,
  generateHotspotReport,
  generateMetricsReport,
  generateModuleComplexityReport,
};

// 比較機能ファサード
import {
  compareCodeComplexity,
  generateComparisonReport,
} from "./comparator.ts";

export { compareCodeComplexity, generateComparisonReport };
