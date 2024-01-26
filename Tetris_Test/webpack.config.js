const path = require('path');

module.exports = {
  entry: './src/index.js', // 프로젝트의 진입점 설정
  output: {
    filename: 'bundle.js', // 번들된 파일 이름
    path: path.resolve(__dirname, 'dist'), // 번들된 파일의 저장 경로
  },
  resolve: {
    modules: [path.resolve(__dirname, 'node_modules')], // 노드 모듈 포함을 위한 설정
  },
  module: {
    rules: [
      // 로더 및 규칙 설정 (예: Babel을 사용하여 ES6+ 코드를 변환하는 경우)
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
};