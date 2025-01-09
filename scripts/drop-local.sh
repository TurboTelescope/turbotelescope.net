#!/bin/bash
set -eo pipefail

dropdb -h postgres -p 5432 -U postgres turbo
