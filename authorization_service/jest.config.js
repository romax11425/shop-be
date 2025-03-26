"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
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
exports.default = config;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiamVzdC5jb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJqZXN0LmNvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBLE1BQU0sTUFBTSxHQUFXO0lBQ3JCLE1BQU0sRUFBRSxTQUFTO0lBQ2pCLGVBQWUsRUFBRSxNQUFNO0lBQ3ZCLFNBQVMsRUFBRSxDQUFDLGNBQWMsQ0FBQztJQUMzQixPQUFPLEVBQUUsSUFBSTtJQUNiLGVBQWUsRUFBRSxJQUFJO0lBQ3JCLG1CQUFtQixFQUFFO1FBQ25CLFNBQVM7UUFDVCxXQUFXO1FBQ1gsY0FBYztLQUNmO0lBQ0QsaUJBQWlCLEVBQUUsVUFBVTtJQUM3QixpQkFBaUIsRUFBRSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUM7Q0FDcEMsQ0FBQztBQUVGLGtCQUFlLE1BQU0sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgQ29uZmlnIH0gZnJvbSAnamVzdCc7XHJcblxyXG5jb25zdCBjb25maWc6IENvbmZpZyA9IHtcclxuICBwcmVzZXQ6ICd0cy1qZXN0JyxcclxuICB0ZXN0RW52aXJvbm1lbnQ6ICdub2RlJyxcclxuICB0ZXN0TWF0Y2g6IFsnKiovKi50ZXN0LnRzJ10sXHJcbiAgdmVyYm9zZTogdHJ1ZSxcclxuICBjb2xsZWN0Q292ZXJhZ2U6IHRydWUsXHJcbiAgY29sbGVjdENvdmVyYWdlRnJvbTogW1xyXG4gICAgJyoqLyoudHMnLFxyXG4gICAgJyoqLyouZC50cycsXHJcbiAgICAnKiovKi50ZXN0LnRzJyxcclxuICBdLFxyXG4gIGNvdmVyYWdlRGlyZWN0b3J5OiAnY292ZXJhZ2UnLFxyXG4gIGNvdmVyYWdlUmVwb3J0ZXJzOiBbJ3RleHQnLCAnbGNvdiddLFxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY29uZmlnO1xyXG4iXX0=