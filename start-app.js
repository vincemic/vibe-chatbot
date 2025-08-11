const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Semantic Chatbot Application');
console.log('==========================================');

let apiReady = false;
let angularReady = false;
let browserOpened = false;

// Function to open browser
function openBrowser() {
  if (browserOpened) return;
  browserOpened = true;
  
  console.log('🌐 Opening browser...');
  const open = require('child_process').spawn;
  
  // Cross-platform browser opening
  let command;
  let args;
  
  if (process.platform === 'win32') {
    command = 'cmd';
    args = ['/c', 'start', 'http://localhost:4200'];
  } else if (process.platform === 'darwin') {
    command = 'open';
    args = ['http://localhost:4200'];
  } else {
    command = 'xdg-open';
    args = ['http://localhost:4200'];
  }
  
  open(command, args, { stdio: 'ignore' });
}

// Start the .NET API
console.log('🔧 Starting .NET Core API...');
const apiProcess = spawn('dotnet', ['run'], {
  cwd: path.join(__dirname, 'ChatbotApi'),
  stdio: 'pipe'
});

apiProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(`API: ${output.trim()}`);
  
  // Check if API is ready
  if (output.includes('Now listening on:') || output.includes('Application started')) {
    apiReady = true;
    console.log('✅ API is ready!');
    
    // Check if both are ready to open browser
    if (angularReady && !browserOpened) {
      setTimeout(openBrowser, 2000);
    }
  }
});

apiProcess.stderr.on('data', (data) => {
  console.error(`API Error: ${data}`);
});

// Wait a bit for the API to start, then start Angular
setTimeout(() => {
  console.log('🅰️ Starting Angular frontend...');
  const angularProcess = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'chatbot-frontend'),
    stdio: 'pipe',
    shell: true
  });

  angularProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`Angular: ${output.trim()}`);
    
    // Check if Angular is ready
    if (output.includes('webpack compiled') || output.includes('Local:') || output.includes('Application bundle generation complete')) {
      if (!angularReady) {
        angularReady = true;
        console.log('✅ Angular is ready!');
        
        // Check if both are ready to open browser
        if (apiReady && !browserOpened) {
          setTimeout(openBrowser, 2000);
        } else if (!apiReady) {
          // If API isn't ready yet, wait a bit more
          setTimeout(() => {
            if (!browserOpened) openBrowser();
          }, 5000);
        }
      }
    }
  });

  angularProcess.stderr.on('data', (data) => {
    console.error(`Angular Error: ${data}`);
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('🛑 Shutting down...');
    apiProcess.kill();
    angularProcess.kill();
    process.exit();
  });
}, 3000);

// Keep the process alive
process.on('exit', () => {
  apiProcess.kill();
});
