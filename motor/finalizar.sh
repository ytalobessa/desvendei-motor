#!/bin/bash
# Uso: bash motor/finalizar.sh   (depois que log_a/log_b mostram "done"). Junta, mistura áudio e cria prancha de conferência.
set -e
printf "file 'seg/a.mp4'\nfile 'seg/b.mp4'\n" > lista.txt
ffmpeg -v error -y -f concat -safe 0 -i lista.txt -c copy v.mp4
python3 audio.py
ffmpeg -v error -y -i v.mp4 -i mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest final.mp4
ffmpeg -v error -y -i final.mp4 -vf "fps=1/4.5,scale=216:-1,tile=8x3" qa.jpg
ffprobe -v error -show_entries format=duration -of csv=p=0 final.mp4
