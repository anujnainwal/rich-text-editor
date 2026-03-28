const fs = require('fs');
const path = require('path');

/**
 * Cross-platform replacement for 'sed' to clean up generated type definitions.
 * Specifically removes CSS imports that TypeScript can't resolve in the final bundle.
 */
function cleanupTypes() {
  const target = path.resolve(__dirname, '../dist/index.d.ts');

  if (!fs.existsSync(target)) {
    console.warn(`Type declaration file not found for cleanup: ${target}`);
    return;
  }

  try {
    const content = fs.readFileSync(target, 'utf8');
    const cleaned = content
      .split('\n')
      .filter(line => !line.match(/import.*\.css/))
      .join('\n');

    fs.writeFileSync(target, cleaned);
    console.log('Successfully cleaned up CSS imports from type declarations.');
  } catch (error) {
    console.error('Error during type cleanup:', error);
    process.exit(1);
  }
}

cleanupTypes();
