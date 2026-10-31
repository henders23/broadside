#!/bin/bash
# Ship-intercom version of a voice clip: radio bandwidth, a little grit and compression, a faint hiss under the voice,
# and the same burst of white-noise static before and after it. Usage: intercom.sh in.mp3 out.mp3
set -e
in="$1"; out="$2"; tmp=$(mktemp -d)
# The burst: plain, dry white noise, cut in and out sharply (no flutter, crackle or decaying tail, which read as reverb). Made once, used at both ends.
ffmpeg -hide_banner -loglevel error -y -f lavfi -t 0.5 -i "anoisesrc=c=white:a=0.5:seed=7"  -af "highpass=f=200,volume=-8dB,afade=t=in:d=0.008,afade=t=out:st=0.485:d=0.015" -ac 1 -ar 44100 "$tmp/burst.wav"
d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")
ffmpeg -hide_banner -loglevel error -y -i "$in" -i "$tmp/burst.wav" \
 -f lavfi -t "$d" -i "anoisesrc=c=pink:a=0.5:seed=3" \
 -filter_complex "
 [0:a]aresample=44100,highpass=f=330,highpass=f=330,lowpass=f=3300,lowpass=f=3300,equalizer=f=1700:t=q:w=1:g=5,equalizer=f=900:t=q:w=1.5:g=-2,
   acompressor=threshold=-26dB:ratio=5:attack=4:release=90:makeup=4,volume=3dB,asoftclip=type=tanh,acrusher=bits=11:mix=0.12:mode=log,volume=-2dB[v];
 [2:a]aresample=44100,highpass=f=700,lowpass=f=4200,volume=0.035[hiss];
 [v][hiss]amix=inputs=2:normalize=0:duration=first,apad=pad_dur=0.08[vh];
 [1:a]asplit=2[b1][b2];
 [b1][vh][b2]concat=n=3:v=0:a=1,loudnorm=I=-18:TP=-1.5:LRA=9" \
 -ac 1 -ar 44100 -b:a 96k "$out"
rm -rf "$tmp"
