#!/usr/bin/env bash
set -euo pipefail

readonly unit_name=crossval-server.service
readonly script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly source_unit="$script_dir/$unit_name"
readonly target_unit="/etc/systemd/system/$unit_name"

if [[ $EUID -ne 0 ]]; then
  printf 'Run this script as root.\n' >&2
  exit 1
fi

install -m 0644 -o root -g root "$source_unit" "$target_unit"
systemctl daemon-reload
systemctl enable "$unit_name"
