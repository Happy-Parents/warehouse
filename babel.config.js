module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind', decorators: { legacy: true } }],
      'nativewind/babel',
    ],
  };
};
