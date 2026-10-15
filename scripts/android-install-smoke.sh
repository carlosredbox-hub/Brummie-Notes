#!/usr/bin/env bash
set -euo pipefail

output=test-results/android-install
mkdir -p "$output"
stage=prepare
collect() {
  result=$?
  set +e
  adb logcat -d > "$output/logcat.txt" || true
  adb exec-out screencap -p > "$output/screen.png" || true
  if [ "$result" -ne 0 ]; then
    echo "::error title=Android install smoke::Failed at stage: $stage (API $API_LEVEL)"
  fi
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    {
      echo "## Android API $API_LEVEL — stage: $stage — exit: $result"
      for file in install.txt launch.txt ui.xml; do
        echo "### $file"
        echo '```text'
        head -c 5000 "$output/$file" 2>/dev/null
        printf '\n```\n'
      done
      echo '### Native crash diagnostics'
      echo '```text'
      adb logcat -d -s AndroidRuntime:E | tail -70
      echo '```'
    } >> "$GITHUB_STEP_SUMMARY"
  fi
  return "$result"
}
trap collect EXIT

apk="$(find release/android -name '*.apk' -print -quit)"
test -n "$apk"
if [ "$SIGNED" = true ]; then
  package=com.brummie.documents
else
  package="com.brummie.documents.test.v${APP_VERSION//./_}"
fi

adb logcat -c
stage=install
timeout 120 adb install "$apk" | tee "$output/install.txt"
grep -Fx Success "$output/install.txt"
adb shell input keyevent KEYCODE_WAKEUP
adb shell input keyevent 82
stage=launch
timeout 30 adb shell am start -W -n "$package/com.brummie.documents.MainActivity" | tee "$output/launch.txt"
grep -F 'Status: ok' "$output/launch.txt"

stage=visible-interface
for attempt in $(seq 1 15); do
  adb shell uiautomator dump /sdcard/brummie-ui.xml >/dev/null
  adb pull /sdcard/brummie-ui.xml "$output/ui.xml" >/dev/null
  if grep -Eq 'Seus documentos Brummie|Seus documentos anteriores|Atualize o Android System WebView' "$output/ui.xml"; then
    break
  fi
  sleep 2
done
grep -Eq 'Seus documentos Brummie|Seus documentos anteriores|Atualize o Android System WebView' "$output/ui.xml"
if [ "$API_LEVEL" -ge 35 ]; then
  grep -Eq 'Seus documentos Brummie|Seus documentos anteriores' "$output/ui.xml"
fi
adb shell pidof "$package" > "$output/pid.txt"
test -s "$output/pid.txt"
if grep -q 'Atualize o Android System WebView' "$output/ui.xml"; then
  echo 'APK installed and opened; this emulator has an old WebView and displayed the update instruction.'
else
  echo 'APK installed and opened the offline document editor.'
fi
stage=complete
