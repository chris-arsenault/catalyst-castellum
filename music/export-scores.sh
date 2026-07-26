#!/usr/bin/env bash
# Export the extended production scores to MIDI and MusicXML under
# music/scores/. These are handoff scores: they carry the same roster, key
# and tempo as the chip sources so an orchestral or electronic rendition
# produced from them lands on the same musical grid the game already runs.
# Nothing here is rendered to audio - music/build.sh owns the chip stems.
set -euo pipefail
cd "$(dirname "$0")/.."

PARTITURA=${PARTITURA:-../sigillum-library/partitura/bin/partitura}
SCORES=("$@")
if [ ${#SCORES[@]} -eq 0 ]; then
  SCORES=(menu-extended assault-extended boss-extended)
fi

mkdir -p music/scores
for score in "${SCORES[@]}"; do
  "$PARTITURA" export "music/${score}.rb" --stem "$score" >/dev/null
  cp "outputs/music/${score}/${score}.mid" "music/scores/${score}.mid"
  cp "outputs/music/${score}/${score}.musicxml" "music/scores/${score}.musicxml"
  echo "music/scores/${score}.mid"
  echo "music/scores/${score}.musicxml"
done
