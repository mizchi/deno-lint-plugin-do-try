export function add(a: number, b: number): number {
  return a + b;
}

async function doSomething() {}
const obj = { doSomething };

doSomething();
await doSomething();
await obj.doSomething();

try {
  const run = async () => {
    await doSomething();
  };
  await run();
} catch (error) {
  console.error("An error occurred:", error);
}

try {
  doSomething();
} catch (error) {
  console.error("An error occurred:", error);
}
// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  console.log("Add 2 + 3 =", add(2, 3));
}
// deno-lint-ignore no-unused-vars
function throwableFunction() {
  if (Math.random() > 0.5) {
    throw new Error("Random error");
  }
  return "data";
}

// deno-lint-ignore no-unused-vars
function doThrowableFunction() {
  if (Math.random() > 0.5) {
    throw new Error("Random error");
  }
  return "data";
}
