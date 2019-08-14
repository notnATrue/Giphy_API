module.exports = {
  env: {
    es6: true,
    node: true,
    browser: true
  },
  extends: ["airbnb-base", "plugin:prettier/recommended"],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly"
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module"
  },
  rules: {
    "no-underscore-dangle": ["error", { "allow": ["_id"] }]
  }
};
