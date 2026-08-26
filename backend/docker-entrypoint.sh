#!/bin/sh
set -e

echo "Waiting for PostgreSQL migrations..."
i=0
until npx prisma migrate deploy; do
  i=$((i+1))
  if [ "$i" -gt 30 ]; then
    echo "Prisma migrate failed"
    exit 1
  fi
  echo "Retry migrate ($i)..."
  sleep 2
done

exec node src/index.js
