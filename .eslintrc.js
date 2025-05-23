module.exports = {
    "env": {
        "browser": true,
        "es2021": true,
        "jest": true,
    },
    "parser": "babel-eslint",
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended"
    ],
    settings: {
        react: {
          createClass: "createReactClass",
          pragma: "React",
          version: "15.0",
          flowVersion: "0.53",
        },
        propWrapperFunctions: ["forbidExtraProps"],
      },
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        },
        "ecmaVersion": 12,
        "sourceType": "module"
    },
    "plugins": [
        "react"
    ],
    "rules": {
        "react/prop-types": 0,
        "no-unused-vars": "warn",
    },
    globals: {
        process: true,
        module: true
      },
};
