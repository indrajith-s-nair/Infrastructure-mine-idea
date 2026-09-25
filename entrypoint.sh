#!/bin/bash
set -e

echo "=========================================================="
echo " Starting DPIP Civic Grievance Redressal Unified Container"
echo "=========================================================="

# Default to SQLite if PostgreSQL host is not set
if [ -z "$DB_HOST" ] && [ -z "$DATABASE_URL" ]; then
    export USE_SQLITE="true"
    echo ">> No external DB_HOST provided. Initializing self-contained SQLite database."
fi

cd /app/backend

echo ">> Running database migrations..."
python manage.py migrate --noinput

echo ">> Ensuring standard jurisdictional officer & triage credentials..."
python manage.py seed_data || echo "Seed data command completed."

echo ">> Collecting Django static assets..."
python manage.py collectstatic --noinput --clear || echo "Collectstatic completed."

# Setup graceful termination handler
trap_exit() {
    echo ">> Stopping all DPIP server processes..."
    kill -TERM "$GUNICORN_PID" 2>/dev/null || true
    kill -TERM "$NEXT_PID" 2>/dev/null || true
    wait "$GUNICORN_PID" 2>/dev/null || true
    wait "$NEXT_PID" 2>/dev/null || true
    echo ">> DPIP Container stopped gracefully."
    exit 0
}
trap trap_exit SIGTERM SIGINT

echo ">> Launching Django Gunicorn Backend Service on port 8000..."
gunicorn dpi_core.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --threads 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - &
GUNICORN_PID=$!

echo ">> Launching Next.js Frontend Service on port 3000..."
if [ -f "/app/frontend/server.js" ]; then
    echo ">> Found server.js in /app/frontend"
    cd /app/frontend
    PORT=3000 HOSTNAME=0.0.0.0 node server.js &
    NEXT_PID=$!
elif [ -f "/app/frontend/frontend/server.js" ]; then
    echo ">> Found server.js in /app/frontend/frontend"
    cd /app/frontend/frontend
    PORT=3000 HOSTNAME=0.0.0.0 node server.js &
    NEXT_PID=$!
elif [ -f "/app/frontend/.next/standalone/frontend/server.js" ]; then
    echo ">> Found server.js in /app/frontend/.next/standalone/frontend"
    cd /app/frontend/.next/standalone/frontend
    PORT=3000 HOSTNAME=0.0.0.0 node server.js &
    NEXT_PID=$!
elif [ -f "/app/frontend/.next/standalone/server.js" ]; then
    echo ">> Found server.js in /app/frontend/.next/standalone"
    cd /app/frontend/.next/standalone
    PORT=3000 HOSTNAME=0.0.0.0 node server.js &
    NEXT_PID=$!
else
    echo ">> Fallback: starting in /app/frontend..."
    cd /app/frontend
    node server.js || npm start -- -p 3000 -H 0.0.0.0 &
    NEXT_PID=$!
fi

echo ">> All DPIP services active! Frontend: http://0.0.0.0:3000 | Backend: http://0.0.0.0:8000"

# Wait for both processes
wait -n "$GUNICORN_PID" "$NEXT_PID"
