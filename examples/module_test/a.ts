// モジュールA - 基本モジュール（循環参照あり）
import { valueD } from "./d.ts";

export const valueA = 10;

export function functionA() {
  // 循環参照の例: モジュールDの値を使用
  return valueA * 2 + (valueD / 100);
}
