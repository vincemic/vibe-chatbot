#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const frontendDir = path.join(__dirname, 'chatbot-frontend');

console.log('🧪 Semantic Chatbot Test Runner');
console.log('================================\n');

const args = process.argv.slice(2);
const testType = args[0] || 'help';

function runCommand(command, args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    console.log(`📍 Running: ${command} ${args.join(' ')}`);
    console.log(`📁 Directory: ${cwd}\n`);
    
    const proc = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    proc.on('error', (error) => {
      reject(error);
    });
  });
}

async function runTests() {
  try {
    switch (testType) {
      case 'unit':
        console.log('🔬 Running Angular Unit Tests...\n');
        await runCommand('npm', ['run', 'test', '--', '--watch=false', '--browsers=ChromeHeadless'], frontendDir);
        break;

      case 'e2e':
        console.log('🌐 Running Playwright E2E Tests...\n');
        await runCommand('npm', ['run', 'e2e'], frontendDir);
        break;

      case 'e2e:ui':
        console.log('🎭 Running Playwright E2E Tests with UI...\n');
        await runCommand('npm', ['run', 'e2e:ui'], frontendDir);
        break;

      case 'e2e:headed':
        console.log('👀 Running Playwright E2E Tests in headed mode...\n');
        await runCommand('npm', ['run', 'e2e:headed'], frontendDir);
        break;

      case 'e2e:debug':
        console.log('🐛 Running Playwright E2E Tests in debug mode...\n');
        await runCommand('npm', ['run', 'e2e:debug'], frontendDir);
        break;

      case 'all':
        console.log('🚀 Running All Tests...\n');
        console.log('📝 Step 1: Unit Tests');
        await runCommand('npm', ['run', 'test', '--', '--watch=false', '--browsers=ChromeHeadless'], frontendDir);
        console.log('\n✅ Unit tests completed!\n');
        
        console.log('📝 Step 2: E2E Tests');
        await runCommand('npm', ['run', 'e2e'], frontendDir);
        console.log('\n✅ E2E tests completed!\n');
        break;

      case 'install':
        console.log('📦 Installing Test Dependencies...\n');
        await runCommand('npm', ['install'], frontendDir);
        await runCommand('npx', ['playwright', 'install'], frontendDir);
        break;

      case 'help':
      default:
        console.log('Usage: node test-runner.js [command]');
        console.log('\nAvailable commands:');
        console.log('  unit        - Run Angular unit tests');
        console.log('  e2e         - Run Playwright E2E tests (headless)');
        console.log('  e2e:ui      - Run Playwright E2E tests with UI');
        console.log('  e2e:headed  - Run Playwright E2E tests in headed mode');
        console.log('  e2e:debug   - Run Playwright E2E tests in debug mode');
        console.log('  all         - Run all tests (unit + e2e)');
        console.log('  install     - Install test dependencies');
        console.log('  help        - Show this help message');
        console.log('\nExamples:');
        console.log('  node test-runner.js unit');
        console.log('  node test-runner.js e2e');
        console.log('  node test-runner.js all');
        return;
    }

    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

runTests();
