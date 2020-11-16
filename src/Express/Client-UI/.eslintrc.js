module.exports = {
  parser: "@typescript-eslint/parser", // Specifies the ESLint parser
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: "module", // Allows for the use of imports
    ecmaFeatures: {
      jsx: true // Allows for the parsing of JSX
    }
  },
  settings: {
    react: {
      version: "detect" // Tells eslint-plugin-react to automatically detect the version of React to use
    }
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended", // Uses the recommended rules from @eslint-plugin-react
    "plugin:@typescript-eslint/recommended", // Uses the recommended rules from @typescript-eslint/eslint-plugin
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript"
  ],
  rules: {
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
    // e.g. "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "args": "all", "argsIgnorePattern": "^_" }], // Allow unused to be an underscore
    "@typescript-eslint/no-use-before-define": ["error", "nofunc"], // means functions false, classes true, variables true
    "import/order": ["warn", { alphabetize: { order: 'asc', caseInsensitive: true } }],
    "import/no-named-as-default": 0,
    "semi": ["warn", "always"],
    "no-trailing-spaces": ["warn"],
    "padding-line-between-statements": ["error", { blankLine: "always", prev: "*", next: ["return", "block-like"] }],
    "padded-blocks": ["error", "never"],
    "indent": ["warn", 2],
    "react/prop-types": ["error", { ignore: ['children'] }],
    "eol-last": ["error", "always"],
    "camelcase": "error",
    "@typescript-eslint/explicit-member-accessibility": ["error"],
    "quotes": ["warn", "single"],
    "@typescript-eslint/no-floating-promises":  "error"
  },
};