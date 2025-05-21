/**
 * simple.ts
 *
 * このファイルは低複雑度のコードサンプルを提供します。
 * 主に単純な関数、基本的な型定義、シンプルなオブジェクト操作を含みます。
 */

/**
 * 2つの数値を加算する単純な関数
 */
export function add(a: number, b: number): number {
  return a + b;
}

/**
 * 2つの数値の平均を計算する関数
 */
export function average(a: number, b: number): number {
  const sum = a + b;
  return sum / 2;
}

/**
 * 単純な型定義
 */
export type Point = {
  x: number;
  y: number;
};

/**
 * 2点間の距離を計算する関数
 */
export function calculateDistance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 単純なオブジェクト操作の例
 */
export function createUser(name: string, age: number) {
  return {
    name,
    age,
    isAdult: age >= 18,
    greet() {
      return `こんにちは、${name}さん！`;
    },
  };
}

/**
 * 配列の合計を計算する関数
 */
export function sum(numbers: number[]): number {
  let total = 0;
  for (const num of numbers) {
    total += num;
  }
  return total;
}

/**
 * 文字列を反転する関数
 */
export function reverseString(str: string): string {
  return str.split("").reverse().join("");
}
