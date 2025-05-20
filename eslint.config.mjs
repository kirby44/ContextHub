import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    ignores: ['dist/**'],
  },
  {
    files: ['**/*.ts', '**/*.js'],
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off'
    }
  }
];