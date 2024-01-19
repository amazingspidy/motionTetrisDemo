const path = require("path");

module.exports = {
  mode: "development", // 'development' 또는 'production'
  entry: "./src/index.js", // 프로젝트의 진입점
  output: {
    filename: "bundle.js", // 결과물 파일 이름
    path: path.resolve(__dirname, "dist"), // 결과물 파일 경로
  },
  // 추가 설정 (loaders, plugins 등) ...
};
