import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')

import sys
import django
from django.core.management import execute_from_command_line
from waitress import serve
from config.wsgi import application

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    host = '127.0.0.1'
    
    # Automatically apply all migrations to the AppData SQLite database before boot
    print("Applying automatic database migrations for installation...", flush=True)
    execute_from_command_line(['manage.py', 'migrate'])
    print("Migrations complete.", flush=True)

    # Automatically seed the singleton Desktop App Store
    try:
        from apps.accounts.models import Shop
        if not Shop.objects.exists():
            print("Seeding default Shop for offline mode...", flush=True)
            Shop.objects.create(
                name='My Jewellery Shop',
                owner_name='Admin',
                phone='0000000000',
                address='Shop Address'
            )
    except Exception as e:
        print(f"Failed to seed shop: {e}", flush=True)

    print(f"Starting Waitress server on {host}:{port}", flush=True)
    serve(application, host=host, port=port)
