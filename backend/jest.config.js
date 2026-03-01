/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.ts", "**/*.integration.test.ts", "**/*.integration.spec.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/__tests__/**"],
  setupFiles: ["<rootDir>/src/__tests__/setup.ts"],
  testTimeout: 30000,
};
