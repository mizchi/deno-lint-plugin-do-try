/**
 * fixtures_test.ts
 *
 * このファイルは、コード品質計算モジュールを使用して各サンプルコードの複雑度を分析し、
 * 結果を表示するテストコードを実装しています。
 */

import {
  analyzeCodeComplexity,
  calculateComplexityScore,
  compareCodeComplexity,
  generateDetailedComplexityReport,
} from "../mod.ts";
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

// サンプルコードを読み込む
const simpleCode = await Deno.readTextFile(
  new URL("./fixtures/simple.ts", import.meta.url).pathname,
);
const mediumCode = await Deno.readTextFile(
  new URL("./fixtures/medium.ts", import.meta.url).pathname,
);
const complexCode = await Deno.readTextFile(
  new URL("./fixtures/complex.ts", import.meta.url).pathname,
);
const compactComplexCode = await Deno.readTextFile(
  new URL("./fixtures/compact_complex.ts", import.meta.url).pathname,
);

// 各サンプルコードの複雑度を分析するテスト
Deno.test("サンプルコードの複雑度分析", () => {
  // 各サンプルコードの複雑度を分析
  const simpleMetrics = analyzeCodeComplexity(simpleCode);
  const mediumMetrics = analyzeCodeComplexity(mediumCode);
  const complexMetrics = analyzeCodeComplexity(complexCode);
  const compactComplexMetrics = analyzeCodeComplexity(compactComplexCode);

  // 各サンプルコードの複雑度スコアを計算
  const simpleScore = calculateComplexityScore(simpleMetrics);
  const mediumScore = calculateComplexityScore(mediumMetrics);
  const complexScore = calculateComplexityScore(complexMetrics);
  const compactComplexScore = calculateComplexityScore(compactComplexMetrics);

  // 結果を表示
  console.log("\n=== サンプルコードの複雑度分析結果 ===");

  console.log("\n--- simple.ts (低複雑度) ---");
  console.log(`総合スコア: ${simpleScore.toFixed(2)}`);
  console.log("詳細指標:");
  console.log(
    `- 変数の変更可能性: ${simpleMetrics.variableMutabilityScore.toFixed(2)}`,
  );
  console.log(
    `- スコープの複雑さ: ${simpleMetrics.scopeComplexityScore.toFixed(2)}`,
  );
  console.log(`- 代入操作: ${simpleMetrics.assignmentScore.toFixed(2)}`);
  console.log(
    `- 関数の複雑さ: ${simpleMetrics.functionComplexityScore.toFixed(2)}`,
  );
  console.log(
    `- 条件分岐の複雑さ: ${
      simpleMetrics.conditionalComplexityScore.toFixed(2)
    }`,
  );
  console.log(
    `- 例外処理の複雑さ: ${simpleMetrics.exceptionHandlingScore.toFixed(2)}`,
  );

  console.log("\n--- medium.ts (中複雑度) ---");
  console.log(`総合スコア: ${mediumScore.toFixed(2)}`);
  console.log("詳細指標:");
  console.log(
    `- 変数の変更可能性: ${mediumMetrics.variableMutabilityScore.toFixed(2)}`,
  );
  console.log(
    `- スコープの複雑さ: ${mediumMetrics.scopeComplexityScore.toFixed(2)}`,
  );
  console.log(`- 代入操作: ${mediumMetrics.assignmentScore.toFixed(2)}`);
  console.log(
    `- 関数の複雑さ: ${mediumMetrics.functionComplexityScore.toFixed(2)}`,
  );
  console.log(
    `- 条件分岐の複雑さ: ${
      mediumMetrics.conditionalComplexityScore.toFixed(2)
    }`,
  );
  console.log(
    `- 例外処理の複雑さ: ${mediumMetrics.exceptionHandlingScore.toFixed(2)}`,
  );

  console.log("\n--- complex.ts (高複雑度) ---");
  console.log(`総合スコア: ${complexScore.toFixed(2)}`);
  console.log("詳細指標:");
  console.log(
    `- 変数の変更可能性: ${complexMetrics.variableMutabilityScore.toFixed(2)}`,
  );
  console.log(
    `- スコープの複雑さ: ${complexMetrics.scopeComplexityScore.toFixed(2)}`,
  );
  console.log(`- 代入操作: ${complexMetrics.assignmentScore.toFixed(2)}`);
  console.log(
    `- 関数の複雑さ: ${complexMetrics.functionComplexityScore.toFixed(2)}`,
  );
  console.log(
    `- 条件分岐の複雑さ: ${
      complexMetrics.conditionalComplexityScore.toFixed(2)
    }`,
  );
  console.log(
    `- 例外処理の複雑さ: ${complexMetrics.exceptionHandlingScore.toFixed(2)}`,
  );

  console.log("\n--- compact_complex.ts (コンパクトな高複雑度) ---");
  console.log(`総合スコア: ${compactComplexScore.toFixed(2)}`);
  console.log("詳細指標:");
  console.log(
    `- 変数の変更可能性: ${
      compactComplexMetrics.variableMutabilityScore.toFixed(2)
    }`,
  );
  console.log(
    `- スコープの複雑さ: ${
      compactComplexMetrics.scopeComplexityScore.toFixed(2)
    }`,
  );
  console.log(
    `- 代入操作: ${compactComplexMetrics.assignmentScore.toFixed(2)}`,
  );
  console.log(
    `- 関数の複雑さ: ${
      compactComplexMetrics.functionComplexityScore.toFixed(2)
    }`,
  );
  console.log(
    `- 条件分岐の複雑さ: ${
      compactComplexMetrics.conditionalComplexityScore.toFixed(2)
    }`,
  );
  console.log(
    `- 例外処理の複雑さ: ${
      compactComplexMetrics.exceptionHandlingScore.toFixed(2)
    }`,
  );

  // 複雑度の順序を検証
  console.log("\n=== 複雑度の比較 ===");

  // simple.ts vs medium.ts
  const comparisonSimpleMedium = compareCodeComplexity(simpleCode, mediumCode);
  console.log("\n--- simple.ts vs medium.ts ---");
  console.log(`simple.tsのスコア: ${comparisonSimpleMedium.scoreA.toFixed(2)}`);
  console.log(`medium.tsのスコア: ${comparisonSimpleMedium.scoreB.toFixed(2)}`);
  console.log(`優れているコード: ${comparisonSimpleMedium.betterCode}`);

  // medium.ts vs complex.ts
  const comparisonMediumComplex = compareCodeComplexity(
    mediumCode,
    complexCode,
  );
  console.log("\n--- medium.ts vs complex.ts ---");
  console.log(
    `medium.tsのスコア: ${comparisonMediumComplex.scoreA.toFixed(2)}`,
  );
  console.log(
    `complex.tsのスコア: ${comparisonMediumComplex.scoreB.toFixed(2)}`,
  );
  console.log(`優れているコード: ${comparisonMediumComplex.betterCode}`);

  // simple.ts vs complex.ts
  const comparisonSimpleComplex = compareCodeComplexity(
    simpleCode,
    complexCode,
  );
  console.log("\n--- simple.ts vs complex.ts ---");
  console.log(
    `simple.tsのスコア: ${comparisonSimpleComplex.scoreA.toFixed(2)}`,
  );
  console.log(
    `complex.tsのスコア: ${comparisonSimpleComplex.scoreB.toFixed(2)}`,
  );
  console.log(`優れているコード: ${comparisonSimpleComplex.betterCode}`);

  // 複雑度の順序を検証
  assertEquals(
    simpleScore < mediumScore,
    true,
    "simple.tsはmedium.tsより複雑度が低いはず",
  );
  assertEquals(
    mediumScore < complexScore,
    true,
    "medium.tsはcomplex.tsより複雑度が低いはず",
  );
  assertEquals(
    simpleScore < complexScore,
    true,
    "simple.tsはcomplex.tsより複雑度が低いはず",
  );
});

