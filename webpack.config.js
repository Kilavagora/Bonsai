const path = require('path');

module.exports = [{
  entry: ['./src/bonsai.scss', './src/bonsai.js'],
  output: {
    path: path.join(__dirname, "./dist"),
    filename: 'bonsai.js',
    publicPath: "dist/",
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'bonsai.css',
            },
          },
          { loader: 'extract-loader' },
          { loader: 'css-loader' },
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                includePaths: ['./node_modules']
              },
            }
          }
        ]
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
      }
    ]
  },
}];