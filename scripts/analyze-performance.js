#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Performance Analysis Script for Aerotage Time Reporting App
 * Phase 7 - Polish & Testing
 */

console.log('🚀 Aerotage Time App - Performance Analysis');
console.log('==========================================\n');

// Bundle Size Analysis
function analyzeBundleSize() {
  console.log('📦 Bundle Size Analysis');
  console.log('----------------------');
  
  const distPath = path.join(__dirname, '..', 'dist');
  
  if (!fs.existsSync(distPath)) {
    console.log('❌ Dist folder not found. Please run: npm run build:renderer');
    return;
  }
  
  const files = fs.readdirSync(distPath);
  const jsFiles = files.filter(file => file.endsWith('.js') && !file.includes('.map'));
  
  let totalSize = 0;
  const bundleInfo = [];
  
  jsFiles.forEach(file => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    const sizeInKB = (stats.size / 1024).toFixed(2);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    totalSize += stats.size;
    
    let category = 'Other';
    if (file.includes('bundle.js')) category = 'Main Bundle';
    else if (file.includes('354.bundle.js')) category = 'Vendor (React/DOM)';
    else if (file.includes('780.bundle.js')) category = 'Vendor (Router)';
    else if (file.includes('418.bundle.js')) category = 'Vendor (Utils)';
    
    bundleInfo.push({
      file,
      category,
      size: stats.size,
      sizeKB: sizeInKB,
      sizeMB: sizeInMB
    });
    
    console.log(`  ${category.padEnd(20)} ${file.padEnd(25)} ${sizeInKB.padStart(8)} KB`);
  });
  
  const totalKB = (totalSize / 1024).toFixed(2);
  const totalMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  console.log(`\n  Total JavaScript Size: ${totalKB} KB (${totalMB} MB)`);
  
  // Bundle Size Recommendations
  console.log('\n💡 Bundle Size Analysis:');
  if (totalSize > 2 * 1024 * 1024) { // > 2MB
    console.log('  ⚠️  Large bundle detected. Consider code splitting or lazy loading.');
  } else if (totalSize > 1.5 * 1024 * 1024) { // > 1.5MB
    console.log('  ⚡ Bundle size is acceptable but could be optimized.');
  } else {
    console.log('  ✅ Bundle size is well optimized!');
  }
  
  return { totalSize, bundleInfo };
}

// Asset Analysis
function analyzeAssets() {
  console.log('\n🎨 Asset Analysis');
  console.log('-----------------');
  
  const distPath = path.join(__dirname, '..', 'dist');
  const publicPath = path.join(__dirname, '..', 'public');
  const assetsPath = path.join(__dirname, '..', 'assets');
  
  let totalAssetSize = 0;
  const assetTypes = {};
  
  [distPath, publicPath, assetsPath].forEach(dirPath => {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath, { recursive: true });
      
      files.forEach(file => {
        if (typeof file === 'string') {
          const filePath = path.join(dirPath, file);
          
          try {
            const stats = fs.statSync(filePath);
            if (stats.isFile()) {
              const ext = path.extname(file).toLowerCase();
              
              // Skip JS bundles (already counted) and maps
              if (['.js', '.map', '.txt'].includes(ext)) return;
              
              if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.icns'].includes(ext)) {
                assetTypes.images = (assetTypes.images || 0) + stats.size;
                totalAssetSize += stats.size;
              } else if (['.css'].includes(ext)) {
                assetTypes.styles = (assetTypes.styles || 0) + stats.size;
                totalAssetSize += stats.size;
              } else if (['.html'].includes(ext)) {
                assetTypes.html = (assetTypes.html || 0) + stats.size;
                totalAssetSize += stats.size;
              }
            }
          } catch (error) {
            // Skip files that can't be accessed
          }
        }
      });
    }
  });
  
  Object.entries(assetTypes).forEach(([type, size]) => {
    const sizeKB = (size / 1024).toFixed(2);
    console.log(`  ${type.padEnd(15)} ${sizeKB.padStart(8)} KB`);
  });
  
  const totalAssetKB = (totalAssetSize / 1024).toFixed(2);
  console.log(`\n  Total Assets: ${totalAssetKB} KB`);
  
  return { totalAssetSize, assetTypes };
}

