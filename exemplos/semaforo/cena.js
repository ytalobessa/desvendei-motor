// =====================================================================
// CENA: "Você construiu um semáforo"
// Cruzamento na origem. Rua A ao longo de x (carros para +x na faixa z = +1.75).
// Rua B ao longo de z (carros para +z na faixa x = -1.75). Semáforo principal no canto SO.
// =====================================================================
import { THREE, P, sm, eio, eout, back, lerp, lerp3, win, R, scene, mat, mesh, boxAt, canvasTex, carregar, modelo, mundo, arvores,
  carro, posCarro, pessoa, pose, clima, confete, pose3, iniciar, luzesNoite, ARVORES, PLANTAS, CASAS } from './motor/motor.js';
const FIM_FALA = 96.13, DUR = 101.2, CURB = 0.25;
await carregar([...ARVORES, ...PLANTAS, ...CASAS, ...['sedan', 'hatchback-sports', 'suv', 'van', 'sedan-sports', 'taxi', 'truck', 'suv-luxury', 'delivery', 'police'].map(n => 'car/' + n),
  ...['male-a', 'female-c', 'male-b', 'female-e'].map(n => 'mini-characters/character-' + n)]);

// ---------- mundo: cruzamento ----------
mundo({ plano: 50 });
const asfM = mat(0x3a3d43, { roughness: .95 }), calcM = mat(0xd3cfc6), brancoM = mat(0xf5f5f0, { roughness: .6 }), amareloM = mat(0xf2c230, { roughness: .6 });
boxAt(-260, 260, -0.3, 0, -3.5, 3.5, asfM, scene, false); boxAt(-3.5, 3.5, -0.3, 0, -260, 260, asfM, scene, false);
for (const sx of [-1, 1]) for (const sz of [-1, 1]) { // calçadas em L nos 4 cantos
  const xa = sx > 0 ? [3.5, 260] : [-260, -3.5], za = sz > 0 ? [3.5, 6.8] : [-6.8, -3.5]; boxAt(xa[0], xa[1], -0.3, CURB, za[0], za[1], calcM);
  const xb = sx > 0 ? [3.5, 6.8] : [-6.8, -3.5], zb = sz > 0 ? [6.8, 260] : [-260, -6.8]; boxAt(xb[0], xb[1], -0.3, CURB, zb[0], zb[1], calcM); }
// faixas centrais amarelas (fora do cruzamento) e linhas de retenção
for (const [a, b] of [[-260, -10], [10, 260]]) { boxAt(a, b, 0.001, 0.012, -0.16, -0.06, amareloM, scene, false); boxAt(a, b, 0.001, 0.012, 0.06, 0.16, amareloM, scene, false);
  boxAt(-0.16, -0.06, 0.001, 0.012, a, b, amareloM, scene, false); boxAt(0.06, 0.16, 0.001, 0.012, a, b, amareloM, scene, false); }
boxAt(-9.6, -9.2, 0.001, 0.014, 0, 3.5, brancoM, scene, false); boxAt(-3.5, 0, 0.001, 0.014, -9.6, -9.2, brancoM, scene, false);
// faixas de pedestre (rua A a oeste, rua B ao norte)
for (let i = 0; i < 7; i++) { const z = -3.2 + i * 1.0; boxAt(-8.6, -5.8, 0.001, 0.014, z, z + 0.5, brancoM, scene, false); }
for (let i = 0; i < 7; i++) { const x = -3.2 + i * 1.0; boxAt(x, x + 0.5, 0.001, 0.014, -8.6, -5.8, brancoM, scene, false); }
// prédios e árvores ao redor
let hk = 0; const prox = () => CASAS[(hk++ * 7) % CASAS.length];
for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let k = 0; k < 4; k++) {
  modelo(prox(), sx * (14 + k * 12 + R() * 2), 0, sz * 12.5, sz > 0 ? Math.PI : 0, 8.5 + R() * 1.5);
  if (k < 3) modelo(prox(), sx * 12.5, 0, sz * (26 + k * 12 + R() * 2), sx > 0 ? -Math.PI / 2 : Math.PI / 2, 8.5 + R() * 1.5); }
