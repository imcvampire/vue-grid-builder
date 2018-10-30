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

    'prettier/prettier': isStrict ? 'error' : 'off',

    'no-console': isStrict ? 'error' : 'off',
    'no-debugger': isStrict ? 'error' : 'off',
  },
  parserOptions: {
    parser: 'babel-eslint',
  },
}
