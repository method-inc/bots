requirejs.config({
  paths: {
    'jquery': '../libs/jquery',
    'react': '../libs/react',
    'jsx': './jsx',
    'JSXTransformer': '../libs/JSXTransformer'
  },
  shim: {
    'JSXTransformer': {
      exports: 'JSXTransformer',
      deps: ['react']
    }
  }
});