const tp = []; for (let i = 0; i < 70; i++) { const x = (R() > .5 ? 1 : -1) * (22 + R() * 70), z = (R() > .5 ? 1 : -1) * (22 + R() * 70); tp.push([x, z, 0]); }
for (const d of [16, 28, 40, 52]) { tp.push([-d, -6.0, CURB], [d, -6.0, CURB], [d, 6.0, CURB], [-6.0, -d, CURB], [6.0, -d, CURB], [6.0, d, CURB]); }
arvores(tp);
for (let i = 0; i < 18; i++) modelo(PLANTAS[i % 6], (R() > .5 ? 1 : -1) * (8 + R() * 30), CURB, (R() > .5 ? 1 : -1) * (7.4 + R() * 0.6), R() * 6, 0.7 + R() * 0.5, 'y');

// ---------- semáforos ----------
const poleM = mat(0x5a6068), caixaM = mat(0x1f2a24, { roughness: .6 });
const lampMat = c => new THREE.MeshStandardMaterial({ color: new THREE.Color(c).multiplyScalar(0.25), emissive: c, emissiveIntensity: 0.05, roughness: .3 });
function makeLight(x, z, rotY) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g);
  boxAt(-0.07, 0.07, CURB, 3.5, -0.07, 0.07, poleM, g); const head = new THREE.Group(); head.position.set(0, 3.95, 0); g.add(head);
  const caixa = boxAt(-0.24, 0.24, -0.5, 0.5, -0.2, 0.2, caixaM, head); const placa = boxAt(-0.42, 0.42, -0.72, 0.72, 0.21, 0.24, mat(0x111614), head);
  const lamps = {}, halos = {};
  for (const [k, c] of [['r', 0xff2a1a], ['y', 0xffb21a], ['g', 0x22e05a]]) { const m = lampMat(c); const L = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 20).rotateX(Math.PI / 2), m, 0, 0, -0.22, head, false); lamps[k] = { mesh: L, m };
    const hm = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }); const h = mesh(new THREE.CircleGeometry(0.3, 24), hm, 0, 0, -0.26, head, false); h.rotation.y = Math.PI; halos[k] = { mesh: h, m: hm }; }
  return { g, head, caixa, placa, lamps, halos }; }
// rua A (vem de -x): semáforo no canto SO virado para -x; rua B (vem de -z): canto NO virado para -z
const LA = makeLight(-7.6, 4.4, Math.PI / 2), LB = makeLight(-4.4, -7.6, 0);
// botoeira e foco de pedestre
const botM = mat(0xf2c230, { emissive: 0x000000 }); const bot = boxAt(-0.12, 0.12, 1.0, 1.32, -0.08, 0.08, botM, scene); bot.position.set(-7.6, 1.16, 4.62);
const pedTex = c => canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#111'; g.fillRect(0, 0, w, h); g.fillStyle = c; g.beginPath(); g.arc(128, 52, 26, 0, 7); g.fill(); g.lineWidth = 26; g.lineCap = 'round'; g.strokeStyle = c;
  if (c === '#2ee66a') { g.beginPath(); g.moveTo(128, 90); g.lineTo(118, 160); g.lineTo(80, 220); g.moveTo(118, 160); g.lineTo(160, 220); g.moveTo(124, 110); g.lineTo(80, 140); g.moveTo(124, 110); g.lineTo(170, 130); g.stroke(); }
  else { g.beginPath(); g.moveTo(128, 90); g.lineTo(128, 165); g.lineTo(104, 225); g.moveTo(128, 165); g.lineTo(152, 225); g.moveTo(128, 105); g.lineTo(100, 160); g.moveTo(128, 105); g.lineTo(156, 160); g.stroke(); } });
const texPedR = pedTex('#ff3a2a'), texPedG = pedTex('#2ee66a'); const pedM = new THREE.MeshBasicMaterial({ map: texPedR });
const pedG = new THREE.Group(); pedG.position.set(-7.2, 0, -4.6); scene.add(pedG); boxAt(-0.07, 0.07, CURB, 2.6, -0.07, 0.07, poleM, pedG);
boxAt(-0.3, 0.3, 2.1, 2.9, -0.18, 0.18, caixaM, pedG); const pedScreen = mesh(new THREE.PlaneGeometry(0.52, 0.72), pedM, 0, 2.5, 0.19, pedG, false);

