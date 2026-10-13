#!/usr/bin/env bash
# Tanyora VPS deploy (Ubuntu/Debian). Run as a sudo user ON the VPS:
#   bash deploy-vps.sh <git-repo-url> <domain>
# Example: bash deploy-vps.sh https://github.com/you/tanyora.git tanyora.com
# Does NOT touch other apps: uses its own folder, PM2 name, port and Nginx file.
set -euo pipefail
REPO="${1:?git repo url required}"
DOMAIN="${2:-}"
APP_DIR=/var/www/tanyora
PORT=3100

sudo apt-get update -y
sudo apt-get install -y git nginx curl
if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
command -v bun >/dev/null || { curl -fsSL https://bun.sh/install | bash; export PATH="$HOME/.bun/bin:$PATH"; }
command -v pm2 >/dev/null || sudo npm i -g pm2

sudo mkdir -p "$APP_DIR" && sudo chown "$USER" "$APP_DIR"
if [ -d "$APP_DIR/.git" ]; then git -C "$APP_DIR" pull; else git clone "$REPO" "$APP_DIR"; fi
cd "$APP_DIR"

# Secrets live only in .env.production on the server (chmod 600), never in git.
if [ ! -f .env.production ]; then
  cp deploy/env.production.example .env.production
  chmod 600 .env.production
  echo ">> Fill in $APP_DIR/.env.production, then re-run this script."; exit 1
fi
set -a; . ./.env.production; set +a

bun install --frozen-lockfile
NITRO_PRESET=node-server bun run build

PORT=$PORT pm2 startOrReload deploy/ecosystem.config.cjs --update-env
pm2 save
sudo env PATH="$PATH" pm2 startup systemd -u "$USER" --hp "$HOME" >/dev/null || true

if [ -n "$DOMAIN" ]; then
  sed "s/__DOMAIN__/$DOMAIN/g; s/__PORT__/$PORT/g" deploy/nginx-tanyora.conf | sudo tee /etc/nginx/sites-available/tanyora >/dev/null
  sudo ln -sf /etc/nginx/sites-available/tanyora /etc/nginx/sites-enabled/tanyora
  sudo nginx -t && sudo systemctl reload nginx
  echo ">> After DNS points to this VPS: sudo apt install -y certbot python3-certbot-nginx && sudo certbot --nginx -d $DOMAIN -d app.$DOMAIN"
fi
sleep 3
curl -fsS -o /dev/null -w "Local check: HTTP %{http_code}\n" "http://127.0.0.1:$PORT/"
