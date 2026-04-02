import os
import sys
import PyInstaller.__main__
from pathlib import Path

# Provide PyInstaller's Django hook with explicit settings resolution
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')

import django
django.setup()

# Paths
BACKEND_DIR = Path(__file__).resolve().parent
RUN_SCRIPT = BACKEND_DIR / "run_waitress.py"

# Hidden Imports required by Django's dynamic INSTALLED_APPS loading
HIDDEN_IMPORTS = [
    'waitress',
    'django.core.management',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    # Our internal apps
    'apps.accounts',
    'apps.billing',
    'apps.inventory',
    'apps.orders',
    'apps.rates',
    'apps.payments',
    'apps.customers',
    'apps.core',
    # Modules hiding inside apps
    'apps.accounts.apps',
    'apps.billing.apps',
    'apps.inventory.apps',
    'apps.orders.apps',
    'apps.rates.apps',
    'apps.payments.apps',
    'apps.customers.apps',
    'apps.core.apps',
]

print(">>> Starting Professional PyInstaller Compilation for JewelloSoft Backend <<<")

# Execute PyInstaller with our meticulously defined parameters
PyInstaller.__main__.run([
    str(RUN_SCRIPT),
    '--name=backend',
    '--onefile',       # Bundle everything into a single .exe
    '--noconfirm',     # Overwrite output directory without asking
    '--clean',         # Clean cache
    '--console',       # We need the console for Waitress to pipe stderr/stdout to Electron
] + [f'--hidden-import={imp}' for imp in HIDDEN_IMPORTS])

print(">>> PyInstaller Compilation Complete! Executable is located at backend/dist/backend.exe <<<")
