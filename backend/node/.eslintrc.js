module.exports = {
  'root': true,
  'env': {
    'es6': true,
    'node': true,
  },
  'extends': [
    'eslint:recommended',
    'google',
    'plugin:prettier/recommended',
    'plugin:jest/recommended',
  ],
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly',
  },
  'plugins': [
    'jest',
    'prettier',
  ],
  'rules': {
    'prettier/prettier': [
      'error',
      {
        'singleQuote': true,
        'trailingComma': 'all',
        'printWidth': 120,
      },
    ],
    'no-console': ['warn', { allow: ['warn'] }],
    'max-len': ['error', {'code': 120, 'ignoreUrls': true, 'ignoreStrings': true}],
    'eqeqeq': 'warn',
    'new-cap': 'off',
    'require-jsdoc': 'off',
    'valid-jsdoc': 'off',
    'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
    'padding-line-between-statements': [
      'error',
      { 'blankLine': 'always', 'prev': ['function'], 'next':['function'] },
      { 'blankLine': 'always', 'prev': 'multiline-block-like', 'next':'multiline-block-like' },
      { 'blankLine': 'always', 'prev': '*', 'next':'export' },
      { 'blankLine': 'always', 'prev': 'import', 'next':['const', 'let', 'var','class','block-like'] },
    ],
    'brace-style': ['error', '1tbs'],
    'curly': ['error', 'all'],
    'jest/no-standalone-expect': 'off',
    'jest/expect-expect': 'off',
    'jest/no-commented-out-tests': 'off',
    'jest/no-done-callback': 'off',
  },
};
