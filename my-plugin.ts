const plugin: Deno.lint.Plugin = {
  name: "my-plugin",
  rules: {
    "my-rule": {
      create(context) {
        return {
          Identifier(node) {
            if (node.name === "_a") {
              context.report({
                node,
                message: "should be _b",
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
