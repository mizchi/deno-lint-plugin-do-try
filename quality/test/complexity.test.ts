/**
 * complexity_test.ts
 *
 * このファイルは、新しい複雑度計算モジュールをテストするためのコードを実装しています。
 */

import {
  calculateBlockComplexity,
  calculateCodeComplexity,
  calculateNewExpressionComplexity,
  calculateStatementComplexity,
  createComplexityContext,
  extractHotspots,
  flattenComplexityResult,
  summarizeComplexityResult,
} from "../core/mod.ts";
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import ts from "npm:typescript";

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

// 新しい複雑度計算モジュールのテスト
Deno.test("新しい複雑度計算モジュールのテスト", () => {
  // 各サンプルコードの複雑度を計算
  const simpleResult = calculateCodeComplexity(simpleCode);
  const mediumResult = calculateCodeComplexity(mediumCode);
  const complexResult = calculateCodeComplexity(complexCode);

  // 結果を表示
  console.log("\n=== 新しい複雑度計算モジュールの分析結果 ===");

  console.log("\n--- simple.ts (低複雑度) ---");
  console.log(`総合スコア: ${simpleResult.score.toFixed(2)}`);
  console.log(`ノードタイプ: ${simpleResult.nodeType}`);
  console.log(`子ノード数: ${simpleResult.children.length}`);

  // 詳細情報を出力
  console.log("--- simple.ts の詳細情報 ---");
  const simpleFlattened = flattenComplexityResult(simpleResult);
  console.log(`ノード総数: ${simpleFlattened.length}`);
  console.log("上位5つのノード:");
  simpleFlattened
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .forEach((node, i) => {
      console.log(
        `${i + 1}. ${node.nodeType} (スコア: ${node.score.toFixed(2)})`,
      );
      if (node.lineInfo) {
        console.log(
          `   行: ${node.lineInfo.startLine}-${node.lineInfo.endLine}`,
        );
      }
    });

  console.log("\n--- medium.ts (中複雑度) ---");
  console.log(`総合スコア: ${mediumResult.score.toFixed(2)}`);
  console.log(`ノードタイプ: ${mediumResult.nodeType}`);
  console.log(`子ノード数: ${mediumResult.children.length}`);

  // 詳細情報を出力
  console.log("--- medium.ts の詳細情報 ---");
  const mediumFlattened = flattenComplexityResult(mediumResult);
  console.log(`ノード総数: ${mediumFlattened.length}`);
  console.log("上位5つのノード:");
  mediumFlattened
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .forEach((node, i) => {
      console.log(
        `${i + 1}. ${node.nodeType} (スコア: ${node.score.toFixed(2)})`,
      );
      if (node.lineInfo) {
        console.log(
          `   行: ${node.lineInfo.startLine}-${node.lineInfo.endLine}`,
        );
      }
    });

  console.log("\n--- complex.ts (高複雑度) ---");
  console.log(`総合スコア: ${complexResult.score.toFixed(2)}`);
  console.log(`ノードタイプ: ${complexResult.nodeType}`);
  console.log(`子ノード数: ${complexResult.children.length}`);

  // 詳細情報を出力
  console.log("--- complex.ts の詳細情報 ---");
  const complexFlattened = flattenComplexityResult(complexResult);
  console.log(`ノード総数: ${complexFlattened.length}`);
  console.log("上位5つのノード:");
  complexFlattened
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .forEach((node, i) => {
      console.log(
        `${i + 1}. ${node.nodeType} (スコア: ${node.score.toFixed(2)})`,
      );
      if (node.lineInfo) {
        console.log(
          `   行: ${node.lineInfo.startLine}-${node.lineInfo.endLine}`,
        );
      }
    });

  // 問題の診断
  console.log("\n=== 複雑度計算の問題診断 ===");
  console.log(`simple.ts スコア: ${simpleResult.score.toFixed(2)}`);
  console.log(`medium.ts スコア: ${mediumResult.score.toFixed(2)}`);
  console.log(`complex.ts スコア: ${complexResult.score.toFixed(2)}`);

  if (simpleResult.score > mediumResult.score) {
    console.log("警告: simple.tsの複雑度がmedium.tsより高くなっています");
    console.log("期待: simple.ts < medium.ts < complex.ts");
    console.log("実際: medium.ts < simple.ts < complex.ts");
  }

  // 複雑度の順序を検証
  assertEquals(
    simpleResult.score < mediumResult.score,
    true,
    "simple.tsはmedium.tsより複雑度が低いはず",
  );
  assertEquals(
    mediumResult.score < complexResult.score,
    true,
    "medium.tsはcomplex.tsより複雑度が低いはず",
  );
  assertEquals(
    simpleResult.score < complexResult.score,
    true,
    "simple.tsはcomplex.tsより複雑度が低いはず",
  );
});

