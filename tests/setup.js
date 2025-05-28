// Test setup and global configurations
process.env.NODE_ENV = 'test';

// Mock console to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test timeout
jest.setTimeout(10000);

// Setup test data directory
const fs = require('fs');
const path = require('path');

const testDataDir = path.join(__dirname, 'data');
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

// Create test markdown files
const testFiles = {
  'test1.md': `# Test File 1
This is a test file with some content.
## Section 1
Some phrases here.
## Section 2
More phrases here.`,
  
  'test2.md': `# Test File 2
Another test file.
### Subsection
Different content here.`,
};

Object.entries(testFiles).forEach(([filename, content]) => {
  const filePath = path.join(testDataDir, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
  }
});

// Cleanup function for tests
global.afterEach(() => {
  jest.clearAllMocks();
});
