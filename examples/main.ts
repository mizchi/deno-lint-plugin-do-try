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
