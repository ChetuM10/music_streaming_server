/**
 * Jest Configuration for Music Streaming Server
 * @type {import('jest').Config}
 */
export default {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 10000,
  transform: {},
  moduleFileExtensions: ["js", "json"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/app.js", // Exclude app startup
    "!src/config/**", // Exclude config
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "clover"],
};
