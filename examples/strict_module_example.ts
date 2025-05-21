// allow
import {} from "./xxx/mod.ts";
import type { Foo as _2 } from "./xxx/types.ts";

// error
import {} from "./xxx/internal.ts";
import { Foo as _1 } from "./xxx/types.ts"; // no type