// ホットスポット抽出のテスト
Deno.test("ホットスポット抽出のテスト", () => {
  // 複雑なコードの複雑度を計算
  const complexResult = calculateCodeComplexity(complexCode);

  // ホットスポットを抽出（閾値: 10）
  const hotspots = extractHotspots(complexResult, 10);

  console.log("\n=== ホットスポット抽出結果 ===");
  console.log(`検出されたホットスポット数: ${hotspots.length}`);

  // 上位5つのホットスポットを表示
  hotspots.slice(0, 5).forEach((hotspot, index) => {
    console.log(
      `\n${index + 1}. ${hotspot.nodeType} (スコア: ${
        hotspot.score.toFixed(2)
      })`,
    );
    if (hotspot.lineInfo) {
      console.log(
        `   行: ${hotspot.lineInfo.startLine}-${hotspot.lineInfo.endLine}`,
      );
    }
    if (hotspot.metadata) {
      console.log(`   メタデータ: ${JSON.stringify(hotspot.metadata)}`);
    }
  });

  // ホットスポットが存在することを検証
  assertEquals(hotspots.length > 0, true, "ホットスポットが検出されるはず");

  // 最も複雑度の高いホットスポットのスコアが10以上であることを検証
  if (hotspots.length > 0) {
    assertEquals(
      hotspots[0].score >= 10,
      true,
      "最も複雑度の高いホットスポットのスコアは10以上であるはず",
    );
  }
});

// 個別の式・ステートメント・ブロックの複雑度計算テスト
Deno.test("個別のノード複雑度計算テスト", () => {
  // テスト用のコード
  const testCode = `
    function test(a: number, b: number): number {
      let result = 0;
      if (a > 0 && b > 0) {
        result = a + b;
      } else if (a < 0 && b < 0) {
        result = a * b;
      } else {
        result = Math.abs(a - b);
      }
      return result;
    }
  `;

  // ソースファイルを作成
  const sourceFile = ts.createSourceFile(
    "test.ts",
    testCode,
    ts.ScriptTarget.Latest,
    true,
  );

  // コンテキストを作成
  const context = createComplexityContext(sourceFile);

  // 関数宣言を取得
  const functionDeclaration = sourceFile.statements.find(
    (stmt) => ts.isFunctionDeclaration(stmt),
  ) as ts.FunctionDeclaration;

  if (functionDeclaration && functionDeclaration.body) {
    // 関数本体の複雑度を計算
    const blockComplexity = calculateBlockComplexity(
      functionDeclaration.body,
      context,
    );
    console.log("\n=== 関数ブロックの複雑度 ===");
    console.log(`スコア: ${blockComplexity.score.toFixed(2)}`);
    console.log(`子ノード数: ${blockComplexity.children.length}`);

    // if文を取得
    const ifStatement = functionDeclaration.body.statements.find(
      (stmt) => ts.isIfStatement(stmt),
    ) as ts.IfStatement;

    if (ifStatement) {
      // if文の複雑度を計算
      const ifComplexity = calculateStatementComplexity(ifStatement, context);
      console.log("\n=== if文の複雑度 ===");
      console.log(`スコア: ${ifComplexity.score.toFixed(2)}`);
      console.log(`子ノード数: ${ifComplexity.children.length}`);

      // 条件式の複雑度を計算
      const conditionComplexity = calculateNewExpressionComplexity(
        ifStatement.expression,
        context,
      );
      console.log("\n=== 条件式の複雑度 ===");
      console.log(`スコア: ${conditionComplexity.score.toFixed(2)}`);
      console.log(`子ノード数: ${conditionComplexity.children.length}`);
      console.log(`ノードタイプ: ${conditionComplexity.nodeType}`);

      // 条件式の詳細情報
      console.log("条件式の詳細情報:");
      console.log(JSON.stringify(conditionComplexity, null, 2));

      // 条件式の子ノード情報
      if (conditionComplexity.children.length > 0) {
        console.log("条件式の子ノード:");
        conditionComplexity.children.forEach((child, i) => {
          console.log(
            `子ノード ${i + 1}: ${child.nodeType} (スコア: ${
              child.score.toFixed(2)
            })`,
          );
        });
      }

      // 条件式の複雑度が1より大きいことを検証
      assertEquals(
        conditionComplexity.score > 1,
        true,
        "条件式の複雑度は1より大きいはず",
      );
    }
  }
});