// ---------- laço indutivo ----------
const lacoM = new THREE.MeshStandardMaterial({ color: 0xd9822b, emissive: 0xc0601a, emissiveIntensity: 0.6, metalness: .6, roughness: .3 });
const corteM = mat(0x15171a); const lacoSegs = [];
{ let x0 = -13.4, x1 = -10.3, z0 = 0.55, z1 = 2.95; for (let k = 0; k < 3; k++) { const pts = [[x0, z0], [x1, z0], [x1, z1], [x0, z1], [x0, z0 + 0.14]];
    for (let i = 0; i < 4; i++) lacoSegs.push([pts[i], pts[i + 1]]); x0 += 0.14; x1 -= 0.14; z0 += 0.14; z1 -= 0.14; } }
const lacoLen = lacoSegs.reduce((s, [a, b]) => s + Math.hypot(b[0] - a[0], b[1] - a[1]), 0);
const lacoObjs = lacoSegs.map(([a, b]) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const mk = (m, w, y) => { const o = new THREE.Mesh(new THREE.BoxGeometry(1, y, w).translate(0.5, y / 2, 0), m); o.position.set(a[0], 0.004, a[1]); o.rotation.y = -ang; scene.add(o); return o; };
  return { L, cut: mk(corteM, 0.09, 0.012), fio: mk(lacoM, 0.05, 0.02) }; });
const pulsoM = new THREE.MeshBasicMaterial({ color: 0xffc21a, transparent: true, opacity: 0, depthWrite: false }); const pulsos = [0, 1, 2].map(() => { const r = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.0, 4, 1, Math.PI / 4), pulsoM.clone()); r.rotation.x = -Math.PI / 2; r.position.set(-11.85, 0.03, 1.75); scene.add(r); return r; });

// ---------- carros ----------
const LA_Z = 1.75, LB_X = -1.75, PARADA = -11.4; // centro do carro parado na linha de retenção
const brake = (t, tb, x0, v, a, xmax = 1e9) => { if (t < tb) return x0 + v * (t - tb); const tau = Math.min(t - tb, v / a); return Math.min(xmax, x0 + v * tau - a * tau * tau / 2); };
const cars = [
  // eixo, modelo, quando aparece, posição ao longo do eixo, faixa
  { c: carro('sedan'), e: 'x', t0: 0.4, t1: 4.8, s: t => -30 + 15 * (t - 0.6) },
  { c: carro('hatchback-sports'), e: 'z', t0: 2.6, t1: 7.2, s: t => -30 + 15 * (t - 3.0) },
  { c: carro('suv'), e: 'x', t0: 7.0, t1: 11.0, s: t => -3.2 - 28 * (1 - eout(P(t, 7.0, 9.1))), jolt: 9.1 },
  { c: carro('van'), e: 'z', t0: 7.0, t1: 11.0, s: t => -3.6 - 28 * (1 - eout(P(t, 7.2, 9.1))), jolt: 9.1 },
  { c: carro('sedan-sports'), e: 'x', t0: 14.2, t1: 17.6, s: t => -35 + 16 * (t - 14.3) },
  { c: carro('taxi'), e: 'z', t0: 12.0, t1: 24.0, s: t => t < 20 ? PARADA : PARADA + Math.min(t - 20, 2.3) ** 2 },
  { c: carro('suv-luxury'), e: 'x', t0: 18.9, t1: 25.5, s: t => brake(t, 21.5, -20, 16, 5), skid: [21.5, 24.7] },
  { c: carro('hatchback-sports'), e: 'x', t0: 24.6, t1: 33.8, s: t => brake(t, 26.5, -24.6, 12, 5.45) },
  { c: carro('truck', 6.6), e: 'x', t0: 33.7, t1: 48.0, s: t => 2.2 * (t - 38.8) },
  { c: carro('sedan'), e: 'z', t0: 36.6, t1: 52.0, s: t => t < 39.7 ? -40 + 11.5 * (t - 36.8) : t < 45.9 ? brake(t, 39.7, -6.65, 11.5, 22, -4.0) : -4.0 + 1.2 * (t - 45.9) ** 2 },
  { c: carro('taxi'), e: 'x', t0: 64.2, t1: 69.45, s: t => PARADA },
  { c: carro('taxi'), e: 'x', t0: 73.6, t1: 80.0, s: t => t < 77.9 ? brake(t, 73.8, -30, 13, 9.17, PARADA) : PARADA + 1.6 * (t - 77.9) ** 2 },
  { c: carro('van'), e: 'x', t0: 79.5, t1: 82.5, s: t => -30 + 16 * (t - 79.6) },
  { c: carro('delivery'), e: 'x', t0: 81.2, t1: 84.3, s: t => -30 + 16 * (t - 81.4) },
  { c: carro('sedan-sports'), e: 'x', t0: 84.8, t1: 92.9, s: t => t < 91.5 ? brake(t, 85.9, -24, 10, 5.85, PARADA) : PARADA + 2 * (t - 91.5) ** 2 },
  { c: carro('police'), e: 'z', t0: 91.8, t1: DUR, s: t => -32 + 9 * (t - 92.0) },
  { c: carro('suv'), e: 'x', t0: 96.5, t1: DUR, s: t => t < 97.0 ? -40 : -40 + 10 * (t - 97.0) },
];
const NOITE = t => win(t, 64.31, 79.6, 0.45);
function updateCars(t) { for (const cd of cars) { const vis = t >= cd.t0 && t <= cd.t1; if (!vis) { cd.c.g.visible = false; continue; }
  let pe = 0; if (cd.jolt) pe = 0.12 * Math.exp(-Math.max(0, t - cd.jolt) * 6) * Math.sin(Math.max(0, t - cd.jolt) * 30) * (t > cd.jolt ? 1 : 0);
  if (cd.skid && t > cd.skid[0] && t < cd.skid[1]) pe -= 0.05;
  posCarro(cd.c, { visivel: true, x: cd.s(t), z: cd.e === "x" ? LA_Z : LB_X, eixo: cd.e, noite: NOITE(t), pitchExtra: pe }); } }

