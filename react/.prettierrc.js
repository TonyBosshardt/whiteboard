module.exports = {
  singleQuote: true,
  printWidth: 100,
  plugins: [require.resolve('@trivago/prettier-plugin-sort-imports')],
  importOrder: ['\\./.+js$', '(c|sc)ss$', 'json$'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderCaseInsensitive: false,
};
