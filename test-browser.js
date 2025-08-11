#!/usr/bin/env node

const { exec } = require('child_process');

console.log('🧪 Testing browser launch functionality...');

function testBrowserOpen() {
  console.log('🌐 Attempting to open browser...');
  
  let command;
  if (process.platform === 'win32') {
    command = 'start http://localhost:4200';
  } else if (process.platform === 'darwin') {
    command = 'open http://localhost:4200';
  } else {
    command = 'xdg-open http://localhost:4200';
  }
  
  console.log(`📋 Command: ${command}`);
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Browser open failed:', error.message);
      console.log('💡 Manual option: Navigate to http://localhost:4200 in your browser');
    } else {
      console.log('✅ Browser command executed successfully!');
      if (stdout) console.log('📤 Output:', stdout);
      if (stderr) console.log('⚠️ Stderr:', stderr);
    }
  });
}

testBrowserOpen();