// Performance Recommendations
function generateRecommendations(bundleData, assetData) {
  console.log('\n🎯 Performance Recommendations');
  console.log('==============================');
  
  const recommendations = [];
  
  // Bundle size recommendations
  if (bundleData.totalSize > 2 * 1024 * 1024) {
    recommendations.push({
      category: 'Bundle Size',
      priority: 'High',
      issue: 'Large bundle size detected',
      recommendation: 'Implement code splitting using React.lazy() and dynamic imports'
    });
  }
  
  // Vendor chunk analysis
  const vendorChunks = bundleData.bundleInfo.filter(info => info.category.includes('Vendor'));
  const totalVendorSize = vendorChunks.reduce((sum, chunk) => sum + chunk.size, 0);
  
  if (totalVendorSize > 500 * 1024) { // > 500KB
    recommendations.push({
      category: 'Vendor Chunks',
      priority: 'Medium',
      issue: 'Large vendor chunks detected',
      recommendation: 'Consider tree shaking and removing unused dependencies'
    });
  }
  
  // Main bundle analysis
  const mainBundle = bundleData.bundleInfo.find(info => info.category === 'Main Bundle');
  if (mainBundle && mainBundle.size > 1 * 1024 * 1024) { // > 1MB
    recommendations.push({
      category: 'Main Bundle',
      priority: 'Medium',
      issue: 'Large main bundle detected',
      recommendation: 'Split components into separate chunks, use lazy loading for pages'
    });
  }
  
  // Asset recommendations
  if (assetData.assetTypes.images && assetData.assetTypes.images > 1 * 1024 * 1024) {
    recommendations.push({
      category: 'Images',
      priority: 'Low',
      issue: 'Large image assets detected',
      recommendation: 'Optimize images, use WebP format, implement lazy loading'
    });
  }
  
  // General recommendations
  recommendations.push({
    category: 'General',
    priority: 'Low',
    issue: 'Performance monitoring',
    recommendation: 'Implement React DevTools Profiler for component performance monitoring'
  });
  
  recommendations.push({
    category: 'General',
    priority: 'Low',
    issue: 'Memory management',
    recommendation: 'Use React.memo for expensive components, cleanup event listeners'
  });
  
  // Display recommendations
  if (recommendations.length === 0) {
    console.log('  ✅ No performance issues detected! Your bundle is well optimized.');
  } else {
    recommendations.forEach((rec, index) => {
      const priority = rec.priority === 'High' ? '🔴' : rec.priority === 'Medium' ? '🟡' : '🟢';
      console.log(`\n  ${priority} ${rec.category} (${rec.priority} Priority)`);
      console.log(`     Issue: ${rec.issue}`);
      console.log(`     Fix: ${rec.recommendation}`);
    });
  }
  
  return recommendations;
}

// Performance Metrics Summary
function generateSummary(bundleData, assetData, recommendations) {
  console.log('\n📊 Performance Summary');
  console.log('=====================');
  
  const totalKB = ((bundleData.totalSize + assetData.totalAssetSize) / 1024).toFixed(2);
  const bundleKB = (bundleData.totalSize / 1024).toFixed(2);
  const assetKB = (assetData.totalAssetSize / 1024).toFixed(2);
  
  console.log(`  Total App Size:     ${totalKB} KB`);
  console.log(`  JavaScript Bundle:  ${bundleKB} KB`);
  console.log(`  Static Assets:      ${assetKB} KB`);
  
  // Performance Score
  let score = 100;
  recommendations.forEach(rec => {
    if (rec.priority === 'High') score -= 20;
    else if (rec.priority === 'Medium') score -= 10;
    else score -= 5;
  });
  
  score = Math.max(0, score);
  
  const scoreEmoji = score >= 90 ? '🟢' : score >= 70 ? '🟡' : '🔴';
  console.log(`\n  Performance Score: ${scoreEmoji} ${score}/100`);
  
  // Performance grade
  let grade = 'A';
  if (score < 90) grade = 'B';
  if (score < 80) grade = 'C';
  if (score < 70) grade = 'D';
  if (score < 60) grade = 'F';
  
  console.log(`  Performance Grade: ${grade}`);
  
  return { score, grade, totalKB };
}

// Export performance data
function exportPerformanceData(bundleData, assetData, recommendations, summary) {
  const performanceReport = {
    timestamp: new Date().toISOString(),
    bundle: {
      totalSize: bundleData.totalSize,
      files: bundleData.bundleInfo
    },
    assets: {
      totalSize: assetData.totalAssetSize,
      breakdown: assetData.assetTypes
    },
    recommendations: recommendations,
    summary: {
      score: summary.score,
      grade: summary.grade,
      totalKB: summary.totalKB
    }
  };
  
  const reportPath = path.join(__dirname, '..', 'performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(performanceReport, null, 2));
  
  console.log(`\n💾 Performance report saved to: performance-report.json`);
  
  return performanceReport;
}

// Main execution
function main() {
  try {
    const bundleData = analyzeBundleSize();
    const assetData = analyzeAssets();
    const recommendations = generateRecommendations(bundleData, assetData);
    const summary = generateSummary(bundleData, assetData, recommendations);
    
    exportPerformanceData(bundleData, assetData, recommendations, summary);
    
    console.log('\n✅ Performance analysis complete!');
    console.log('📈 Use this data to optimize your application performance.\n');
    
  } catch (error) {
    console.error('❌ Error during performance analysis:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  analyzeBundleSize,
  analyzeAssets,
  generateRecommendations,
  generateSummary,
  exportPerformanceData
}; 