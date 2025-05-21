// モジュールD - モジュールCに依存し、循環参照を作成
import { functionC, valueC } from "./c.ts";

export const valueD = valueC * 2;

export function functionD() {
  return functionC() + valueD;
}
