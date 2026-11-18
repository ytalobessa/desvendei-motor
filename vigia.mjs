// Vigia do Desvendei: fica rodando no PC e renderiza na RTX os trabalhos que o Claude deixa na pasta fila
// Cada trabalho é uma pasta em fila\<nome>\ com cena.js, voz.mp3, words.json, audio.py e um pedido.txt:
//   "video 101.2"        renderiza o vídeo inteiro (DUR em segundos) e gera final.mp4 + qa.jpg
//   "stills 2,8.5,13"    gera imagens de teste em stills\
// Ao terminar escreve feito.txt (ou erro.txt). O Claude busca o resultado e apaga nada.
import fs from 'fs'; import path from 'path'; import { spawn } from 'child_process';
const BASE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const FILA = path.join(BASE, 'fila'); fs.mkdirSync(FILA, { recursive: true });
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe')].find(p => p && fs.existsSync(p));
const PY = process.platform === 'win32' ? 'python' : 'python3';
const env = { ...process.env, GPU: '1', BASE, CHROME, PYTHONPATH: path.join(BASE, 'motor') };
const hora = () => new Date().toLocaleTimeString('pt-BR');
const run = (cmd, args, cwd, log) => new Promise((ok, no) => { const p = spawn(cmd, args, { cwd, env, shell: false });
  const w = d => { fs.appendFileSync(log, d); process.stdout.write(d); }; p.stdout.on('data', w); p.stderr.on('data', w);
  p.on('error', no); p.on('close', c => c === 0 ? ok() : no(new Error(`${cmd} saiu com código ${c}`))); });
const ff = (args, cwd, log) => run('ffmpeg', ['-v', 'error', '-y', ...args], cwd, log);

async function trabalhar(dir) {
  const pedido = fs.readFileSync(path.join(dir, 'pedido.txt'), 'utf8').trim().split(/\s+/); const log = path.join(dir, 'log.txt');
  fs.writeFileSync(path.join(dir, 'rodando.txt'), hora()); const t0 = Date.now();
  if (!fs.existsSync(path.join(dir, 'index.html'))) fs.copyFileSync(path.join(BASE, 'motor', 'index.html'), path.join(dir, 'index.html'));
  const render = path.join(BASE, 'motor', 'render.mjs');
  if (pedido[0] === 'stills') await run('node', [render, 'stills', pedido[1]], dir, log);
  else {
    const DUR = +pedido[1], MEIO = Math.round(DUR / 2 * 30) / 30; fs.mkdirSync(path.join(dir, 'seg'), { recursive: true });
    await Promise.all([run('node', [render, 'seg', 0, MEIO, 'seg/a.mp4'], dir, log), run('node', [render, 'seg', MEIO, DUR, 'seg/b.mp4'], dir, log)]);
    fs.writeFileSync(path.join(dir, 'lista.txt'), "file 'seg/a.mp4'\nfile 'seg/b.mp4'\n");
    await ff(['-f', 'concat', '-safe', '0', '-i', 'lista.txt', '-c', 'copy', 'v.mp4'], dir, log);
    await run(PY, ['audio.py'], dir, log);
    await ff(['-i', 'v.mp4', '-i', 'mix.wav', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', 'final.mp4'], dir, log);
    await ff(['-i', 'final.mp4', '-vf', 'fps=1/4.5,scale=216:-1,tile=8x3', 'qa.jpg'], dir, log);
  }
  fs.writeFileSync(path.join(dir, 'feito.txt'), `ok ${((Date.now() - t0) / 60000).toFixed(1)} min ${hora()}`);
}

console.log(`Vigia Desvendei ligado (${hora()}). Chrome: ${CHROME || 'NÃO ENCONTRADO'}. Pode minimizar esta janela.`);
for (const n of fs.readdirSync(FILA)) { try { fs.unlinkSync(path.join(FILA, n, 'rodando.txt')); } catch {} } // trabalho interrompido volta pra fila
let ocupado = false;
setInterval(async () => { if (ocupado) return; ocupado = true;
  try { for (const n of fs.readdirSync(FILA)) { const d = path.join(FILA, n);
      if (!fs.existsSync(path.join(d, 'pedido.txt')) || ['rodando.txt', 'feito.txt', 'erro.txt'].some(f => fs.existsSync(path.join(d, f)))) continue;
      console.log(`\n[${hora()}] Renderizando ${n}`);
      try { await trabalhar(d); console.log(`[${hora()}] ${n} pronto`); } catch (e) { fs.writeFileSync(path.join(d, 'erro.txt'), String(e.stack || e)); console.log('ERRO', e.message); }
      try { fs.unlinkSync(path.join(d, 'rodando.txt')); } catch {} } }
  finally { ocupado = false; } }, 15000);
