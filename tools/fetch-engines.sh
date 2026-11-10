#!/usr/bin/env bash
# Developed by Mohammad Rameez Imdad (Rameez Scripts)
# WhatsApp: https://wa.me/923435347417 (For Custom Projects)
# YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
#
# Puts the newest Windows engines in engines/ so the installer ships them (install and use, nothing to download).
# usage: bash tools/fetch-engines.sh   (release.sh runs it before every build)
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p engines
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
get() { curl -fsSL --retry 3 -o "$2" "$1"; }

get https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe "$T/yt-dlp.exe"
# gallery-dl moved its Windows builds; try the old place, then gdl-org/builds
get https://github.com/mikf/gallery-dl/releases/latest/download/gallery-dl.exe "$T/gallery-dl.exe" 2>/dev/null || get https://github.com/gdl-org/builds/releases/latest/download/gallery-dl_windows.exe "$T/gallery-dl.exe"
get https://github.com/denoland/deno/releases/latest/download/deno-x86_64-pc-windows-msvc.zip "$T/deno.zip"
get https://github.com/aria2/aria2/releases/download/release-1.37.0/aria2-1.37.0-win-64bit-build1.zip "$T/aria2.zip"
python3 -I - "$T" <<'PY'
import sys, zipfile, os
t = sys.argv[1]
zipfile.ZipFile(f'{t}/deno.zip').extract('deno.exe', t)
z = zipfile.ZipFile(f'{t}/aria2.zip')
n = next(x for x in z.namelist() if x.lower().endswith('aria2c.exe'))
open(f'{t}/aria2c.exe', 'wb').write(z.read(n))
PY
for f in yt-dlp.exe gallery-dl.exe deno.exe aria2c.exe; do
  [ -s "$T/$f" ] || { echo "missing $f"; exit 1; }
  mv -f "$T/$f" "engines/$f"
done
ls -la engines | awk 'NR>1 {print $5, $9}'
