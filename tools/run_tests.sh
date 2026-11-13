#!/usr/bin/env bash
# The ONE test command. Exits non-zero on any failure, script error, crash, console error or softlock.
# Needs: node >= 22 and (for the browser stage) a Chromium binary (set CHROMIUM=/path to override).
set -uo pipefail
cd "$(dirname "$0")/.."
fail=0
stage() { local name="$1"; shift; echo; echo "=== ${name} ==="; if ! "$@"; then echo "STAGE FAILED: ${name}"; fail=1; fi; }

syntax() { local rc=0; for f in src/*.js tools/*.mjs; do node --check "$f" || rc=1; done; return $rc; }
no_network() { if grep -RnE "https?://|fetch\(|XMLHttpRequest|WebSocket|importScripts" src index.html >/tmp/biogame_net.$$ 2>&1; then cat /tmp/biogame_net.$$; rm -f /tmp/biogame_net.$$; echo "network references found in game code"; return 1; fi; rm -f /tmp/biogame_net.$$; echo "ok   no network access in game code"; }
browser() {
  local bin="${CHROMIUM:-}"; [ -z "$bin" ] && for c in chromium chromium-browser google-chrome google-chrome-stable; do command -v "$c" >/dev/null 2>&1 && bin="$c" && break; done
  if [ -z "$bin" ]; then
    if [ "${BIOGAME_SKIP_BROWSER:-0}" = "1" ]; then echo "SKIPPED (BIOGAME_SKIP_BROWSER=1): browser stage NOT run"; return 0; fi
    echo "no Chromium found; install one, set CHROMIUM=..., or set BIOGAME_SKIP_BROWSER=1 to skip explicitly"; return 1
  fi
  CHROMIUM="$bin" node tools/browser_test.mjs
}

stage "syntax check" syntax
stage "no network" no_network
stage "unit tests (missions, save, quiz, collision)" node tools/test_logic.mjs
stage "asset + animation checks" node tools/test_assets.mjs
stage "scripted autoplay (softlock + playtime)" node tools/test_autoplay.mjs
stage "headless browser (console errors, screenshots, full playthrough)" browser

echo
if [ "$fail" -ne 0 ]; then echo "TESTS FAILED"; exit 1; fi
echo "ALL TESTS PASSED"
