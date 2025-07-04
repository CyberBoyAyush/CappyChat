#!/usr/bin/env node

/**
 * Changelog Update Script
 * 
 * This script helps generate changelog entries from git commits.
 * It analyzes commit messages and suggests changelog entries.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get commits since last tag or from a specific date
function getCommitsSince(since = '2024-01-01') {
  try {
    const command = `git log --pretty=format:"%h|%ad|%s|%an" --date=short --since="${since}"`;
    const output = execSync(command, { encoding: 'utf8' });
    
    return output.split('\n')
      .filter(Boolean)
      .map(line => {
        const [hash, date, message, author] = line.split('|');
        return { hash, date, message, author };
      });
  } catch (error) {
    console.error('Error getting commits:', error.message);
    return [];
  }
}

// Categorize commits based on conventional commit format
function categorizeCommit(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.startsWith('feat:') || lowerMessage.includes('add ') || lowerMessage.includes('implement')) {
    return 'new';
  } else if (lowerMessage.startsWith('fix:') || lowerMessage.includes('fix ') || lowerMessage.includes('bug')) {
    return 'fix';
  } else if (lowerMessage.startsWith('perf:') || lowerMessage.includes('improve') || lowerMessage.includes('enhance') || lowerMessage.includes('optimize')) {
    return 'improvement';
  } else if (lowerMessage.includes('security') || lowerMessage.includes('auth') || lowerMessage.includes('permission')) {
    return 'security';
  } else {
    return 'improvement'; // Default category
  }
}

// Extract feature title from commit message
function extractTitle(message) {
  // Remove conventional commit prefixes
  let title = message.replace(/^(feat|fix|docs|style|refactor|perf|test|chore):\s*/i, '');
  
  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);
  
  // Remove trailing periods
  title = title.replace(/\.$/, '');
  
  return title;
}

// Suggest icon based on commit message
function suggestIcon(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('image') || lowerMessage.includes('photo')) return 'Image';
  if (lowerMessage.includes('search') || lowerMessage.includes('tavily')) return 'Search';
  if (lowerMessage.includes('user') || lowerMessage.includes('auth')) return 'Users';
  if (lowerMessage.includes('memory') || lowerMessage.includes('brain')) return 'Brain';
  if (lowerMessage.includes('session') || lowerMessage.includes('manage')) return 'Monitor';
  if (lowerMessage.includes('ui') || lowerMessage.includes('interface')) return 'Settings';
  if (lowerMessage.includes('model') || lowerMessage.includes('ai')) return 'Cpu';
  if (lowerMessage.includes('performance') || lowerMessage.includes('speed')) return 'Zap';
  if (lowerMessage.includes('security') || lowerMessage.includes('protect')) return 'Shield';
  if (lowerMessage.includes('doc') || lowerMessage.includes('readme')) return 'BookOpen';
  
  return 'Star'; // Default icon
}

// Suggest color based on feature type
function suggestColor(type) {
  const colorMap = {
    'new': 'purple',
    'improvement': 'blue',
    'fix': 'green',
    'security': 'red'
  };
  
  return colorMap[type] || 'gray';
}

// Main function
function main() {
  console.log('📝 Analyzing git commits for changelog...\n');
  
  const commits = getCommitsSince();
  
  if (commits.length === 0) {
    console.log('No commits found.');
    return;
  }
  
  console.log(`Found ${commits.length} commits:\n`);
  
  // Group commits by date for version suggestions
  const commitsByDate = commits.reduce((acc, commit) => {
    if (!acc[commit.date]) {
      acc[commit.date] = [];
    }
    acc[commit.date].push(commit);
    return acc;
  }, {});
  
  // Generate changelog suggestions
  Object.entries(commitsByDate).forEach(([date, dayCommits]) => {
    console.log(`\n📅 ${date} (${dayCommits.length} commits):`);
    
    dayCommits.forEach(commit => {
      const type = categorizeCommit(commit.message);
      const title = extractTitle(commit.message);
      const icon = suggestIcon(commit.message);
      const color = suggestColor(type);
      
      console.log(`  ${commit.hash} - ${type.toUpperCase()}: ${title}`);
      console.log(`    Icon: ${icon}, Color: ${color}`);
      console.log(`    Original: ${commit.message}`);
      console.log('');
    });
  });
  
  console.log('\n💡 Use this information to update lib/version.ts with new changelog entries.');
  console.log('💡 Remember to follow semantic versioning (major.minor.patch).');
}

if (require.main === module) {
  main();
}