// ---------- pessoas ----------
const guarda = pessoa('male-a', 1.8, ['emote-yes']), ped = pessoa('female-c', 1.7, ['interact-right']);
const extras = [['male-b', 9, 5.6, -2.4], ['female-e', 10.2, -5.4, 0.3]].map(([n, x, z, r]) => { const o = pessoa(n, 1.75); o.g.position.set(x, CURB, z); o.g.rotation.y = r; return o; });
function guardaAt(t) { // [x,z,rot,anim,visível]
  if (t < 6.8) { const r = t < 2.9 ? -Math.PI / 2 : t < 5.5 ? Math.PI : Math.PI * 0.9; return [0, 0, r, t > 5.9 ? 'idle' : 'emote-yes', true]; }
  if (t < 9.0) { const u = P(t, 6.85, 8.9); return [lerp(0, -5.5, u), lerp(0, 6.0, u), -Math.PI * 0.77, 'walk', true]; }
  return [0, 0, 0, 'idle', false]; }
function pedAt(t) { // [x,y,z,rot,anim,visível]
  if (t < 79.4) return [0, 0, 0, 0, 'idle', false];
  if (t < 87.6) return [-6.6, CURB, 5.0, Math.PI, t > 85.0 && t < 86.0 ? 'interact-right' : 'idle', true];
  const z = lerp(5.0, -5.0, P(t, 87.6, 91.4)); const y = Math.abs(z) < 3.5 ? 0 : CURB; return [-6.9, y, z, Math.PI, t < 91.4 ? 'walk' : 'idle', true]; }

// ---------- estado dos semáforos ----------
function luzes(t) { // A = rua A, B = rua B; valores 'r' | 'y' | 'g' | '' ; P = pedestre 'r'|'g'
  let A = 'g', B = 'r', Pd = 'r';
  if (t < 13.96) { A = ''; B = ''; }
  else if (t < 19.27) { A = 'g'; B = 'r'; }
  else if (t < 23.85) { A = 'r'; B = 'g'; }
  else if (t < 26.49) { A = 'g'; B = 'r'; }
  else if (t < 29.6) { A = 'y'; B = 'r'; }
  else if (t < 33.72) { A = 'r'; B = 'g'; }
  else if (t < 34.75) { A = 'y'; B = 'r'; }
  else if (t < 41.69) { A = 'r'; B = 'g'; }
  else if (t < 45.69) { A = 'r'; B = 'r'; }
  else if (t < 48.44) { A = 'r'; B = 'g'; }
  else if (t < 64.31) { // demonstração do grupo focal (close)
    A = t < 55.4 ? 'r' : t < 56.65 ? 'r' : t < 57.74 ? 'y' : t < 59.8 ? 'g' : t < 60.5 ? 'r' : t < 61.2 ? 'y' : 'g'; B = 'r'; }
  else if (t < 77.6) { A = 'r'; B = 'g'; }
  else if (t < 85.8) { A = 'g'; B = 'r'; }
  else if (t < 87.0) { A = 'y'; B = 'r'; }
  else if (t < 91.4) { A = 'r'; B = 'r'; Pd = t > 87.4 ? 'g' : 'r'; }
  else if (t < 96.5) { A = 'r'; B = 'g'; }
  else { A = 'g'; B = 'r'; }
  return { A, B, Pd }; }
