
const portfinder = require('portfinder');
const { exec } = require('child_process');

const defaultPort = 9002; // You can change this default if needed
const nextJsArgs = '--turbopack --hostname 0.0.0.0'; // Next.js specific arguments

portfinder.getPortPromise({ port: defaultPort })
  .then((port) => {
    const command = `next dev -p ${port} ${nextJsArgs}`;
    console.log(`🚀 Starting Next.js on port ${port} with command: ${command}`);
    
    const nextProcess = exec(command);

    nextProcess.stdout.on('data', (data) => {
      process.stdout.write(data); // Pipe stdout to current process
    });

    nextProcess.stderr.on('data', (data) => {
      process.stderr.write(data); // Pipe stderr to current process
    });

    nextProcess.on('close', (code) => {
      console.log(`Next.js dev server exited with code ${code}`);
    });
    
    nextProcess.on('error', (err) => {
        console.error('❌ Failed to start Next.js dev server process:', err);
    });

  })
  .catch((err) => {
    console.error(`❌ Could not find an available port starting from ${defaultPort}. Error:`, err);
    process.exit(1); // Exit if port finding fails
  });
