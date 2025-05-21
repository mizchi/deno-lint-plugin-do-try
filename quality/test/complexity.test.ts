/**
 * complexity_test.ts
 *
 * このファイルは、複雑度計算モジュールの calculateNodeComplexity 関数をテストします。
 * 他の関数は内部実装の詳細として扱い、直接テストしません。
 */

import {
  calculateNodeComplexity,
  type ComplexityResult,
  createComplexityContext,
  extractHotspots,
  flattenComplexityResult,
} from "../core/mod.ts";

// flattenComplexityResult の戻り値の型を定義
type FlattenedComplexityResult = {
  nodeType: string;
  score: number;
  lineInfo?: { startLine: number; endLine: number };
  metadata?: Record<string, unknown>;
};
import { expect } from "@std/expect";
import ts from "npm:typescript";
import { summarizeComplexityResult } from "../core/complexity/mod.ts";

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

// 複雑度計算モジュールのテスト
Deno.test("calculateNodeComplexity のテスト", async (t) => {
  // ソースファイルを作成
  const simpleSourceFile = ts.createSourceFile(
    "simple.ts",
    simpleCode,
    ts.ScriptTarget.Latest,
    true,
  );
  const mediumSourceFile = ts.createSourceFile(
    "medium.ts",
    mediumCode,
    ts.ScriptTarget.Latest,
    true,
  );
  const complexSourceFile = ts.createSourceFile(
    "complex.ts",
    complexCode,
    ts.ScriptTarget.Latest,
    true,
  );

  // calculateNodeComplexity を使用して複雑度を計算
  const simpleResult = calculateNodeComplexity(simpleSourceFile);
  const mediumResult = calculateNodeComplexity(mediumSourceFile);
  const complexResult = calculateNodeComplexity(complexSourceFile);

  await t.step("ファイル間の複雑度比較", () => {
    // simple.tsはmedium.tsより複雑度が低いはず
    expect(simpleResult.score).toBeLessThan(mediumResult.score);

    // medium.tsはcomplex.tsより複雑度が低いはず
    expect(mediumResult.score).toBeLessThan(complexResult.score);

    // simple.tsはcomplex.tsより複雑度が低いはず
    expect(simpleResult.score).toBeLessThan(complexResult.score);
  });

  await t.step("simple.tsの複雑度分析", () => {
    const simpleFlattened = flattenComplexityResult(simpleResult);

    // ノードタイプの検証
    expect(simpleResult.nodeType).toBeDefined();

    // 子ノード数の検証
    expect(simpleResult.children.length).toBeGreaterThan(0);

    // ノード総数の検証
    expect(simpleFlattened.length).toBeGreaterThan(0);

    // 上位ノードの存在確認
    const topNodes = simpleFlattened.sort((
      a: FlattenedComplexityResult,
      b: FlattenedComplexityResult,
    ) => b.score - a.score).slice(
      0,
      5,
    );
    expect(topNodes.length).toBeGreaterThan(0);
  });

  await t.step("ホットスポット抽出のテスト", () => {
    // ホットスポットを抽出（閾値: 10）
    const hotspots = extractHotspots(complexResult, 10);

    // ホットスポットが存在することを検証
    expect(hotspots.length).toBeGreaterThan(0);

    if (hotspots.length > 0) {
      // 最も複雑度の高いホットスポットのスコアが10以上であることを検証
      expect(hotspots[0].score).toBeGreaterThanOrEqual(10);

      // 各ホットスポットがnodeTypeを持つことを検証
      hotspots.forEach((hotspot: ComplexityResult) => {
        expect(hotspot.nodeType).toBeDefined();
        expect(hotspot.score).toBeGreaterThan(0);
      });
    }
  });

  await t.step("複雑度結果の要約テスト", () => {
    // 結果を要約
    const simpleSummary = summarizeComplexityResult(simpleResult);
    const mediumSummary = summarizeComplexityResult(mediumResult);
    const complexSummary = summarizeComplexityResult(complexResult);

    // 要約の総合スコアは元の結果と同じはず
    expect(simpleSummary.totalScore).toBe(simpleResult.score);

    // ノード数は1より多いはず
    expect(simpleSummary.nodeCount).toBeGreaterThan(1);

    // 最大深度は0より大きいはず
    expect(simpleSummary.maxDepth).toBeGreaterThan(0);

    // 複雑度の順序検証
    expect(simpleSummary.totalScore).toBeLessThan(mediumSummary.totalScore);
    expect(mediumSummary.totalScore).toBeLessThan(complexSummary.totalScore);
  });

  await t.step("個別のノード複雑度計算テスト", () => {
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

    expect(functionDeclaration).toBeDefined();
    expect(functionDeclaration.body).toBeDefined();

    if (functionDeclaration && functionDeclaration.body) {
      // 関数本体の複雑度を計算
      const blockComplexity = calculateNodeComplexity(
        functionDeclaration.body,
        context,
      );

      // 関数ブロックの複雑度検証
      expect(blockComplexity.score).toBeGreaterThan(0);
      expect(blockComplexity.children.length).toBeGreaterThan(0);

      // if文を取得
      const ifStatement = functionDeclaration.body.statements.find(
        (stmt) => ts.isIfStatement(stmt),
      ) as ts.IfStatement;

      expect(ifStatement).toBeDefined();

      if (ifStatement) {
        // if文の複雑度を計算
        const ifComplexity = calculateNodeComplexity(ifStatement, context);

        // if文の複雑度検証
        expect(ifComplexity.score).toBeGreaterThanOrEqual(0);
        expect(ifComplexity.children.length).toBeGreaterThanOrEqual(0);

        // 条件式の複雑度を計算
        const conditionComplexity = calculateNodeComplexity(
          ifStatement.expression,
          context,
        );

        // 条件式の複雑度検証
        expect(conditionComplexity.score).toBeGreaterThan(1);
        expect(conditionComplexity.nodeType).toBeDefined();

        // 条件式の子ノード検証
        if (conditionComplexity.children.length > 0) {
          conditionComplexity.children.forEach((child) => {
            expect(child.nodeType).toBeDefined();
            expect(child.score).toBeGreaterThanOrEqual(0);
          });
        }
      }
    }
  });
});

// メイン関数（直接実行された場合）
if (import.meta.main) {
  console.log("複雑度計算モジュールのテストを開始します...");

  // ソースファイルを作成
  const simpleSourceFile = ts.createSourceFile(
    "simple.ts",
    simpleCode,
    ts.ScriptTarget.Latest,
    true,
  );
  const mediumSourceFile = ts.createSourceFile(
    "medium.ts",
    mediumCode,
    ts.ScriptTarget.Latest,
    true,
  );
  const complexSourceFile = ts.createSourceFile(
    "complex.ts",
    complexCode,
    ts.ScriptTarget.Latest,
    true,
  );

  // calculateNodeComplexity を使用して複雑度を計算
  const simpleResult = calculateNodeComplexity(simpleSourceFile);
  const mediumResult = calculateNodeComplexity(mediumSourceFile);
  const complexResult = calculateNodeComplexity(complexSourceFile);

  console.log("\n=== 複雑度計算モジュールの分析結果 ===");

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