function setLight(L, on, t, tintY) { for (const k of ['r', 'y', 'g']) { const o = on === k; L.lamps[k].m.emissiveIntensity = o ? 3.2 : 0.06; L.halos[k].m.opacity = o ? 0.38 : 0; }
  L.caixa.material.emissive?.setRGB?.(tintY * .8, tintY * .6, 0); }

// ---------- marcações ----------
const XS = [ { s: 9.15, e: 10.7, p: [-2.4, 1.8, -1.0] }, { s: 23.0, e: 23.8, p: [-1.75, 1.8, 0.5] }, { s: 39.9, e: 40.9, p: [-1.75, 1.9, -2.5] },
  { s: 51.3, e: 52.55, p: [-7.6, 4.75, 3.6] }, { s: 68.0, e: 69.35, p: [-7.6, 4.75, 3.6] }, { s: 82.3, e: 83.15, p: [-6.6, 2.4, 5.0] } ];
const OKS = [ { s: 28.7, e: 29.6, p: t => [cars[7].s(t), 2.0, LA_Z] }, { s: 45.0, e: 45.65, p: [0, 1.0, 0] }, { s: 77.6, e: 78.15, p: [-7.6, 4.75, 3.6] }, { s: 91.2, e: 91.8, p: [-6.9, 2.4, -5.0] } ];
const BADGES = [ { t: '3 a 5 s', c: 'yellow', s: 28.8, e: 32.0, p: [-7.6, 4.9, 4.4] },
  { t: 'VERMELHO', c: 'red', s: 55.4, e: 58.6, p: [-7.6, 4.35, 5.5] }, { t: 'AMARELO', c: 'yellow', s: 56.65, e: 58.6, p: [-7.6, 3.95, 5.5] }, { t: 'VERDE', c: 'green', s: 57.74, e: 58.6, p: [-7.6, 3.55, 5.5] } ];
const LABELS = [['SEMÁFORO', 17.12, 19.2], ['TEMPO DE AMARELO', 32.1, 34.0], ['VERMELHO DE LIMPEZA', 46.47, 48.6], ['GRUPO FOCAL', 62.74, 64.5], ['LAÇO INDUTIVO', 78.17, 79.8], ['BOTOEIRA', 88.57, 90.1]];
const tintAt = (t, a, b) => win(t, a, b, .25) * (0.4 + 0.2 * Math.sin((t - a) * 9));

