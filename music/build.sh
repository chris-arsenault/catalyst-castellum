#!/usr/bin/env bash
# Export music/*.rb to MIDI via Partitura and render per-voice NES stems into
# public/audio/<song>/<stem>.ogg. The game mixes stems live (vertical layering),
# so no premixed file ships.
set -euo pipefail
cd "$(dirname "$0")/.."

PARTITURA=${PARTITURA:-../sigillum-library/partitura/bin/partitura}
SONGS=("$@")
if [ ${#SONGS[@]} -eq 0 ]; then
  SONGS=(menu interlude assault danger boss)
fi

for song in "${SONGS[@]}"; do
  "$PARTITURA" export "music/${song}.rb" --stem "$song" >/dev/null
  python3 tooling/nes_render.py "outputs/music/${song}/${song}.mid" --stems "outputs/music/${song}/stems"
  mkdir -p "public/audio/${song}"
  for stem_wav in "outputs/music/${song}/stems/"*.wav; do
    stem_name=$(basename "$stem_wav" .wav)
    ffmpeg -y -loglevel error -i "$stem_wav" -c:a libvorbis -q:a 4 "public/audio/${song}/${stem_name}.ogg"
    echo "public/audio/${song}/${stem_name}.ogg"
  done
done
