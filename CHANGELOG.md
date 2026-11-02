# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [semantic versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] — 2026-11-02

- The dashboards of Appliance Monitor, Synology Monitor and Connection
  Monitor on one page, a tab each, served by Caddy. The tabs sit in each
  dashboard under its header; switching the look in one switches all three.
  A dashboard that does not answer has no tab.
- Only the home network gets an answer; anyone else gets 403 Forbidden.

[Unreleased]: https://github.com/rummeyer/monitor-dashboard/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/rummeyer/monitor-dashboard/releases/tag/v0.1.0
