module.exports = {
  plugins: [
    // new webpack.webpack.optimize.UglifyJsPlugin({ minimize: true })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader'
      }
    ]
  },
  output: {
    filename: 'app.js'
  },
  devtool: 'source-map'
};
