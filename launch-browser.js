#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');

console.log('🚀 Launching Semantic Chatbot (Browser Mode)');
console.log('============================================');

// Function to open browser
function openBrowser(url = 'http://localhost:4200') {
  console.log(`🌐 Opening browser to ${url}...`);
  
  let command;
  if (process.platform === 'win32') {
    command = `start ${url}`;
  } else if (process.platform === 'darwin') {
    command = `open ${url}`;
  } else {
    command = `xdg-open ${url}`;
  }
  
  exec(command, (error) => {
    if (error) {
      console.log('⚠️ Could not auto-open browser. Please manually navigate to http://localhost:4200');
    } else {
      console.log('✅ Browser opened successfully!');
    }
  });
}

console.log('🔧 Starting .NET Core API...');
const apiProcess = spawn('dotnet', ['run'], {
  cwd: path.join(__dirname, 'ChatbotApi'),
  stdio: 'inherit'
});

console.log('🅰️ Starting Angular frontend...');
const angularProcess = spawn('npm', ['run', 'start:dev'], {
  cwd: path.join(__dirname, 'chatbot-frontend'),
  stdio: 'inherit',
  shell: true
});

// Open browser after a delay
setTimeout(() => {
  openBrowser();
}, 8000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  apiProcess.kill('SIGTERM');
  angularProcess.kill('SIGTERM');
  process.exit(0);
});

process.on('exit', () => {
  apiProcess.kill('SIGTERM');
  angularProcess.kill('SIGTERM');
});
