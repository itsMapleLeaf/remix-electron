module.exports = {
  extends: [require.resolve("@itsmapleleaf/configs/eslint")],
  plugins: ["prettier"],
  ignorePatterns: [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.cache/**",
    "**/.vscode/**",
    "**/integration/fixtures/**",
  ],
  rules: {
    "prettier/prettier": "error",
    "import/no-unused-modules": "off",
    "unicorn/prefer-module": "off",
    "unicorn/prevent-abbreviations": "off",
    "unicorn/no-process-exit": "off",
    "prefer-const": "error",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/ban-ts-comment": "off",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
}
