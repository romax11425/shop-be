import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  verbose: true,
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.ts',
    '**/*.d.ts',
    '**/*.test.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};

export default config;
