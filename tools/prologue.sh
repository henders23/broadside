#!/bin/bash
# Mixes the prologue's soundtrack (voice/prologue.mp3) from its narration and its score. The film's timings in
# campaign/prologue.js count from the start of this file: the narration comes in 3 s after the music.
# Usage: tools/prologue.sh [narration.mp3] [score.mp3] [out.mp3]
set -e
voice="${1:-voice/prologue-narration.mp3}"; score="${2:-music/prologue-score.mp3}"; out="${3:-voice/prologue.mp3}"
ffmpeg -hide_banner -loglevel error -y -i "$voice" -i "$score" -filter_complex "
 [0:a]aresample=44100,highpass=f=70,acompressor=threshold=-22dB:ratio=2.5:attack=8:release=160:makeup=2,loudnorm=I=-17:TP=-1.5:LRA=9,aresample=44100,adelay=3000:all=1,apad,pan=stereo|c0=c0|c1=c0[v];
 [1:a]aresample=44100,volume=eval=frame:volume='if(lt(t,2.6),1.25,if(lt(t,3.6),1.25-(t-2.6)*0.75,if(lt(t,48.6),0.5,if(lt(t,50.6),0.5+(t-48.6)*0.4,1.3))))',afade=t=in:d=1.2,afade=t=out:st=53.5:d=4,atrim=0:57.5[m];
 [v][m]amix=inputs=2:normalize=0:duration=shortest,alimiter=limit=0.89" -ac 2 -ar 44100 -b:a 128k "$out"
