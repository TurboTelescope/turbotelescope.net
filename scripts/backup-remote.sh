#!/bin/bash
set -eo pipefail

pg_dump -F c -b -v -f "turbo_db_2025_01_09.dump" -d turbo -U turbo
