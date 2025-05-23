#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Memory Profiler for Aerotage Time Reporting App
 * Phase 7 - Polish & Testing
 */

console.log('🧠 Aerotage Time App - Memory Profiler');
console.log('======================================\n');

// Memory usage analysis
function analyzeMemoryUsage() {
  console.log('💾 Memory Usage Analysis');
  console.log('-----------------------');
  
  const memUsage = process.memoryUsage();
  const formatBytes = (bytes) => {
    const mb = (bytes / 1024 / 1024).toFixed(2);
    return `${mb} MB`;
  };
  
  console.log(`  RSS (Resident Set Size):    ${formatBytes(memUsage.rss)}`);
  console.log(`  Heap Total:                 ${formatBytes(memUsage.heapTotal)}`);
  console.log(`  Heap Used:                  ${formatBytes(memUsage.heapUsed)}`);
  console.log(`  External Memory:            ${formatBytes(memUsage.external)}`);
  console.log(`  Array Buffers:              ${formatBytes(memUsage.arrayBuffers)}`);
  
  const heapUsagePercentage = ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(2);
  console.log(`\n  Heap Usage Percentage:      ${heapUsagePercentage}%`);
  
  return {
    rss: memUsage.rss,
    heapTotal: memUsage.heapTotal,
    heapUsed: memUsage.heapUsed,
    external: memUsage.external,
    arrayBuffers: memUsage.arrayBuffers,
    heapUsagePercentage: parseFloat(heapUsagePercentage)
  };
}

// Analyze potential memory leaks
function analyzeMemoryLeaks() {
  console.log('\n🔍 Memory Leak Analysis');
  console.log('----------------------');
  
  const srcPath = path.join(__dirname, '..', 'src');
  const potentialLeaks = [];
  
  // Search for common memory leak patterns
  function searchInFile(filePath, fileName) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmedLine = line.trim();
        
        // Check for event listeners without cleanup
        if (trimmedLine.includes('addEventListener') && !content.includes('removeEventListener')) {
          potentialLeaks.push({
            file: fileName,
            line: lineNum,
            issue: 'Event listener without cleanup',
            code: trimmedLine.substring(0, 80),
            severity: 'medium'
          });
        }
        
        // Check for setInterval without clearInterval
        if (trimmedLine.includes('setInterval') && !content.includes('clearInterval')) {
          potentialLeaks.push({
            file: fileName,
            line: lineNum,
            issue: 'setInterval without clearInterval',
            code: trimmedLine.substring(0, 80),
            severity: 'high'
          });
        }
        
        // Check for setTimeout in useEffect without cleanup
        if (trimmedLine.includes('setTimeout') && content.includes('useEffect')) {
          const useEffectMatch = content.match(/useEffect\([^}]+setTimeout[^}]+\}/g);
          if (useEffectMatch && !useEffectMatch.some(effect => effect.includes('clearTimeout'))) {
            potentialLeaks.push({
              file: fileName,
              line: lineNum,
              issue: 'setTimeout in useEffect without cleanup',
              code: trimmedLine.substring(0, 80),
              severity: 'medium'
            });
          }
        }
        
        // Check for fetch/axios without abort controller
        if ((trimmedLine.includes('fetch(') || trimmedLine.includes('axios.')) && 
            content.includes('useEffect') && !content.includes('AbortController')) {
          potentialLeaks.push({
            file: fileName,
            line: lineNum,
            issue: 'HTTP request without abort controller',
            code: trimmedLine.substring(0, 80),
            severity: 'low'
          });
        }
        
        // Check for large arrays or objects that might not be cleaned up
        if (trimmedLine.includes('useState') && (trimmedLine.includes('[]') || trimmedLine.includes('{}'))) {
          if (trimmedLine.length > 100) { // Heuristic for potentially large initial state
            potentialLeaks.push({
              file: fileName,
              line: lineNum,
              issue: 'Large initial state in useState',
              code: trimmedLine.substring(0, 80),
              severity: 'low'
            });
          }
        }
      });
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  // Recursively search through source files
  function searchDirectory(dirPath, relativePath = '') {
    try {
      const items = fs.readdirSync(dirPath);
      
      items.forEach(item => {
        const fullPath = path.join(dirPath, item);
        const relativeItemPath = path.join(relativePath, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          searchDirectory(fullPath, relativeItemPath);
        } else if (stats.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.jsx') || item.endsWith('.js'))) {
          searchInFile(fullPath, relativeItemPath);
        }
      });
    } catch (error) {
      // Skip directories that can't be accessed
    }
  }
  
  if (fs.existsSync(srcPath)) {
    searchDirectory(srcPath);
  }
  
  // Display results
  if (potentialLeaks.length === 0) {
    console.log('  ✅ No obvious memory leak patterns detected!');
  } else {
    const grouped = potentialLeaks.reduce((acc, leak) => {
      if (!acc[leak.severity]) acc[leak.severity] = [];
      acc[leak.severity].push(leak);
      return acc;
    }, {});
    
    ['high', 'medium', 'low'].forEach(severity => {
      if (grouped[severity]) {
        const emoji = severity === 'high' ? '🔴' : severity === 'medium' ? '🟡' : '🟢';
        console.log(`\n  ${emoji} ${severity.toUpperCase()} Priority Issues (${grouped[severity].length}):`);
        
        grouped[severity].forEach(leak => {
          console.log(`     ${leak.file}:${leak.line} - ${leak.issue}`);
          console.log(`     Code: ${leak.code}...`);
        });
      }
    });
  }
  
  return potentialLeaks;
}

