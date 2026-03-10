#!/usr/bin/env bash
# Exit on error
set -o errexit

pip install -r requirements.txt

# Convert static files for Django Admin using Whitenoise
python manage.py collectstatic --no-input

# Run migrations (This creates the Like and Comment tables in PostgreSQL on Render)
python manage.py migrate