// 詳細な複雑度レポートを生成するテスト
Deno.test("詳細な複雑度レポートの生成", () => {
  // 各サンプルコードの詳細レポートを生成
  const simpleReport = generateDetailedComplexityReport(simpleCode);
  const mediumReport = generateDetailedComplexityReport(mediumCode);
  const complexReport = generateDetailedComplexityReport(complexCode);
  const compactComplexReport = generateDetailedComplexityReport(
    compactComplexCode,
  );

  // 結果を表示
  console.log("\n=== 詳細な複雑度レポート ===");

  console.log("\n--- simple.ts (低複雑度) ---");
  console.log(`総合スコア: ${simpleReport.score.toFixed(2)}`);
  console.log("詳細指標の内訳:");
  for (const [metric, data] of Object.entries(simpleReport.breakdown)) {
    console.log(
      `- ${metric}: ${data.value.toFixed(2)} (重み付けスコア: ${
        data.weightedScore.toFixed(2)
      })`,
    );
  }

  console.log("\n--- medium.ts (中複雑度) ---");
  console.log(`総合スコア: ${mediumReport.score.toFixed(2)}`);
  console.log("詳細指標の内訳:");
  for (const [metric, data] of Object.entries(mediumReport.breakdown)) {
    console.log(
      `- ${metric}: ${data.value.toFixed(2)} (重み付けスコア: ${
        data.weightedScore.toFixed(2)
      })`,
    );
  }

  console.log("\n--- complex.ts (高複雑度) ---");
  console.log(`総合スコア: ${complexReport.score.toFixed(2)}`);
  console.log("詳細指標の内訳:");
  for (const [metric, data] of Object.entries(complexReport.breakdown)) {
    console.log(
      `- ${metric}: ${data.value.toFixed(2)} (重み付けスコア: ${
        data.weightedScore.toFixed(2)
      })`,
    );
  }

  // 各サンプルコードのホットスポットを表示
  console.log("\n--- compact_complex.ts (コンパクトな高複雑度) ---");
  console.log(`総合スコア: ${compactComplexReport.score.toFixed(2)}`);
  console.log("詳細指標の内訳:");
  for (const [metric, data] of Object.entries(compactComplexReport.breakdown)) {
    console.log(
      `- ${metric}: ${data.value.toFixed(2)} (重み付けスコア: ${
        data.weightedScore.toFixed(2)
      })`,
    );
  }

  console.log("\n=== ホットスポット分析 ===");

  console.log("\n--- simple.ts (低複雑度) のホットスポット ---");
  if (simpleReport.hotspots.length > 0) {
    simpleReport.hotspots.slice(0, 3).forEach((hotspot, index) => {
      console.log(
        `${index + 1}. ${hotspot.nodeType} (行: ${hotspot.line}): スコア ${
          hotspot.score.toFixed(2)
        }`,
      );
      console.log(`   理由: ${hotspot.reason}`);
    });
  } else {
    console.log("ホットスポットはありません");
  }

  console.log("\n--- medium.ts (中複雑度) のホットスポット ---");
  if (mediumReport.hotspots.length > 0) {
    mediumReport.hotspots.slice(0, 3).forEach((hotspot, index) => {
      console.log(
        `${index + 1}. ${hotspot.nodeType} (行: ${hotspot.line}): スコア ${
          hotspot.score.toFixed(2)
        }`,
      );
      console.log(`   理由: ${hotspot.reason}`);
    });
  } else {
    console.log("ホットスポットはありません");
  }

  console.log("\n--- complex.ts (高複雑度) のホットスポット ---");
  if (complexReport.hotspots.length > 0) {
    complexReport.hotspots.slice(0, 3).forEach((hotspot, index) => {
      console.log(
        `${index + 1}. ${hotspot.nodeType} (行: ${hotspot.line}): スコア ${
          hotspot.score.toFixed(2)
        }`,
      );
      console.log(`   理由: ${hotspot.reason}`);
    });
  } else {
    console.log("ホットスポットはありません");
  }

  console.log(
    "\n--- compact_complex.ts (コンパクトな高複雑度) のホットスポット ---",
  );
  if (compactComplexReport.hotspots.length > 0) {
    compactComplexReport.hotspots.slice(0, 3).forEach((hotspot, index) => {
      console.log(
        `${index + 1}. ${hotspot.nodeType} (行: ${hotspot.line}): スコア ${
          hotspot.score.toFixed(2)
        }`,
      );
      console.log(`   理由: ${hotspot.reason}`);
    });
  } else {
    console.log("ホットスポットはありません");
  }
});

