#!/bin/bash
# Uso: bash motor/montar.sh DUR   (na pasta do vídeo). Renderiza em 2 processos, gera áudio e monta final.mp4
set -e
DUR=$1; MEIO=$(python3 -c "print(round($DUR/2,2))")
mkdir -p seg
nohup node render.mjs seg 0 $MEIO seg/a.mp4 > log_a.txt 2>&1 &
nohup node render.mjs seg $MEIO $DUR seg/b.mp4 > log_b.txt 2>&1 &
echo "render iniciado em 2 metades (0-$MEIO, $MEIO-$DUR). Acompanhe: grep ms/f log_a.txt log_b.txt"
