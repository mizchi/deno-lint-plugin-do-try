// モジュールC - モジュールBに依存
import { functionB, valueB } from "./b.ts";

export const valueC = valueB * 2;

export function functionC() {
  return functionB() + valueC;
}
