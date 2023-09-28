module.exports = (api) => {
  const plugins = ['@babel/plugin-transform-runtime', 'add-react-displayname'];

  if (api.env('development')) {
    plugins.push('react-refresh/babel');
    plugins.push(['@simbathesailor/babel-plugin-use-what-changed', { active: true }]);
  }

  return {
    presets: ['@babel/preset-env', '@babel/preset-react'],
    plugins,
    env: {},
  };
};
