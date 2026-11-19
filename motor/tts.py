# Uso: python3 tts.py  (na pasta do vídeo; precisa de texto.txt, uma frase por linha, e ELEVEN_KEY / VOICE_ID no ambiente)
# Gera: voz.mp3, words.json (legenda palavra por palavra, termos em amarelo), frases.txt e palavras.txt (tempos para planejar a cena)
import os, json, re, base64, subprocess, unicodedata
KEY, VOICE = os.environ['ELEVEN_KEY'], os.environ['VOICE_ID']
texto = open('texto.txt', encoding='utf-8').read().strip()
body = {"text": texto.replace('\n', ' '), "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75, "style": 0.25, "use_speaker_boost": True, "speed": 1.1}}
json.dump(body, open('req.json', 'w', encoding='utf-8'), ensure_ascii=False)
r = subprocess.run(['curl', '-s', '-X', 'POST', f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128',
                    '-H', f'xi-api-key: {KEY}', '-H', 'Content-Type: application/json', '--data-binary', '@req.json'], capture_output=True, text=True, encoding='utf-8')
d = json.loads(r.stdout)
if 'audio_base64' not in d: raise SystemExit('ElevenLabs falhou: ' + r.stdout[:400])
open('voz.mp3', 'wb').write(base64.b64decode(d['audio_base64'])); a = d['alignment']
words = []; cur = ''; s = e = 0
for c, t0, t1 in zip(a['characters'], a['character_start_times_seconds'], a['character_end_times_seconds']):
    if c.isspace():
        if cur: words.append([cur, s, e]); cur = ''
        continue
    if not cur: s = t0
    cur += c; e = t1
if cur: words.append([cur, s, e])
norm = lambda w: unicodedata.normalize('NFC', re.sub(r'[.,:;?!"]', '', w)).lower()
out = []; hl = False; termos = set()
for k, (w, s, e) in enumerate(words):
    prev = [norm(x[0]) for x in words[max(0, k - 3):k]]
    if len(prev) >= 3 and prev[-3] in ('esse', 'essa', 'esses', 'essas') and prev[-2] in ('é', 'são') and prev[-1] in ('o', 'a', 'os', 'as'): hl = True
    if len(prev) >= 2 and prev[-2] == 'construiu' and prev[-1] in ('um', 'uma'): hl = True
    if hl: termos.add(norm(w))
    out.append(dict(w=re.sub(r'[.,:;?!"]', '', w), s=round(s, 3), e=round(e, 3), hl=hl or norm(w) == 'parabéns'))
    if w.endswith('.'): hl = False
# termo repetido depois também fica amarelo (só palavras com 5+ letras, para não pintar "de", "da")
for o in out:
    if norm(o['w']) in termos and len(o['w']) >= 5: o['hl'] = True
json.dump(out, open('words.json', 'w', encoding='utf-8'), ensure_ascii=False)
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', 'voz.mp3'], capture_output=True, text=True).stdout)
frases = []; buf = []
for w, s, e in words:
    buf.append((w, s, e))
    if w.endswith(('.', '?', '!')): frases.append(buf); buf = []
if buf: frases.append(buf)
with open('frases.txt', 'w', encoding='utf-8') as f:
    for i, b in enumerate(frases): f.write(f"{i:2d} {b[0][1]:6.2f}-{b[-1][2]:6.2f} | {' '.join(x[0] for x in b)}\n")
open('palavras.txt', 'w', encoding='utf-8').write(' '.join(f"{o['w']}@{o['s']:.2f}" for o in out))
print('voz.mp3', round(dur, 2), 's |', len(out), 'palavras | fim da fala', out[-1]['e'])
