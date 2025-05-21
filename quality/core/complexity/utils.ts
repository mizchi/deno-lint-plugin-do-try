/**
 * コード品質計算モジュールの複雑度計算 - ユーティリティ関数
 *
 * このファイルでは、複雑度計算結果を処理するためのユーティリティ関数を提供します。
 */

import type { ComplexityResult } from "./common.ts";

/**
 * 複雑度結果からホットスポットを抽出する
 * @param result 複雑度計算結果
 * @param threshold ホットスポットとみなすスコアの閾値
 * @returns ホットスポットの配列
 */
export function extractHotspots(
  result: ComplexityResult,
  threshold: number = 5,
): ComplexityResult[] {
  const hotspots: ComplexityResult[] = [];

  // 現在のノードがホットスポットかチェック
  if (result.score >= threshold) {
    hotspots.push(result);
  }

  // 子ノードを再帰的に処理
  for (const child of result.children) {
    hotspots.push(...extractHotspots(child, threshold));
  }

  // スコアの降順でソート
  return hotspots.sort((a, b) => b.score - a.score);
}

/**
 * 複雑度結果を平坦化する（デバッグ用）
 * @param result 複雑度計算結果
 * @returns 平坦化された複雑度情報の配列
 */
export function flattenComplexityResult(
  result: ComplexityResult,
): Array<{
  nodeType: string;
  score: number;
  lineInfo?: { startLine: number; endLine: number };
  metadata?: Record<string, unknown>;
}> {
  const flattened: Array<{
    nodeType: string;
    score: number;
    lineInfo?: { startLine: number; endLine: number };
    metadata?: Record<string, unknown>;
  }> = [];

  // 現在のノードを追加
  flattened.push({
    nodeType: result.nodeType,
    score: result.score,
    lineInfo: result.lineInfo,
    metadata: result.metadata,
  });

  // 子ノードを再帰的に処理
  for (const child of result.children) {
    flattened.push(...flattenComplexityResult(child));
  }

  return flattened;
}

/**
 * 複雑度結果を要約する
 * @param result 複雑度計算結果
 * @returns 要約情報
 */
export function summarizeComplexityResult(result: ComplexityResult): {
  totalScore: number;
  nodeCount: number;
  maxDepth: number;
  averageScore: number;
  hotspots: Array<
    {
      nodeType: string;
      score: number;
      lineInfo?: { startLine: number; endLine: number };
    }
  >;
} {
  // 総合スコア
  const totalScore = result.score;

  // ノード数を計算
  let nodeCount = 1;

  // 最大深度を計算
  let maxDepth = 0;

  // 各ノードのスコアを収集
  const scores: number[] = [result.score];

  // ホットスポットを収集
  // 固定閾値ではなく、相対的な複雑さに基づいてホットスポットを抽出
  // フラット化して全ノードを取得
  const allNodes = flattenComplexityResult(result);

  // スコアでソート
  const sortedNodes = allNodes.sort((a, b) => b.score - a.score);

  // 上位5つのノードをホットスポットとして抽出
  const hotspots = sortedNodes.slice(0, 5).map((spot) => ({
    nodeType: spot.nodeType,
    score: spot.score,
    lineInfo: spot.lineInfo,
  }));

  // 再帰的に子ノードを処理
  function processNode(node: ComplexityResult, depth: number): void {
    maxDepth = Math.max(maxDepth, depth);

    for (const child of node.children) {
      nodeCount++;
      scores.push(child.score);
      processNode(child, depth + 1);
    }
  }

  processNode(result, 1);

  // 平均スコアを計算
  const averageScore = totalScore / nodeCount;

  return {
    totalScore,
    nodeCount,
    maxDepth,
    averageScore,
    hotspots,
  };
}
