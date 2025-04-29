#!/bin/bash
set -eo pipefail

createdb -h postgres -p 5432 -U postgres turbo

pg_restore \
    -h postgres \
    -p 5432 \
    -U postgres \
    -F c \
    -d turbo \
    -v \
    -c \
    --no-owner \
    --no-privileges \
    --no-tablespaces \
    ./scripts/turbo_db_2025_01_09.dump

psql "postgresql://postgres:password@postgres:5432/turbo" -c "CREATE ROLE turbogroup;"
