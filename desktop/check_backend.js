const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const backendExePath = path.join(__dirname, '../backend/dist/backend.exe');

if (!fs.existsSync(backendExePath)) {
  console.log('\n[PREBUILD] Backend executable not found at: ' + backendExePath);
  console.log('[PREBUILD] Building it automatically using PyInstaller...');
  try {
    const backendDir = path.join(__dirname, '../backend');
    // Using the specifically crafted Waitress production script to create the exe
    execSync('python build_backend.py', { cwd: backendDir, stdio: 'inherit' });
    if (!fs.existsSync(backendExePath)) {
      console.error('\n[PREBUILD ERROR] Build script completed but backend.exe still not found!');
      process.exit(1);
    }
    console.log('[PREBUILD] Backend compiled successfully!\n');
  } catch (err) {
    console.error('\n[PREBUILD ERROR] Failed to build backend', err);
    process.exit(1);
  }
} else {
  console.log('\n[PREBUILD] Backend executable found. Proceeding with electron build.\n');
}
