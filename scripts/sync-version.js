#!/usr/bin/env node

/**
 * Script to sync version from package.json to app-config.ts
 * Run this script whenever you update the version in package.json
 * 
 * Usage: node scripts/sync-version.js
 */

const fs = require('fs');
const path = require('path');

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Read current app-config.ts
const appConfigPath = path.join(__dirname, '..', 'src', 'lib', 'app-config.ts');
let appConfig = fs.readFileSync(appConfigPath, 'utf8');

// Update the version
const currentVersion = packageJson.version;
appConfig = appConfig.replace(
  /export const APP_VERSION = ['"].*?['"]/,
  `export const APP_VERSION = '${currentVersion}'`
);

// Write back to app-config.ts
fs.writeFileSync(appConfigPath, appConfig, 'utf8');

console.log(`✅ Version synced: ${currentVersion}`);
console.log(`   Updated: src/lib/app-config.ts`);
