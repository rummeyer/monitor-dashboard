<p align="center">
  <img src="https://raw.githubusercontent.com/rummeyer/monitor-dashboard/main/web/home.svg" alt="" width="120" height="120">
</p>

<h1 align="center">Monitor Dashboard</h1>

<p align="center">
  The dashboards of <b>Appliance Monitor</b>, <b>Synology Monitor</b> and <b>Connection Monitor</b> on one page &mdash; a <b>tab</b> each, in the look of Apple's Home app, served by <b>Caddy</b>.
</p>

<p align="center">
  <a href="https://github.com/rummeyer/monitor-dashboard/blob/main/LICENSE"><img src="https://img.shields.io/badge/licence-MIT-blue" alt="Licence"></a>
  <img src="https://img.shields.io/badge/Caddy-2-1f88c0" alt="Caddy 2">
  <img src="https://img.shields.io/badge/build-none-brightgreen" alt="No build">
</p>

<p align="center">
  <a href="https://buymeacoffee.com/rummeyer"><img src="https://img.shields.io/badge/donate-Buy%20Me%20a%20Coffee-yellow" alt="Buy Me a Coffee"></a>
</p>

---

Each of the three Homebridge plugins serves a dashboard of its own, on a port
of its own. This puts them on **one address** — `http://<this machine>/` —
with **tabs** to switch between them: **Appliances**, **Synology** and
**Connection**.

Every tab is the plugin's **own dashboard**, as it is: its charts, its
buttons, its looks. The tabs sit in each one under its header, and switching
the look — Home, light or dark — in one switches all three. A plugin that is
not installed, or whose dashboard is switched off, simply has no tab.

The plugins themselves stay as they are: opened on their own ports, their
dashboards look as they always did.

## Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Settings](#settings)
- [How it works](#how-it-works)
- [Only on the home network](#only-on-the-home-network)
- [Troubleshooting](#troubleshooting)
- [Support](#support)
- [Licence](#licence)

## Requirements

- One or more of [homebridge-appliance-monitor](https://github.com/rummeyer/homebridge-appliance-monitor),
  [homebridge-synology-monitor](https://github.com/rummeyer/homebridge-synology-monitor) and
  [homebridge-connection-monitor](https://github.com/rummeyer/homebridge-connection-monitor),
  each with its dashboard switched on
- **Caddy 2** on the same machine — `sudo apt install caddy` on Raspberry Pi
  OS and Debian — and port 80 free for it

## Installation

```bash
git clone https://github.com/rummeyer/monitor-dashboard.git
cd monitor-dashboard
sudo ./install.sh
```

It copies the page to `/var/www/monitor-dashboard` and the
[`Caddyfile`](Caddyfile) to `/etc/caddy/Caddyfile`, keeping the one there
before beside it, and reloads Caddy. Then open `http://<this machine>/`.

To update: `git pull`, then `sudo ./install.sh` again.

## Settings

The dashboards' ports are in the [`Caddyfile`](Caddyfile), the plugins'
defaults: 8582, 8583 and 8584. Change them there if yours differ, then run
`sudo ./install.sh` again.

The tabs, their names and order are in [`web/tabs.json`](web/tabs.json).

## How it works

```
 browser ──► Caddy :80 ─┬─ /             this page: index.html, overview.js, tabs.json
                        ├─ /appliances/  ──► Appliance Monitor's dashboard   localhost:8582
                        ├─ /synology/    ──► Synology Monitor's dashboard    localhost:8583
                        └─ /connection/  ──► Connection Monitor's dashboard  localhost:8584
```

### One address for all

Each plugin serves its dashboard on a port of its own. Caddy passes each one
through under a path of its own and takes the path off on the way in: a
request for `/synology/state` reaches Synology Monitor as `/state`. The
dashboards ask for their scripts, pictures and data by relative paths —
`state`, `api/live`, `theme.js` — so under `/synology/` they ask for
`/synology/state`, and work there as they are. Nothing in the plugins knows
about this page.

### Finding the plugins

There is nothing to set up in the plugins and nothing they announce. The
page knows the three that could be there from [`web/tabs.json`](web/tabs.json)
— a name, a path and the key each keeps its look under — and Caddy knows
their ports from the [`Caddyfile`](Caddyfile). As it opens, the page asks
each path once whether it answers (`HEAD /synology/`):

- **It answers**: the plugin is running with its dashboard switched on, and
  it gets a tab.
- **Caddy cannot reach it** — the plugin is not installed, its dashboard is
  off, or Homebridge is restarting — and Caddy answers 502: no tab.

So the tabs are whichever dashboards run at the moment the page is opened,
in the order of `tabs.json`. A plugin added later gets its tab on the next
reload — as long as its port is in the Caddyfile.

### The tabs inside each dashboard

The page itself shows nothing of its own: a frame per dashboard, the size of
the window, all loaded at once so that a tab switches without waiting; the
others are hidden. Because page and frames come from one address, the
browser lets the page reach into the frames, and as each one loads it

- puts the **tabs** in under the dashboard's header, styled with that
  dashboard's own colours, so they look as if they were its own;
- watches the dashboard's **look**: switched to Home, light or dark in one,
  it is switched in the other two, and stored under each one's key, so it
  stays the same on the next visit and on the dashboards' own ports;
- takes over the dashboard's **title and icon** for the browser tab.

The tab shown is in the address — `/#synology` — so a bookmark opens on it.

### Frames

The dashboards of Appliance Monitor and Synology Monitor forbid being shown
in a frame (`Content-Security-Policy: frame-ancestors 'none'`), so no other
website can put them in one. The Caddyfile changes that, on the way out, to
`frame-ancestors 'self'`: a frame of this address only. Opened on their own
ports, they forbid it as before.

## Only on the home network

The dashboards have no login: they show what is in your home, and Synology
Monitor's has buttons that shut a NAS down. So Caddy answers only the home
network:

```
@outside not remote_ip 127.0.0.0/8 10.0.0.0/8 172.16.0.0/12 192.168.0.0/16 169.254.0.0/16 ::1/128 fc00::/7 fe80::/10

route {
	respond @outside "Only from the home network" 403
	…
}
```

Loopback, the private ranges and link-local, IPv4 and IPv6: everything else
gets **403 Forbidden** and nothing of the dashboards, even if a port is
forwarded to this machine by mistake. The refusal comes first in a `route`,
whose order Caddy keeps: on its own, Caddy would pass a request to a
dashboard before refusing it.

This matters for Synology Monitor's buttons in particular. The dashboard
lets them be pressed only from the home network — but through Caddy every
request comes from this machine itself, which it lets in. The rule above is
what keeps the buttons to the home network here.

Caddy serves plain HTTP on port 80, with no certificate: it is meant for the
home network only. Do not forward port 80 — or the dashboards' own ports —
from the router. For the dashboards from outside, use a VPN into the home
network, such as the FRITZ!Box's or WireGuard, and open them as at home.

## Troubleshooting

**A tab is missing**: its dashboard does not answer. Is the plugin running,
its dashboard switched on, and its port in the Caddyfile its own?

**"None of the dashboards answers"**: Caddy cannot reach any of them; check
the ports, and `sudo journalctl -u caddy`.

**Caddy does not start: address already in use**: something else serves port
80, such as Apache — `sudo systemctl disable --now apache2` if nothing needs
it.

**403 "Only from the home network"**: the request did not come from a
private address. Through a VPN, check it gives the device an address in the
home network; behind another proxy, its address is the one Caddy sees.

## Support

Questions and bugs: [GitHub issues](https://github.com/rummeyer/monitor-dashboard/issues).

If it is useful to you, you can support its development:

<p>
  <a href="https://buymeacoffee.com/rummeyer"><img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?logo=buymeacoffee&logoColor=000" alt="Buy Me a Coffee"></a>
</p>

## Licence

MIT
