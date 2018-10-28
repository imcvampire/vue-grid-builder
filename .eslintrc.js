const isStrict = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'ci'

module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ['plugin:vue/recommended', '@vue/airbnb', 'prettier'],
  plugins: ['prettier'],
  rules: {
    semi: [2, 'never'],

    'prettier/prettier': isStrict ? 'error' : 'warn',

    'no-console': isStrict ? 'error' : 'warn',
    'no-debugger': isStrict ? 'error' : 'warn',
  },
  parserOptions: {
    parser: 'babel-eslint',
  },
}
