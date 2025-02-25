#!/bin/bash -i

set -eo pipefail
echo "🚀 Setting up turbotelescope.net devcontainer..."

# Install postgres client
sudo sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
sudo apt update -y
sudo apt install -y postgresql-16

echo "Initializing submodules"
git submodule update --init --recursive

echo "📦 Installing repo dependencies..."
npm install --global corepack@latest
corepack install
corepack enable
pnpm install

echo "🏗️ Building..."
pnpm build

echo "✅ Devcontainer setup complete!"
echo "🙏 Thank you for contributing to turbotelescope.net!"
echo "📝 P.S Don't forget to configure your git credentials with 'git config --global user.name you' and 'git config --global user.email you@z.com'"
