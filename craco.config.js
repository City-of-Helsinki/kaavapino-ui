const path = require('path');
const fs = require('fs')
module.exports = {
    webpack: {
        configure:  webpackConfig => {
          const scopePluginIndex = webpackConfig.resolve.plugins.findIndex(
            ({ constructor }) => constructor && constructor.name === 'ModuleScopePlugin',
          )
        
          webpackConfig.resolve.plugins.splice(scopePluginIndex, 1)
        
          const config = {
            ...webpackConfig,
            /* Any webpack configuration options: https://webpack.js.org/configuration */
            /* Webpack <5 used to add polyfills for node.js core modules by default */
            resolve: {
              modules: [ path.resolve(__dirname, 'src'), 'node_modules' ],
              extensions: [ '.js', '.jsx', '.ts', '.tsx' ],
              fallback: {
                path: require.resolve('path-browserify'),
                fs: false
              },
              alias: {
                fs: path.resolve(__dirname, 'src/mock-fs.js'),
                process: 'process/browser',
              },
              mainFields: [ 'browser', 'module', 'main' ],
            },
          }
          return config
        },
      },
}