// ---------- câmera ----------
const SEG = [
  { a: 0, b: 5.56, A: pose3([-14, 7.5, 14], [0, 1, 0]), B: pose3([-11, 5.8, 11.5], [0, 1, 0]) },
  { a: 5.56, b: 7.6, A: pose3([-9, 3.4, 10], [-2.5, 1, 2.5]), B: pose3([-9.5, 3.4, 11], [-3.5, 1, 3.5]) },
  { a: 7.6, b: 10.81, whip: 1, A: pose3([10, 7, 10.5], [-1.8, 0.6, -1.5]), B: pose3([8.5, 6.2, 9.5], [-1.8, 0.6, -1.5]) },
  { a: 10.81, b: 14.6, whip: 1, A: pose3([-14, 4.6, 10.5], [-7.6, 3.2, 4.4]), B: pose3([-13, 4.4, 9.8], [-7.6, 3.4, 4.4]) },
  { a: 14.6, b: 18.22, whip: 1, A: pose3([-19, 6.5, 13], [-4, 1.6, 0.5]), B: pose3([-17, 6.8, 12], [-4, 1.6, 0.5]) },
  { a: 18.22, b: 23.85, whip: 1, f: t => { const x = Math.min(cars[6].s(t), -2); return pose3([x - 8.5, 2.8, 7.2], [x + 5, 1.2, 0]); } },
  { a: 23.85, b: 27.62, whip: 1, A: pose3([-12.8, 4.5, 8.6], [-7.6, 3.9, 4.4], 36), B: pose3([-12.2, 4.3, 8.2], [-7.6, 3.95, 4.4], 36) },
  { a: 27.62, b: 33.72, whip: 1, A: pose3([-19.5, 3.4, 8.5], [-9.5, 1.8, 2.5]), B: pose3([-18.5, 3.6, 8.0], [-9.5, 1.8, 2.5]) },
  { a: 33.72, b: 40.4, whip: 1, A: pose3([11, 9, 14], [-0.5, 0.5, -1]), B: pose3([9.5, 8.5, 12.5], [-0.5, 0.5, -1]) },
  { a: 40.4, b: 46.4, whip: 1, A: pose3([-13, 9.5, 14], [0, 0.5, 0]), B: pose3([-11, 8.8, 13], [0, 0.5, 0]) },
  { a: 46.4, b: 48.44, whip: 1, A: pose3([7, 7.5, 11], [-5.5, 2.4, -1.2], 44), B: pose3([6, 7.2, 10.5], [-5.5, 2.4, -1.2], 44) },
  { a: 48.44, b: 64.31, whip: 1, A: pose3([-11.3, 4.35, 7.6], [-7.6, 3.95, 4.4], 30), B: pose3([-10.8, 4.1, 7.1], [-7.6, 3.95, 4.4], 30) },
  { a: 64.31, b: 69.41, whip: 1, A: pose3([-21, 2.4, 3.6], [-6, 2.6, 1.2]), B: pose3([-20, 2.3, 3.4], [-6, 2.8, 1.2]) },
  { a: 69.41, b: 74.1, whip: 1, A: pose3([-16, 6.2, 6.5], [-11.8, 0, 1.75], 40), B: pose3([-15, 5.8, 5.8], [-11.8, 0, 1.75], 40) },
  { a: 74.1, b: 79.6, whip: 1, A: pose3([-18.5, 4.4, 7.2], [-9.5, 1.4, 1.6]), B: pose3([-17.5, 4.6, 6.8], [-9.5, 1.6, 1.6]) },
  { a: 79.6, b: 87.5, whip: 1, A: pose3([-1.2, 2.6, 10.5], [-7, 1.4, 3.8], 42), B: pose3([-1.6, 2.7, 10], [-7, 1.4, 3.6], 42) },
  { a: 87.5, b: 89.53, f: t => { const z = pedAt(t)[2]; return pose3([-1.6, 3.2, z + 6.5], [-6.8, 1.2, z - 1], 42); } },
  { a: 89.53, b: 93.96, whip: 1, A: pose3([-15, 10.5, 15], [-1, 0, 0]), B: pose3([-13.5, 10, 14], [-1, 0, 0]) },
  { a: 93.96, b: DUR + 1, f: t => { const u = eio(P(t, 93.96, 98.5)); const a = pose3([-13.5, 10, 14], [-1, 0, 0]), b = pose3([-24, 32, 30], [0, 0, 0]); const p = lerp3(a.p, b.p, u); const o = Math.max(0, t - 98.5) * 0.6; return pose3([p[0] + o, p[1], p[2]], lerp3(a.t, b.t, u)); } },
];

