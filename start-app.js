const { spawn } = require('child_process');
const path = require('path');

// Start the .NET API
console.log('Starting .NET Core API...');
const apiProcess = spawn('dotnet', ['run'], {
  cwd: path.join(__dirname, 'ChatbotApi'),
  stdio: 'pipe'
});

apiProcess.stdout.on('data', (data) => {
  console.log(`API: ${data}`);
});

apiProcess.stderr.on('data', (data) => {
  console.error(`API Error: ${data}`);
});

// Wait a bit for the API to start, then start Angular
setTimeout(() => {
  console.log('Starting Angular frontend...');
  const angularProcess = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'chatbot-frontend'),
    stdio: 'pipe',
    shell: true
  });

  angularProcess.stdout.on('data', (data) => {
    console.log(`Angular: ${data}`);
  });

  angularProcess.stderr.on('data', (data) => {
    console.error(`Angular Error: ${data}`);
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    apiProcess.kill();
    angularProcess.kill();
    process.exit();
  });
}, 3000);

// Keep the process alive
process.on('exit', () => {
  apiProcess.kill();
});