// メイン関数（直接実行された場合）
if (import.meta.main) {
  console.log(
    "コード品質計算モジュールテスト用サンプルコードの分析を開始します...",
  );

  // 分析を直接実行
  const simpleMetrics = analyzeCodeComplexity(simpleCode);
  const mediumMetrics = analyzeCodeComplexity(mediumCode);
  const complexMetrics = analyzeCodeComplexity(complexCode);
  const compactComplexMetrics = analyzeCodeComplexity(compactComplexCode);

  const simpleScore = calculateComplexityScore(simpleMetrics);
  const mediumScore = calculateComplexityScore(mediumMetrics);
  const complexScore = calculateComplexityScore(complexMetrics);
  const compactComplexScore = calculateComplexityScore(compactComplexMetrics);

  console.log("\n=== サンプルコードの複雑度分析結果 ===");

  console.log("\n--- simple.ts (低複雑度) ---");
  console.log(`総合スコア: ${simpleScore.toFixed(2)}`);

  console.log("\n--- medium.ts (中複雑度) ---");
  console.log(`総合スコア: ${mediumScore.toFixed(2)}`);

  console.log("\n--- complex.ts (高複雑度) ---");
  console.log(`総合スコア: ${complexScore.toFixed(2)}`);

  console.log("\n--- compact_complex.ts (コンパクトな高複雑度) ---");
  console.log(`総合スコア: ${compactComplexScore.toFixed(2)}`);

  console.log("\n分析が完了しました。");
}
