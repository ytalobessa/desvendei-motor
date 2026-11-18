# desvendei-motor

Motor de vídeos 3D low-poly do canal Desvendei (@desvendeicuriosidade), série "Você construiu um/uma X".

- `motor/` motor three.js (motor.js, index.html, render.mjs), efeitos sonoros (sfx.py) e narração (tts.py)
- `models/` modelos Kenney (CC0, ver models/LICENSE.txt)
- `exemplos/` cenas completas já publicadas
- `vigia.mjs` roda no PC com placa de vídeo e renderiza o que aparece em `fila/`

## PC (Windows)
1. `instalar.ps1` uma vez
2. `iniciar.bat` (coloque um atalho em shell:startup)
3. Cada trabalho é uma pasta em `fila/<nome>/` com cena.js, voz.mp3, words.json, audio.py e, por último, pedido.txt (`video 101.2` ou `stills 2,8,13`). O resultado sai em final.mp4, qa.jpg e feito.txt.

## Nuvem (sem GPU)
Na pasta do vídeo, com links para motor/, models/ e node_modules/: `bash motor/montar.sh DUR` e depois `bash motor/finalizar.sh`.

A chave do ElevenLabs nunca entra neste repositório.