// ---------- estado no tempo t ----------
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3();
const smokeM = new THREE.MeshStandardMaterial({ color: 0xbfc4c8, transparent: true, opacity: 0.6, depthWrite: false, flatShading: true }); const smoke = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.35, 0), smokeM, 30); scene.add(smoke); smoke.frustumCulled = false;
function atualizar(t) {
  clima(t, NOITE(t), 0);
  updateCars(t);
  // guarda
  const [gx, gz, gr, ga, gv] = guardaAt(t); guarda.g.visible = gv; guarda.g.position.set(gx, 0, gz); guarda.g.rotation.y = gr; pose(guarda, t, ga);
  const [px, py, pz, pr, pa, pv] = pedAt(t); ped.g.visible = pv; ped.g.position.set(px, py, pz); ped.g.rotation.y = pr; pose(ped, t, pa); extras.forEach((o, i) => pose(o, t + i));
  // semáforos aparecem
  const ap = t < 12.85 ? 0 : back(P(t, 12.85, 13.25)); LA.g.scale.setScalar(Math.max(0.001, ap)); LB.g.scale.setScalar(Math.max(0.001, ap));
  // 2 luzes -> 3 luzes (amarela entra no meio)
  const y3 = eio(P(t, 25.0, 25.5));
  for (const L of [LA, LB]) { L.caixa.scale.y = lerp(0.72, 1.0, y3); L.placa.scale.y = lerp(0.75, 1.0, y3); L.lamps.r.mesh.position.y = L.halos.r.mesh.position.y = lerp(0.18, 0.36, y3); L.lamps.g.mesh.position.y = L.halos.g.mesh.position.y = lerp(-0.18, -0.36, y3);
    L.lamps.y.mesh.scale.setScalar(Math.max(0.001, t < 25.29 ? 0 : back(P(t, 25.29, 25.6)))); L.halos.y.mesh.scale.setScalar(L.lamps.y.mesh.scale.x); }
  const st = luzes(t); const tSem = tintAt(t, 17.12, 18.9), tGF = tintAt(t, 62.74, 64.3);
  setLight(LA, st.A, t, Math.max(tSem, tGF)); setLight(LB, st.B, t, tSem);
  if (t >= 46.47 && t < 48.44) { for (const L of [LA, LB]) L.halos.r.m.opacity = 0.4 + 0.25 * Math.sin((t - 46.4) * 9); }
  // pedestre
  pedG.scale.setScalar(t < 86.09 ? 0.001 : back(P(t, 86.09, 86.45))); pedScreen.material.map = st.Pd === 'g' ? texPedG : texPedR;
  bot.scale.setScalar(t < 84.63 ? 0.001 : back(P(t, 84.63, 84.95))); const tb = Math.max(tintAt(t, 88.57, 89.5), win(t, 85.2, 85.9, .1)); botM.emissive.setRGB(tb * .9, tb * .7, 0);
  // laço indutivo: corte no asfalto e fio
  const cutU = P(t, 69.9, 70.8) * lacoLen, fioU = P(t, 70.83, 72.4) * lacoLen; let acc = 0; const lacoOn = t > 69.6 && t < 81;
  const tl = tintAt(t, 78.17, 79.5); lacoM.emissiveIntensity = 0.6 + tl * 2;
  for (const o of lacoObjs) { o.cut.visible = o.fio.visible = lacoOn; o.cut.scale.x = Math.max(0.001, Math.min(o.L, cutU - acc)); o.fio.scale.x = Math.max(0.001, Math.min(o.L, fioU - acc)); acc += o.L; }
  pulsos.forEach((r, i) => { const ph = (t - 76.3 - i * 0.35); const on = ph > 0 && ph < 1.1 && t < 77.6; r.visible = on; if (on) { r.scale.setScalar(1.9 + ph * 2.2); r.material.opacity = 0.7 * (1 - ph / 1.1); } });
  // fumaça da derrapagem
  const sk = t > 21.5 && t < 25.3; smoke.visible = sk; if (sk) { for (let i = 0; i < 30; i++) { const born = 21.5 + i * 0.1; const age = t - born; if (age < 0 || born > 24.6) { V.set(0, -50, 0); M4.compose(V, Q, S.setScalar(0.01)); smoke.setMatrixAt(i, M4); continue; }
      V.set(cars[6].s(born) - 1.4 - age * 0.5, 0.25 + age * 0.5, LA_Z + ((i % 2) ? 0.86 : -0.86)); M4.compose(V, Q.identity(), S.setScalar(0.5 + age * 1.1)); smoke.setMatrixAt(i, M4); } smoke.instanceMatrix.needsUpdate = true; smokeM.opacity = 0.55 * (1 - P(t, 24.6, 25.3)); }
  confete(t, 93.96, [-1, 0, 0]);
}
const filtro = t => { const g = Math.max(win(t, 48.9, 52.6, 0.3), win(t, 59.75, 62.4, 0.3)); return g > 0 ? `grayscale(${g.toFixed(2)})` : ''; };
iniciar({ dur: DUR, fimFala: FIM_FALA, seg: SEG, rotulos: LABELS, xs: XS, oks: OKS, badges: BADGES, atualizar, filtro });