// 平坦化機能のテスト
Deno.test("複雑度結果の平坦化テスト", () => {
  // シンプルなコードの複雑度を計算
  const simpleResult = calculateCodeComplexity(simpleCode);

  // 結果を平坦化
  const flattened = flattenComplexityResult(simpleResult);

  console.log("\n=== 複雑度結果の平坦化 ===");
  console.log(`平坦化されたノード数: ${flattened.length}`);

  // 平坦化されたノードの数が元の結果のノード数より多いことを検証
  assertEquals(
    flattened.length > 1,
    true,
    "平坦化されたノードの数は1より多いはず",
  );

  // 最初のノードが元の結果と同じスコアを持つことを検証
  assertEquals(
    flattened[0].score,
    simpleResult.score,
    "最初のノードは元の結果と同じスコアを持つはず",
  );
});

// 複雑度結果の要約テスト
Deno.test("複雑度結果の要約テスト", () => {
  // 各サンプルコードの複雑度を計算
  const simpleResult = calculateCodeComplexity(simpleCode);
  const mediumResult = calculateCodeComplexity(mediumCode);
  const complexResult = calculateCodeComplexity(complexCode);

  // 結果を要約
  const simpleSummary = summarizeComplexityResult(simpleResult);
  const mediumSummary = summarizeComplexityResult(mediumResult);
  const complexSummary = summarizeComplexityResult(complexResult);

  console.log("\n=== 複雑度結果の要約 ===");

  console.log("\n--- simple.ts の要約 ---");
  console.log(`総合スコア: ${simpleSummary.totalScore.toFixed(2)}`);
  console.log(`ノード数: ${simpleSummary.nodeCount}`);
  console.log(`最大深度: ${simpleSummary.maxDepth}`);
  console.log(`平均スコア: ${simpleSummary.averageScore.toFixed(2)}`);
  console.log("ホットスポット:");
  simpleSummary.hotspots.forEach((spot, i) => {
    console.log(
      `${i + 1}. ${spot.nodeType} (スコア: ${spot.score.toFixed(2)})`,
    );
    if (spot.lineInfo) {
      console.log(`   行: ${spot.lineInfo.startLine}-${spot.lineInfo.endLine}`);
    }
  });

  console.log("\n--- medium.ts の要約 ---");
  console.log(`総合スコア: ${mediumSummary.totalScore.toFixed(2)}`);
  console.log(`ノード数: ${mediumSummary.nodeCount}`);
  console.log(`最大深度: ${mediumSummary.maxDepth}`);
  console.log(`平均スコア: ${mediumSummary.averageScore.toFixed(2)}`);

  console.log("\n--- complex.ts の要約 ---");
  console.log(`総合スコア: ${complexSummary.totalScore.toFixed(2)}`);
  console.log(`ノード数: ${complexSummary.nodeCount}`);
  console.log(`最大深度: ${complexSummary.maxDepth}`);
  console.log(`平均スコア: ${complexSummary.averageScore.toFixed(2)}`);

  // 要約結果の検証
  assertEquals(
    simpleSummary.totalScore,
    simpleResult.score,
    "要約の総合スコアは元の結果と同じはず",
  );
  assertEquals(
    simpleSummary.nodeCount > 1,
    true,
    "ノード数は1より多いはず",
  );
  assertEquals(
    simpleSummary.maxDepth > 0,
    true,
    "最大深度は0より大きいはず",
  );
  assertEquals(
    simpleSummary.hotspots.length > 0,
    true,
    "ホットスポットが存在するはず",
  );

  // 複雑度の順序を検証
  assertEquals(
    simpleSummary.totalScore < mediumSummary.totalScore,
    true,
    "simple.tsはmedium.tsより複雑度が低いはず",
  );
  assertEquals(
    mediumSummary.totalScore < complexSummary.totalScore,
    true,
    "medium.tsはcomplex.tsより複雑度が低いはず",
  );
});

