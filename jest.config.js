module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    'dist/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(cbjs)/)',
  ],
  transform: {
    "^.+\\.(ts|js|jsx)$": "ts-jest"
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};