// Memory optimization recommendations
function generateMemoryRecommendations(memoryData, leaks) {
  console.log('\n🎯 Memory Optimization Recommendations');
  console.log('=====================================');
  
  const recommendations = [];
  
  // Memory usage recommendations
  if (memoryData.heapUsagePercentage > 80) {
    recommendations.push({
      category: 'Heap Usage',
      priority: 'High',
      issue: 'High heap usage detected',
      recommendation: 'Implement memory profiling and reduce object retention'
    });
  } else if (memoryData.heapUsagePercentage > 60) {
    recommendations.push({
      category: 'Heap Usage',
      priority: 'Medium',
      issue: 'Moderate heap usage detected',
      recommendation: 'Monitor memory usage and optimize heavy components'
    });
  }
  
  // RSS memory recommendations
  const rssMB = memoryData.rss / 1024 / 1024;
  if (rssMB > 200) {
    recommendations.push({
      category: 'RSS Memory',
      priority: 'High',
      issue: 'High RSS memory usage',
      recommendation: 'Profile memory usage and implement cleanup strategies'
    });
  } else if (rssMB > 100) {
    recommendations.push({
      category: 'RSS Memory',
      priority: 'Medium',
      issue: 'Moderate RSS memory usage',
      recommendation: 'Consider implementing lazy loading and component optimization'
    });
  }
  
  // Leak-based recommendations
  const highPriorityLeaks = leaks.filter(leak => leak.severity === 'high').length;
  const mediumPriorityLeaks = leaks.filter(leak => leak.severity === 'medium').length;
  
  if (highPriorityLeaks > 0) {
    recommendations.push({
      category: 'Memory Leaks',
      priority: 'High',
      issue: `${highPriorityLeaks} high-priority memory leak patterns detected`,
      recommendation: 'Fix event listeners and intervals without proper cleanup'
    });
  }
  
  if (mediumPriorityLeaks > 0) {
    recommendations.push({
      category: 'Memory Leaks',
      priority: 'Medium',
      issue: `${mediumPriorityLeaks} medium-priority memory leak patterns detected`,
      recommendation: 'Review useEffect hooks and ensure proper cleanup'
    });
  }
  
  // General recommendations
  recommendations.push({
    category: 'General',
    priority: 'Low',
    issue: 'Component optimization',
    recommendation: 'Use React.memo for expensive components to prevent unnecessary re-renders'
  });
  
  recommendations.push({
    category: 'General',
    priority: 'Low',
    issue: 'State management',
    recommendation: 'Consider using useCallback and useMemo for expensive computations'
  });
  
  // Display recommendations
  if (recommendations.length === 0) {
    console.log('  ✅ No memory optimization issues detected!');
  } else {
    recommendations.forEach(rec => {
      const priority = rec.priority === 'High' ? '🔴' : rec.priority === 'Medium' ? '🟡' : '🟢';
      console.log(`\n  ${priority} ${rec.category} (${rec.priority} Priority)`);
      console.log(`     Issue: ${rec.issue}`);
      console.log(`     Fix: ${rec.recommendation}`);
    });
  }
  
  return recommendations;
}

// Memory report summary
function generateMemorySummary(memoryData, leaks, recommendations) {
  console.log('\n📊 Memory Profile Summary');
  console.log('========================');
  
  const rssMB = (memoryData.rss / 1024 / 1024).toFixed(2);
  const heapUsedMB = (memoryData.heapUsed / 1024 / 1024).toFixed(2);
  
  console.log(`  RSS Memory:         ${rssMB} MB`);
  console.log(`  Heap Memory:        ${heapUsedMB} MB`);
  console.log(`  Heap Usage:         ${memoryData.heapUsagePercentage}%`);
  console.log(`  Potential Leaks:    ${leaks.length} issues found`);
  
  // Memory health score
  let score = 100;
  recommendations.forEach(rec => {
    if (rec.priority === 'High') score -= 25;
    else if (rec.priority === 'Medium') score -= 15;
    else score -= 5;
  });
  
  score = Math.max(0, score);
  
  const scoreEmoji = score >= 90 ? '🟢' : score >= 70 ? '🟡' : '🔴';
  console.log(`\n  Memory Health Score: ${scoreEmoji} ${score}/100`);
  
  // Memory grade
  let grade = 'A';
  if (score < 90) grade = 'B';
  if (score < 80) grade = 'C';
  if (score < 70) grade = 'D';
  if (score < 60) grade = 'F';
  
  console.log(`  Memory Grade: ${grade}`);
  
  return { score, grade, rssMB, heapUsedMB };
}

// Export memory profile data
function exportMemoryProfile(memoryData, leaks, recommendations, summary) {
  const memoryProfile = {
    timestamp: new Date().toISOString(),
    memory: memoryData,
    leaks: leaks,
    recommendations: recommendations,
    summary: summary
  };
  
  const reportPath = path.join(__dirname, '..', 'memory-profile.json');
  fs.writeFileSync(reportPath, JSON.stringify(memoryProfile, null, 2));
  
  console.log(`\n💾 Memory profile saved to: memory-profile.json`);
  
  return memoryProfile;
}

// Main execution
function main() {
  try {
    console.log('Starting memory analysis...\n');
    
    const memoryData = analyzeMemoryUsage();
    const leaks = analyzeMemoryLeaks();
    const recommendations = generateMemoryRecommendations(memoryData, leaks);
    const summary = generateMemorySummary(memoryData, leaks, recommendations);
    
    exportMemoryProfile(memoryData, leaks, recommendations, summary);
    
    console.log('\n✅ Memory profiling complete!');
    console.log('🧠 Use this data to optimize your application memory usage.\n');
    
  } catch (error) {
    console.error('❌ Error during memory profiling:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  analyzeMemoryUsage,
  analyzeMemoryLeaks,
  generateMemoryRecommendations,
  generateMemorySummary,
  exportMemoryProfile
}; 