// メイン関数（直接実行された場合）
if (import.meta.main) {
  console.log("新しい複雑度計算モジュールのテストを開始します...");

  // 各サンプルコードの複雑度を計算
  const simpleResult = calculateCodeComplexity(simpleCode);
  const mediumResult = calculateCodeComplexity(mediumCode);
  const complexResult = calculateCodeComplexity(complexCode);

  console.log("\n=== 新しい複雑度計算モジュールの分析結果 ===");

  console.log("\n--- simple.ts (低複雑度) ---");
  console.log(`総合スコア: ${simpleResult.score.toFixed(2)}`);

  console.log("\n--- medium.ts (中複雑度) ---");
  console.log(`総合スコア: ${mediumResult.score.toFixed(2)}`);

  console.log("\n--- complex.ts (高複雑度) ---");
  console.log(`総合スコア: ${complexResult.score.toFixed(2)}`);

  // 要約結果を表示
  const simpleSummary = summarizeComplexityResult(simpleResult);
  const mediumSummary = summarizeComplexityResult(mediumResult);
  const complexSummary = summarizeComplexityResult(complexResult);

  console.log("\n=== 複雑度結果の要約 ===");

  console.log("\n--- simple.ts の要約 ---");
  console.log(`総合スコア: ${simpleSummary.totalScore.toFixed(2)}`);
  console.log(`ノード数: ${simpleSummary.nodeCount}`);
  console.log(`最大深度: ${simpleSummary.maxDepth}`);
  console.log(`平均スコア: ${simpleSummary.averageScore.toFixed(2)}`);

  console.log("\n--- medium.ts の要約 ---");
  console.log(`総合スコア: ${mediumSummary.totalScore.toFixed(2)}`);
  console.log(`ノード数: ${mediumSummary.nodeCount}`);
  console.log(`最大深度: ${mediumSummary.maxDepth}`);
  console.log(`平均スコア: ${mediumSummary.averageScore.toFixed(2)}`);

  console.log("\n--- complex.ts の要約 ---");
  console.log(`総合スコア: ${complexSummary.totalScore.toFixed(2)}`);
  console.log(`ノード数: ${complexSummary.nodeCount}`);
  console.log(`最大深度: ${complexSummary.maxDepth}`);
  console.log(`平均スコア: ${complexSummary.averageScore.toFixed(2)}`);

  console.log("\nテストが完了しました。");
}
