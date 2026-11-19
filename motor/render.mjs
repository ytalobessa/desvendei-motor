import http from 'http'; import fs from 'fs'; import path from 'path';
import { spawn } from 'child_process'; import puppeteer from 'puppeteer-core';
const ROOT = process.cwd(); // pasta do vídeo (cena.js, words.json, stills/)
const BASE = process.env.BASE || ROOT; // pasta com motor/, models/, node_modules/ (no PC: D:\\desvendei)
const [, , mode, a, b, out] = process.argv; // stills t1,t2 | seg t0 t1 out.mp4
const types = { '.mp3': 'audio/mpeg', '.png': 'image/png', '.glb': 'model/gltf-binary', '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); let f = path.join(ROOT, u); if (!fs.existsSync(f)) f = path.join(BASE, u);
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(0);
const port = srv.address().port;
// GPU=1 usa a placa de vídeo (Windows, D3D11); sem GPU usa SwiftShader (nuvem)
const GPU = process.env.GPU === '1';
const CHROME = process.env.CHROME || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : '/usr/bin/google-chrome');
const br = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
  args: GPU ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-gpu-rasterization']
            : ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] });
const pg = await br.newPage();
pg.on('pageerror', e => { console.log('ERR', e.message); if (!globalThis.__pronto) process.exit(1); });
pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warn') console.log('CONSOLE', m.text()); });
await pg.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
await pg.goto(`http://localhost:${port}/index.html${GPU ? "?q=alta" : ""}`);
await pg.waitForFunction('window.ready === true', { timeout: 180000 }); globalThis.__pronto = true;
if (mode === 'stills') { fs.mkdirSync(`${ROOT}/stills`, { recursive: true });
  for (const t of a.split(',')) { await pg.evaluate(t => renderAt(t), +t); await pg.screenshot({ path: `${ROOT}/stills/s_${t}.jpg`, type: 'jpeg', quality: 88 }); }
} else {
  const t0 = +a, t1 = +b, fps = 30, n = Math.round((t1 - t0) * fps), tmp = out.replace(/\.mp4$/, '.tmp.mp4');
  const ff = spawn('ffmpeg', ['-y','-v','error','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p','-r','30', tmp]);
  const st = Date.now();
  for (let i = 0; i < n; i++) { const t = t0 + i / fps; await pg.evaluate(t => renderAt(t), t);
    const buf = await pg.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 0) console.log(out, i, '/', n, ((Date.now() - st) / (i + 1)).toFixed(0), 'ms/f'); }
  ff.stdin.end(); const code = await new Promise(r => ff.on('close', r));
  if (code === 0) fs.renameSync(tmp, out); console.log('done', out, code);
}
await br.close(); srv.close();
