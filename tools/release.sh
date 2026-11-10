#!/usr/bin/env bash
# Developed by Mohammad Rameez Imdad (Rameez Scripts)
# WhatsApp: https://wa.me/923435347417 (For Custom Projects)
# YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
#
# New RS Downloader version: bump the patch, build the installer (Windows npm), publish the GitHub release.
# Installed apps find it within an hour (or at start / Update button), download it and install on restart.
# usage (from WSL): bash tools/release.sh "What changed, in one line"   (NOBUMP=1 = keep the current version)
set -euo pipefail
cd "$(dirname "$0")/.."
NOTES="${1:-Fixes and improvements}"
REPO=rameezimdad/RS-Downloader
gh repo view "$REPO" >/dev/null 2>&1 || { echo "releases repo $REPO not found"; exit 1; }
if [ -z "${NOBUMP:-}" ]; then
  V=$(node -e 'const fs=require("fs"),p=JSON.parse(fs.readFileSync("package.json"));const v=p.version.split(".").map(Number);v[2]++;p.version=v.join(".");fs.writeFileSync("package.json",JSON.stringify(p,null,2)+"\n");console.log(p.version)')
else
  V=$(node -p 'require("./package.json").version')
fi
echo "engines"
bash tools/fetch-engines.sh >/dev/null
echo "building $V"
W=$(wslpath -w "$PWD/tools/npm.bat")
( cd /mnt/c && /mnt/c/Windows/System32/cmd.exe /c call "$W" run dist ) | tr -d '\r' | grep -E "building  |rror" || true
EXE="dist/RS-Downloader-Setup-$V.exe"
[ -f "$EXE" ] && grep -q "version: $V" dist/latest.yml || { echo "build failed: $EXE / latest.yml missing"; exit 1; }
# browser extension as a zip (same name every release, so .../releases/latest/download/RS-Downloader-Extension.zip always works)
python3 -I - <<'PY'
import zipfile, os
z = zipfile.ZipFile('dist/RS-Downloader-Extension.zip', 'w', zipfile.ZIP_DEFLATED)
for root, _, files in os.walk('extension'):
    for f in files:
        p = os.path.join(root, f)
        z.write(p, os.path.join('RS-Downloader-Extension', os.path.relpath(p, 'extension')))
z.close()
PY
gh release create "v$V" -R "$REPO" --title "RS Downloader $V" --notes "$NOTES" --latest "$EXE" "$EXE.blockmap" dist/latest.yml dist/RS-Downloader-Extension.zip
# source goes up with the release
git add -A && { git diff --cached --quiet || git commit -q -m "v$V: $NOTES"; } && git push -q origin main || echo "source push failed, run: git push origin main"
# dist keeps only the newest installer
find dist -maxdepth 1 -name 'RS-Downloader-Setup-*' ! -name "RS-Downloader-Setup-$V.exe*" -delete
echo "published v$V, installed apps update within an hour"
