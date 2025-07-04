On this page - [Example plugin](#example-plugin)

- [Using selectors to match nodes](#using-selectors-to-match-nodes)
- [Applying fixes](#applying-fixes)
- [Running cleanup code](#running-cleanup-code)
- [Excluding custom rules](#excluding-custom-rules)
- [Ignoring custom lint reports](#ignoring-custom-lint-reports)
- [Testing plugins](#testing-plugins)

# Lint Plugins

Caution

This is an experimental feature and requires Deno `2.2.0` or newer.

The plugin API is currently marked as " unstable " since it is subject to changes
in the future.

The built-in linter can be extended with plugins to add custom lint rules.

Whilst Deno ships with [many lint rules](/lint/) out of the box, there are cases
where you need a custom rule tailored particularly to your project - whether to
catch a context-specific problem or enforce company-wide conventions.

This is where the lint plugin API comes into play.

The lint plugin API is intentionally modeled after the
[ESLint API](https://eslint.org/docs/latest/extend/custom-rules). While this API
doesn't provide 100% compatibility, the existing knowledge of authoring ESLint
plugins can be mostly reused if you happen to have written custom
[ESLint](https://eslint.org/) rules in the past.

Plugins are loaded via the `lint.plugins` setting in `deno.json`.

The value is an array of plugin specifiers. These can be paths, `npm:`, or
`jsr:` specifiers.

deno.json

```json
{
  "lint": {
    "plugins": ["./try.ts"]
  }
}
```

## Example plugin [Jump to heading #](#example-plugin)

A plugin always has the same shape. It has a default export which is your plugin
object.

Info

Deno provides type declarations for the lint plugins API.

All the typings are available under the `Deno.lint` namespace.

try.ts

```ts
const plugin: Deno.lint.Plugin = {
  // The name of your plugin. Will be shown in error output
  name: "try",
  // Object with rules. The property name is the rule name and
  // will be shown in the error output as well.
  rules: {
    "my-rule": {
      // Inside the `create(context)` method is where you'll put your logic.
      // It's called when a file is being linted.
      create(context) {
        // Return an AST visitor object
        return {
          // Here in this example we forbid any identifiers being named `_a`
          Identifier(node) {
            if (node.name === "_a") {
              // Report a lint error with a custom message
              context.report({
                node,
                message: "should be _b",
                // Optional: Provide a fix, which can be applied when
                // the user runs `deno lint --fix`
                fix(fixer) {
                  return fixer.replaceText(node, "_b");
                },
              });
            }
          },
        };
      },
    },
  },
};
export default plugin;
```

## Using selectors to match nodes [Jump to heading #](#using-selectors-to-match-nodes)

Writing code to match a specific node can sometimes become a bit tedious if you
write it in plain JavaScript. Sometimes this matching logic would be easier to
express via a selector, similar to CSS selectors. By using a string as the
property name in the returned visitor object, we can specify a custom selector.

try.ts

```ts
const plugin: Deno.lint.Plugin = {
  name: "try",
  rules: {
    "my-rule": {
      create(context) {
        return {
          // Selectors can be used too. Here we check for
          // `require("...") calls.
          'CallExpression[callee.name="require"]'(node) {
            context.report({
              node,
              message: "Don't use require() calls to load modules",
            });
          },
        };
      },
    },
  },
};
export default plugin;
```

Note, that we can always refine our match further in JavaScript if the matching
logic is too complex to be expressed as a selector alone. The full list of the
supported syntax for selectors is:

| Syntax                 | Description                            |
| ---------------------- | -------------------------------------- | --------------------------- |
| `Foo + Foo`            | Next sibling selector                  |
| `Foo > Bar`            | Child combinator                       |
| `Foo ~ Bar`            | Subsequent sibling combinator          |
| `Foo Bar`              | Descendant combinator                  |
| `Foo[attr]`            | Attribute existence                    |
| `Foo[attr.length < 2]` | Attribute value comparison             |
| `Foo[attr=/(foo        | bar)\*/]`                              | Attribute value regex check |
| `:first-child`         | First child pseudo-class               |
| `:last-child`          | Last child pseudo-class                |
| `:nth-child(2n + 1)`   | Nth-child pseudo-class                 |
| `:not( > Bar)`         | Not pseudo-class                       |
| `:is( > Bar)`          | Is pseudo-class                        |
| `:where( > Bar)`       | Where pseudo-class (same as `:is()`)   |
| `:matches( > Bar)`     | Matches pseudo-class (same as `:is()`) |
| `:has( > Bar)`         | Has pseudo-class                       |
| `IfStatement.test`     | Field selector `. < field >`           |

There is also the `:exit` pseudo that is only valid at the end of the whole
selector. When it's present, Deno will call the function while going **up** the
tree instead of when going down.

Tip

We highly recommend using the
[typescript-eslint playground](https://typescript-eslint.io/play/) when
developing lint rules. It allows you to inspect code and the resulting AST
format. This makes it easier to see which selectors match which node.

## Applying fixes [Jump to heading #](#applying-fixes)

A custom lint rule can supply a function to apply a fix when reporting a
problem. The optional `fix()` method is called when running `deno lint --fix` or
applying a fix from inside your editor through the Deno LSP.

The `fix()` method receives a `fixer` instance which contains helper methods to
make creating a fix easier. A fix consists of a start position, an end position
and the new text that should be put in this range.

```ts
context.report({
  node,
  message: "should be _b",
  fix(fixer) {
    return fixer.replaceText(node, "_b");
  },
});
```

The `fixer` object has the following methods:

- `insertTextAfter(node, text)`: Insert text after the given node.
- `insertTextAfterRange(range, text)`: Insert text after the given range.
- `insertTextBefore(node, text)`: Insert text before the given node.
- `insertTextBeforeRange(range, text)`: Insert text before the given range.
- `remove(node)`: Remove the given node.
- `removeRange(range)`: Remove text in the given range.
- `replaceText(node, text)`: Replace the text in the given node.
- `replaceTextRange(range, text)`: Replace the text in the given range.

The `fix()` method can also return an array of fixes or yield multiple fixes if
it's a generator function.

Sometimes the original source text of a node is needed to create a fix. To get
the source code of any node use `context.sourceCode.getText()`:

```ts
context.report({
  node,
  message: "should be _b",
  fix(fixer) {
    const original = context.sourceCode.getText(node);
    const newText = `{ ${original} }`;
    return fixer.replaceText(node, newText);
  },
});
```

## Running cleanup code [Jump to heading #](#running-cleanup-code)

If your plugin requires running cleanup code after a file has been linted, you
can hook into the linter via the `destroy()` hook. It is called after a file has
been linted and just before the plugin context is destroyed.

try.ts

```ts
const plugin: Deno.lint.Plugin = {
  name: "try",
  rules: {
    "my-rule": {
      create(context) {
        // ...
      },
      // Optional: Run code after a linting for a file is completed
      // and each rule context is destroyed.
      destroy() {
        // do some cleanup stuff if you need to
      },
    },
  },
};
export default plugin;
```

Caution

It is not safe to assume that your plugin code will be executed again for each
of the files linted.

Prefer not to keep a global state, and do cleanup in the `destroy` hook, in case
`deno lint` decides to reuse the existing plugin instance.

## Excluding custom rules [Jump to heading #](#excluding-custom-rules)

Similar to built-in rules, you can disable custom rules provided by a plugin. To
do so, add it to the `lint.rules.exclude` key in `deno.json`. The format of a
custom lint rule is always `< plugin-name > / < rule-name >`.

deno.json

```json
{
  "lint": {
    "plugins": ["./try.ts"],
    "rules": {
      "exclude": ["try/my-rule"]
    }
  }
}
```

## Ignoring custom lint reports [Jump to heading #](#ignoring-custom-lint-reports)

Sometimes you want to disable a reported lint error for a particular place in
your code. Instead of disabling the custom lint rule entirely, you can disable a
reported location by placing a code comment before it.

```ts
// deno-lint-ignore my-custom-plugin/no-console
console.log("hey");
```

This will disable the lint rule from a lint plugin for this particular line.

The syntax for the ignore comment is:

```ts
// deno-lint-ignore <try>/<my-rule>
```

## Testing plugins [Jump to heading #](#testing-plugins)

The `Deno.lint.runPlugin` API provides a convenient way to test your plugins. It
allows you to assert that the plugin produces expected diagnostics given the
particular input.

Let's use the example plugin, defined above:

try_test.ts

```ts
import { assertEquals } from "jsr:@std/assert";
import myPlugin from "./try.ts";

Deno.test("try", () => {
  const diagnostics = Deno.lint.runPlugin(
    myPlugin,
    "main.ts", // Dummy filename, file doesn't need to exist.
    "const _a = 'a';"
  );

  assertEquals(diagnostics.length, 1);
  const d = diagnostics[0];
  assertEquals(d.id, "try/my-rule");
  assertEquals(d.message, "should be _b");
  assertEquals(d.fix, [{ range: [6, 8], text: "_b" }]);
});
```

Info

The `Deno.lint.runPlugin` API is only available in the `deno test` and
`deno bench` subcommands.

Trying to use it with any other subcommand will throw an error.

Consult [the API reference](/api/deno/) for more information on
[`Deno.lint.runPlugin`](/api/deno/~/Deno.lint.runPlugin) and
[`Deno.lint.Diagnostic`](/api/deno/~/Deno.lint.Diagnostic).
