#!/usr/bin/env node

/**
 * Version Tagging Script
 * 
 * This script helps create git tags for versions based on the changelog.
 * It reads the version configuration and creates appropriate git tags.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read the current version from package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const currentVersion = packageJson.version;

console.log(`📦 Current version: ${currentVersion}`);

// Check if tag already exists
try {
  const existingTags = execSync('git tag -l', { encoding: 'utf8' }).split('\n').filter(Boolean);
  const versionTag = `v${currentVersion}`;
  
  if (existingTags.includes(versionTag)) {
    console.log(`⚠️  Tag ${versionTag} already exists`);
    process.exit(0);
  }
  
  // Create the tag
  console.log(`🏷️  Creating tag: ${versionTag}`);
  execSync(`git tag -a ${versionTag} -m "Release version ${currentVersion}"`, { stdio: 'inherit' });
  
  console.log(`✅ Successfully created tag ${versionTag}`);
  console.log(`💡 To push the tag to remote, run: git push origin ${versionTag}`);
  
} catch (error) {
  console.error('❌ Error creating tag:', error.message);
  process.exit(1);
}
