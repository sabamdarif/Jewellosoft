# JewelloSoft Desktop Build Guide

This directory contains the Electron wrapper that converts the existing React + Django architecture into a standalone, offline-first Windows `.exe` application.

## Prerequisites
1. **Node.js**: Ensure Node.js (v18+) is installed.
2. **Python**: Ensure Python (v3.10+) is installed and accessible in the system PATH.
3. **Waitress**: Must be installed in your Python environment (`pip install waitress`).

## Development Mode

To start the application in development mode (spawns both the Electron window and the Waitress-bound Django server locally):

1. Open your terminal in the `jewelloSoft/frontend` folder and run:
   ```bash
   npm run build
   ```
2. Open your terminal in this `jewelloSoft/desktop` folder and run:
   ```bash
   npm start
   ```

## Production Build (Creating the Installer)

To generate a professional Windows NSIS Installer (`JewelloSoft Setup 1.0.0.exe`):

1. **Build Frontend**: Ensure the latest frontend changes are compiled.
   ```bash
   cd ../frontend
   npm run build
   ```
2. **Build Desktop Installer**:
   ```bash
   cd ../desktop
   npm install    # Installs electron/electron-builder
   npm run build  # Triggers electron-builder --win
   ```

3. **Output**:
   Once the build completes, the standalone installer out will be located at:
   `desktop/dist/JewelloSoft Setup 1.0.0.exe`

## Offline-First Architecture Notes

### Dynamic Porting
The app automatically scans for an open TCP port on loopback and injects it into Waitress to ensure the app never crashes due to generic `EADDRINUSE` errors if another app is hosting on port 8000.

### Data Safety
All persistent backend data has been moved to safely survive updates and uninstalls using `JEWELLOSOFT_DATA_PATH`:
- **Database (`db.sqlite3`)**: Saved to `AppData/Roaming/jewello-soft/JewelloSoft_Data`
- **Images (`/media/`)**: Saved to `AppData/Roaming/jewello-soft/JewelloSoft_Data/media`
- **Logs (`/logs/`)**: Saved to `AppData/Roaming/jewello-soft/JewelloSoft_Data/logs`

### Future Upgrades (Phase 2)
Currently, the Electron process boots the raw Python source via Waitress (`python run_waitress.py`). For maximum distribution where end-users don't have Python installed, Phase 2 should compile the `/backend/` directory into a standalone `backend.exe` via PyInstaller, and have `main.js` spawn `backend.exe` directly.
