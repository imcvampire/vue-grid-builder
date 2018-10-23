module.exports = {
  configureWebpack: {
    output: {
      libraryExport: 'default',
    },
  },
  devServer: {
    overlay: {
      warnings: true,
      errors: true,
    },
  },
}
