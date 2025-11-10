#!/usr/bin/env node

/**
 * Custom build script that injects environment variables into Angular's define option
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get the Mapbox token from environment
const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN || '';

console.log('🔧 Building with environment variables...');
console.log(`📍 MAPBOX_ACCESS_TOKEN: ${mapboxToken ? '✓ Set' : '✗ Not set'}`);

// Read angular.json
const angularJsonPath = path.join(__dirname, '..', 'angular.json');
const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8'));

// Update the define configuration
angularJson.projects['bulbutin-ng'].architect.build.configurations.production.define = {
  MAPBOX_ACCESS_TOKEN: JSON.stringify(mapboxToken)
};

// Write the modified angular.json
fs.writeFileSync(angularJsonPath, JSON.stringify(angularJson, null, 2));

try {
  // Run the Angular build
  execSync('ng build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
} finally {
  // Restore the original angular.json (remove the define)
  delete angularJson.projects['bulbutin-ng'].architect.build.configurations.production.define;
  fs.writeFileSync(angularJsonPath, JSON.stringify(angularJson, null, 2));
}
