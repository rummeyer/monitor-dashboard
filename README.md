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

Caddy passes each dashboard through under a path of its own —
`/appliances/`, `/synology/`, `/connection/` — and serves the page itself at
`/`. The dashboards ask for everything by relative paths, so they work there
as they are.

The page loads each dashboard in a frame the size of the window, all at
once, so a tab switches without waiting. As they all come from one address,
the page can reach into the frames: it puts the tabs in under each header and
spreads a switched look to the other two. The page's title and icon follow
the tab shown, and the address keeps it — `/#synology` opens on Synology.

The dashboards forbid being shown in a frame of another site. The Caddyfile
allows it for this address only.

## Troubleshooting

**A tab is missing**: its dashboard does not answer. Is the plugin running,
its dashboard switched on, and its port in the Caddyfile its own?

**"None of the dashboards answers"**: Caddy cannot reach any of them; check
the ports, and `sudo journalctl -u caddy`.

**Caddy does not start: address already in use**: something else serves port
80, such as Apache — `sudo systemctl disable --now apache2` if nothing needs
it.

**Synology Monitor's buttons**: through Caddy they come from this machine
itself, which the dashboard lets in. Keep Caddy to the home network, as the
dashboards are.

## Support

Questions and bugs: [GitHub issues](https://github.com/rummeyer/monitor-dashboard/issues).

If it is useful to you, you can support its development:

<p>
  <a href="https://buymeacoffee.com/rummeyer"><img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?logo=buymeacoffee&logoColor=000" alt="Buy Me a Coffee"></a>
</p>

## Licence

MIT
