// モジュールB - モジュールAに依存
import { functionA, valueA } from "./a.ts";

export const valueB = valueA * 3;

export function functionB() {
  return functionA() + valueB;
}
