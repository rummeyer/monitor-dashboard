#!/bin/sh
# Installs Monitor Dashboard for Caddy: the page into /var/www/monitor-dashboard,
# and the Caddyfile as Caddy's, the one there before kept beside it. Run again
# after an update.
#
#   sudo ./install.sh
set -eu
cd "$(dirname "$0")"

if ! command -v caddy >/dev/null 2>&1; then
  echo "Caddy is not installed: sudo apt install caddy" >&2
  exit 1
fi

install -d /var/www/monitor-dashboard
install -m 644 web/* /var/www/monitor-dashboard/

if [ -f /etc/caddy/Caddyfile ] && ! cmp -s Caddyfile /etc/caddy/Caddyfile; then
  cp /etc/caddy/Caddyfile "/etc/caddy/Caddyfile.bak-$(date +%Y%m%d-%H%M%S)"
fi
install -m 644 Caddyfile /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
systemctl reload caddy || systemctl restart caddy
echo "Monitor Dashboard: http://$(hostname).local/"
