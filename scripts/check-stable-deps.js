#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script to check for unstable dependencies in package.json
 * This helps prevent accidentally introducing alpha, beta, or RC versions
 */

function checkStableDependencies() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found');
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const unstablePatterns = [
    /alpha/i,
    /beta/i,
    /rc\./i,
    /\-rc/i,
    /pre/i,
    /snapshot/i,
    /dev/i,
    /canary/i,
    /next/i
  ];

  let foundUnstable = false;
  
  function checkDependencySection(deps, sectionName) {
    if (!deps) return;
    
    const unstableDeps = [];
    
    for (const [name, version] of Object.entries(deps)) {
      const isUnstable = unstablePatterns.some(pattern => pattern.test(version));
      
      if (isUnstable) {
        unstableDeps.push({ name, version });
        foundUnstable = true;
      }
    }
    
    if (unstableDeps.length > 0) {
      console.log(`\n🚨 Unstable dependencies found in ${sectionName}:`);
      unstableDeps.forEach(({ name, version }) => {
        console.log(`  ❌ ${name}: ${version}`);
      });
    }
  }

  console.log('🔍 Checking for unstable dependencies...\n');

  checkDependencySection(packageJson.dependencies, 'dependencies');
  checkDependencySection(packageJson.devDependencies, 'devDependencies');
  checkDependencySection(packageJson.peerDependencies, 'peerDependencies');
  checkDependencySection(packageJson.optionalDependencies, 'optionalDependencies');

  if (foundUnstable) {
    console.log('\n⚠️  Found unstable dependencies. Consider using stable versions for production.');
    console.log('📚 See DEPENDENCY_ANALYSIS.md for guidance on managing dependencies.');
    process.exit(1);
  } else {
    console.log('✅ All dependencies appear to be using stable versions.');
    console.log('🎉 No alpha, beta, or RC versions detected.');
  }
}

if (require.main === module) {
  checkStableDependencies();
}

module.exports = { checkStableDependencies }; 