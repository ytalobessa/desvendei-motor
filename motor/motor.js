// =====================================================================
// MOTOR DESVENDEI v2 — three.js + modelos Kenney (CC0)
// A cena de cada vídeo (cena.js) importa este arquivo e só descreve:
// o mundo, o que muda com o tempo (atualizar), câmera, rótulos, X, checks e badges.
// =====================================================================
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
export { THREE };

// ---------- utilidades ----------
export const W = 1080, H = 1920;
export const P = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
export const sm = x => x * x * (3 - 2 * x);
export const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
export const eout = x => 1 - Math.pow(1 - x, 3);
export const back = x => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
export const lerp = (a, b, x) => a + (b - a) * x;
export const lerp3 = (a, b, x) => [lerp(a[0], b[0], x), lerp(a[1], b[1], x), lerp(a[2], b[2], x)];
export const win = (t, a, b, f = .35) => sm(P(t, a, a + f)) * (1 - sm(P(t, b - f, b)));
export function rng(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const R = rng(51);

// ---------- renderer / cena / luz ----------
const RS = (new URLSearchParams(location.search).get('q') === 'alta') ? 1.0 : 0.75;
export const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(Math.round(W * RS), Math.round(H * RS), false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
export const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xdfe7ee, 35, 170);
export const cam = new THREE.PerspectiveCamera(40, W / H, 0.05, 900);
export const hemi = new THREE.HemisphereLight(0xeef4ff, 0xd9d2c3, 1.9); scene.add(hemi);
export const sun = new THREE.DirectionalLight(0xfff3e2, 2.5); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 12; sun.shadow.blurSamples = 24;
Object.assign(sun.shadow.camera, { left: -42, right: 42, top: 42, bottom: -42, near: 5, far: 160 }); sun.shadow.bias = -0.0004;
sun.position.set(-30, 60, 40); sun.target.position.set(-6, 0, -2); scene.add(sun, sun.target);
/** Centro da área com sombra (mude se a ação acontece longe da origem). */
export function centroSombra(x, z) { sun.position.set(x - 24, 60, z + 42); sun.target.position.set(x, 0, z); }

// ---------- materiais e primitivas ----------
export const mat = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, flatShading: true, roughness: .9 }, o));
export function mesh(geo, m, x = 0, y = 0, z = 0, parent = scene, shadow = true) { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = shadow; me.receiveShadow = true; parent.add(me); return me; }
export function boxAt(x0, x1, y0, y1, z0, z1, m, parent = scene, shadow = true) { return mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), m, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, parent, shadow); }
const TEXS = [];
/** Textura desenhada em canvas 2D (redesenhada quando a fonte Montserrat carrega). */
export function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t.userData.redraw = () => { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h); draw(g, w, h); t.needsUpdate = true; }; TEXS.push(t); return t; }

// ---------- modelos Kenney ----------
export const GL = {}; const gltfLoader = new GLTFLoader();
/** Carrega modelos de models/<kit>/<nome>.glb. Ex.: 'car/sedan', 'nature/tree_oak'. */
export async function carregar(lista) { await Promise.all([...new Set(lista)].filter(p => !GL[p]).map(p => new Promise((res, rej) => gltfLoader.load('models/' + p + '.glb', g => { GL[p] = g; res(); }, undefined, () => rej(new Error('modelo não encontrado: ' + p)))))); }
/** Coloca um modelo com a base em y e o centro em (x,z). size = tamanho alvo (maior lado em x/z, ou altura se axis='y'). */
export function modelo(p, x, y, z, ry = 0, size = null, axis = 'x', parent = scene) { const src = GL[p]; if (!src) throw new Error('carregue antes: ' + p); const o = src.scene.clone(true);
  o.traverse(c => { if (c.isMesh) { c.castShadow = c.receiveShadow = true; } });
  if (size) { const b = new THREE.Box3().setFromObject(o); const s = b.getSize(new THREE.Vector3()); o.scale.setScalar(size / (axis === 'y' ? s.y : Math.max(s.x, s.z))); }
  o.rotation.y = ry; o.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(o); const c = bb.getCenter(new THREE.Vector3()); o.position.set(x - c.x, y - bb.min.y, z - c.z); parent.add(o); return o; }
export const ARVORES = ['tree_oak', 'tree_default', 'tree_detailed', 'tree_fat', 'tree_pineRoundA', 'tree_pineTallA', 'tree_oak_dark', 'tree_default_dark'].map(n => 'nature/' + n);
export const PLANTAS = ['plant_bush', 'plant_bushLarge', 'flower_yellowA', 'flower_redA', 'plant_bushDetailed', 'flower_purpleA'].map(n => 'nature/' + n);
export const CASAS = 'abcdefghijklmnopqrstu'.split('').map(c => 'city-suburban/building-type-' + c);
export const CARROS = ['sedan', 'sedan-sports', 'hatchback-sports', 'suv', 'suv-luxury', 'van', 'taxi', 'delivery', 'police', 'ambulance', 'truck', 'firetruck', 'garbage-truck', 'tractor'].map(n => 'car/' + n);
export const PESSOAS = ['female-a', 'female-b', 'female-c', 'female-d', 'female-e', 'female-f', 'male-a', 'male-b', 'male-c', 'male-d', 'male-e', 'male-f'].map(n => 'mini-characters/character-' + n);

// ---------- céu ----------
const skyU = { top: { value: new THREE.Color(0x3f8be0) }, bot: { value: new THREE.Color(0xdcefff) } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(800, 24, 12), new THREE.ShaderMaterial({ uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vP; void main(){ vP=(modelMatrix*vec4(position,1.)).xyz; gl_Position=projectionMatrix*viewMatrix*vec4(vP,1.); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying vec3 vP; void main(){ float h=clamp(normalize(vP-cameraPosition).y*1.6+0.05,0.,1.); gl_FragColor=vec4(mix(bot,top,pow(h,0.8)),1.); }' }));
scene.add(sky);

// ---------- mundo genérico ----------
const cloudM = mat(0xffffff, { roughness: 1, emissive: 0x9aa6b0, emissiveIntensity: .25 }); export const nuvens = new THREE.Group(); scene.add(nuvens);
/** Chão verde com colinas (planas perto do eixo z = 0 até `plano` metros), morros e nuvens. */
export function mundo({ plano = 45, cor = 0x74c552, nuvem = true } = {}) {
  const g = new THREE.PlaneGeometry(700, 700, 70, 70); g.rotateX(-Math.PI / 2); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const d = Math.max(0, Math.abs(z) - plano); p.setY(i, -0.02 + (d > 0 ? Math.pow(d / 60, 1.4) * 6 * (0.6 + 0.4 * Math.sin(x * 0.03) * Math.cos(z * 0.05)) : 0)); }
  g.computeVertexNormals(); mesh(g, mat(cor), 0, 0, 0, scene, false);
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2 + R() * .2, r = 230 + R() * 80; const m = mesh(new THREE.IcosahedronGeometry(30 + R() * 30, 1), mat(R() > .5 ? 0x5fae55 : 0x4f9e4a), Math.cos(a) * r, -8, Math.sin(a) * r - 40, scene, false); m.scale.y = .45 + R() * .3; }
  if (nuvem) for (let i = 0; i < 18; i++) { const gg = new THREE.Group(); gg.position.set(-200 + R() * 400, 38 + R() * 22, -160 + R() * 160);
    for (let k = 0; k < 6; k++) { const m = mesh(new THREE.IcosahedronGeometry(4 + R() * 5, 0), cloudM, (k - 2.5) * 4.5 + R() * 2, R() * 3, R() * 4, gg, false); m.rotation.set(R() * 3, R() * 3, R() * 3); } nuvens.add(gg); }
  const far = []; for (let i = 0; i < 260; i++) far.push([-260 + R() * 520, (R() > .5 ? 1 : -1) * (plano + 5 + R() * 90)]);
  const lf = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), mat(0x4fae4a), far.length), pn = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 7), mat(0x2f8a55), far.length); const m4 = new THREE.Matrix4(); let a = 0, b = 0;
  far.forEach(([x, z]) => { const s = 2.5 + R() * 2.5; const yb = Math.max(0, Math.abs(z) - plano); const gy = yb > 0 ? Math.pow(yb / 60, 1.4) * 6 * 0.6 : 0;
    if (R() > .5) { m4.compose(new THREE.Vector3(x, gy + s * 1.6, z), new THREE.Quaternion(), new THREE.Vector3(s * .9, s * 3, s * .9)); pn.setMatrixAt(b++, m4); } else { m4.compose(new THREE.Vector3(x, gy + s * 1.4, z), new THREE.Quaternion(), new THREE.Vector3(s, s, s)); lf.setMatrixAt(a++, m4); } });
  lf.count = a; pn.count = b; scene.add(lf, pn); }
/** Rua ao longo do eixo x: pista de z=-largura/2 a +largura/2, calçadas com meio-fio de altura `meioFio`. */
export function rua({ largura = 7, calcada = 3.3, meioFio = 0.3, x0 = -260, x1 = 260, faixa = true, buracoFaixa = null } = {}) { const L = largura / 2;
  boxAt(x0, x1, -0.3, 0, -L, L, mat(0x3a3d43, { roughness: .95 }), scene, false);
  const sideM = mat(0xd3cfc6), curbM = mat(0xeeeae2); boxAt(x0, x1, -0.3, meioFio, -L - calcada, -L, sideM); boxAt(x0, x1, -0.3, meioFio, L, L + calcada, sideM);
  boxAt(x0, x1, meioFio - 0.02, meioFio + 0.01, -L - 0.22, -L, curbM, scene, false); boxAt(x0, x1, meioFio - 0.02, meioFio + 0.01, L, L + 0.22, curbM, scene, false);
  const yel = mat(0xf2c230, { roughness: .6 }), wh = mat(0xf5f5f0, { roughness: .6 });
  if (faixa) { const segs = buracoFaixa ? [[x0, buracoFaixa[0]], [buracoFaixa[1], x1]] : [[x0, x1]]; for (const [a, b] of segs) { boxAt(a, b, 0.001, 0.012, -0.16, -0.06, yel, scene, false); boxAt(a, b, 0.001, 0.012, 0.06, 0.16, yel, scene, false); } }
  boxAt(x0, x1, 0.001, 0.012, -L + 0.2, -L + 0.3, wh, scene, false); boxAt(x0, x1, 0.001, 0.012, L - 0.3, L - 0.2, wh, scene, false); }
/** Casas Kenney em fileira dos dois lados (pula x entre `vazio`). */
export function casas({ zPerto = 12.5, zLonge = 28, x0 = -115, x1 = 125, passo = 13, vazio = [-28, 22], tamanho = 8.5 } = {}) { let k = 0; const prox = () => CASAS[(k++ * 7) % CASAS.length];
  for (let x = x0; x <= x1; x += passo) { if (x > vazio[0] && x < vazio[1]) continue; modelo(prox(), x + R() * 2, 0, zPerto + R() * 1.5, Math.PI, tamanho + R() * 1.5); modelo(prox(), x + R() * 2, 0, -zPerto - R() * 1.5, 0, tamanho + R() * 1.5); }
  for (let x = x0; x <= x1; x += 12) { modelo(prox(), x + R() * 4, 0, zLonge + R() * 6, Math.PI, tamanho); modelo(prox(), x + R() * 4, 0, -zLonge - 2 - R() * 6, 0, tamanho); } }
/** Árvores Kenney. lista = [[x,z], ...]; y = altura do chão (ex.: meio-fio). */
export function arvores(lista, y = 0) { lista.forEach(([x, z, yy], i) => modelo(ARVORES[i % ARVORES.length], x, yy ?? y, z, R() * 6, 4.8 + R() * 3.5, 'y')); }

// ---------- carros ----------
/** Carro Kenney virado para +x, com rodas separadas. comprimento em metros. */
export function carro(nome, comprimento = 4.3) { const g = new THREE.Group(); scene.add(g); const O = new THREE.Group(); g.add(O);
  const m = GL['car/' + nome].scene.clone(true); O.add(m); m.traverse(c => { if (c.isMesh) { c.castShadow = c.receiveShadow = true; } });
  const bb = new THREE.Box3().setFromObject(m), sz = bb.getSize(new THREE.Vector3()); const axisZ = sz.z >= sz.x; const k = comprimento / (axisZ ? sz.z : sz.x);
  const body = m.getObjectByName('body'), Wn = n => m.getObjectByName(n); const wf = [Wn('wheel-front-left'), Wn('wheel-front-right')], wb = [Wn('wheel-back-left'), Wn('wheel-back-right')];
  const comp = o => axisZ ? o.position.z : o.position.x; const sF = comp(wf[0]) > comp(wb[0]) ? 1 : -1;
  O.scale.setScalar(k); O.rotation.y = axisZ ? (sF > 0 ? Math.PI / 2 : -Math.PI / 2) : (sF > 0 ? 0 : Math.PI); O.position.y = -bb.min.y * k;
  const half = Math.abs(comp(wf[0]) - comp(wb[0])) * k / 2; const base = { by: body.position.y, wy: [...wf, ...wb].map(w => w.position.y) };
  const hl = new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xfff0b0, emissiveIntensity: 0 }); const hlG = new THREE.Group(); g.add(hlG);
  const fx = comprimento / 2 - 0.05; boxAt(fx, fx + 0.06, 0.55, 0.72, -0.72, -0.48, hl, hlG, false); boxAt(fx, fx + 0.06, 0.55, 0.72, 0.48, 0.72, hl, hlG, false);
  const beamM = new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const bgeo = new THREE.ConeGeometry(2.2, 12, 16, 1, true); bgeo.rotateZ(Math.PI / 2); bgeo.translate(-6, 0, 0); const beam = new THREE.Mesh(bgeo, beamM); beam.position.set(fx, 0.65, 0); beam.rotation.z = Math.PI + 0.06; hlG.add(beam);
  g.visible = false; return { g, body, wheels: [...wf, ...wb], base, k, axisZ, sF, half, hl, hlG, beamM }; }
/**
 * Posiciona o carro. chao(x,z) = altura do piso sob cada roda (ex.: quebra-molas).
 * eixo 'x' (padrão): anda ao longo de x na faixa z. eixo 'z': anda ao longo de z (x vira a posição no eixo z e z vira a faixa em x).
 * amp = sacudida depois de passar por x=xImpacto. pitchExtra = inclinação somada (freada < 0).
 */
export function posCarro(c, { x, z, dir = 1, chao = () => 0, amp = 0, xImpacto = 0, pitchExtra = 0, noite = 0, visivel = true, eixo = 'x' }) {
  c.g.visible = visivel; if (!visivel) return; const xf = x + c.half * dir, xr = x - c.half * dir; const hf = chao(xf, z), hr = chao(xr, z);
  let y = (hf + hr) / 2, pitch = Math.atan2(hf - hr, 2 * c.half) + pitchExtra; const d = (x - xImpacto) * dir;
  if (amp > 0 && d > 0) { const e = Math.exp(-d * 0.35); y += amp * e * Math.abs(Math.sin(d * 0.9)); pitch += amp * 0.35 * e * Math.sin(d * 0.9 + 0.6); }
  if (eixo === 'z') { c.g.position.set(z, 0, x); c.g.rotation.y = dir > 0 ? -Math.PI / 2 : Math.PI / 2; } else { c.g.position.set(x, 0, z); c.g.rotation.y = dir > 0 ? 0 : Math.PI; } c.body.position.y = c.base.by + y / c.k;
  if (c.axisZ) c.body.rotation.x = -pitch * c.sF; else c.body.rotation.z = pitch * c.sF;
  const hs = [hf, hf, hr, hr], spin = x / 0.36 * dir; c.wheels.forEach((w, i) => { w.position.y = c.base.wy[i] + hs[i] / c.k; if (c.axisZ) w.rotation.x = spin * c.sF; else w.rotation.z = -spin * c.sF; });
  c.hlG.position.y = y; c.hlG.rotation.z = pitch; c.hl.emissiveIntensity = noite * 5; c.beamM.opacity = noite * 0.09; }

// ---------- pessoas (com animação) ----------
/** Personagem Kenney (mini-characters). Animações: idle, walk, sprint, jump, sit, crouch, emote-yes, emote-no, pick-up, interact-right... */
export function pessoaKenney(nome, altura = 1.75, extras = []) { const g = new THREE.Group(); scene.add(g); const src = GL['mini-characters/character-' + nome]; const m = SkeletonUtils.clone(src.scene); g.add(m);
  m.traverse(c => { if (c.isMesh) { c.castShadow = c.receiveShadow = true; c.frustumCulled = false; } });
  const bb = new THREE.Box3().setFromObject(m); const k = altura / bb.getSize(new THREE.Vector3()).y; m.scale.setScalar(k); m.position.y = -bb.min.y * k;
  const mixer = new THREE.AnimationMixer(m); const acts = {}; for (const n of ['idle', 'walk', ...extras]) { const cl = src.animations.find(a => a.name === n); if (cl) { acts[n] = mixer.clipAction(cl); acts[n].play(); acts[n].setEffectiveWeight(0); } }
  return { g, mixer, acts }; }
/** Pose no tempo t: anim = 'idle' | 'walk' | outra carregada em extras. */
// pessoa: agora é um peão (estilo suave). Cor e chapéu saem do nome, para cada personagem ficar sempre igual.
const PALETA = [[0x3d5fbf, 0x1f3a8a], [0xd0607a, 0xf2c230], [0x5aa86a, 0x2f6b3a], [0xe08a3c, 0xffffff], [0x8a6fd0, 0xf0f0f0], [0x4fa3b8, 0xe0503a]];
export function pessoa(nome = 'a', altura = 1.75, extras = []) { let h = 0; for (const c of String(nome)) h = (h * 31 + c.charCodeAt(0)) >>> 0; const [cor, ch] = PALETA[h % PALETA.length];
  return peao(cor, /worker|operario|eletric|pedreiro/.test(nome) ? 'capacete' : 'bone', altura, ch); }
export function pose(p, t, anim = 'idle') {
  if (!p.mixer || !p.acts || !Object.keys(p.acts).length) { if (!p.B) return; // peão: animação simples feita no código
    if (anim === 'walk') { p.B.position.y = Math.abs(Math.sin(t * 9)) * 0.07; p.B.rotation.z = Math.sin(t * 9) * 0.09; p.B.rotation.x = 0.06; }
    else if (anim.startsWith('interact') || anim.startsWith('emote')) { p.B.position.y = Math.abs(Math.sin(t * 6)) * 0.04; p.B.rotation.x = 0.12 + Math.sin(t * 6) * 0.06; p.B.rotation.z = 0; }
    else { p.B.position.y = 0; p.B.rotation.x = 0; p.B.rotation.z = Math.sin(t * 1.6) * 0.02; p.B.scale.y = p.B.scale.x * (1 + Math.sin(t * 2.2) * 0.012); }
    return; }
  for (const [n, a] of Object.entries(p.acts)) a.setEffectiveWeight(n === anim ? 1 : 0); p.mixer.setTime(t); }

// ---------- clima: dia / chuva / noite ----------
const C = a => new THREE.Color(a);
const DAY = { top: C(0x6f9fd6), bot: C(0xe2ecf4), fog: C(0xdfe7ee), hemi: 1.9, sun: 2.5 }, NIG = { top: C(0x14254a), bot: C(0x3a5486), fog: C(0x2a3c66), hemi: 0.45, sun: 0.35 }, RAINY = { top: C(0x7d8894), bot: C(0xb9c2ca), fog: C(0xaab3bb), hemi: 1.1, sun: 0.9 };
const rainN = 900; const rain = new THREE.InstancedMesh(new THREE.BoxGeometry(0.02, 0.7, 0.02), new THREE.MeshBasicMaterial({ color: 0xdfefff, transparent: true, opacity: 0.55 }), rainN); scene.add(rain); rain.frustumCulled = false;
const rainSeed = Array.from({ length: rainN }, () => [R(), R(), R(), R()]); const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), E = new THREE.Euler();
export const luzesNoite = []; // materiais emissivos que acendem à noite (postes, janelas)
/** noite e chuva de 0 a 1. */
export function clima(t, noite = 0, chuva = 0) {
  const mix = k => DAY[k].clone ? DAY[k].clone().lerp(RAINY[k], chuva).lerp(NIG[k], noite) : lerp(lerp(DAY[k], RAINY[k], chuva), NIG[k], noite);
  skyU.top.value.copy(mix('top')); skyU.bot.value.copy(mix('bot')); scene.fog.color.copy(mix('fog')); hemi.intensity = mix('hemi'); sun.intensity = mix('sun'); sun.color.setHex(noite > .5 ? 0xa8bcff : 0xfff3e2);
  luzesNoite.forEach(m => m.emissiveIntensity = noite * 3); cloudM.emissiveIntensity = 0.25 * (1 - noite); cloudM.color.setHex(noite > .5 ? 0x4a5878 : (chuva > .5 ? 0xc9d0d6 : 0xffffff)); nuvens.position.x = t * 0.4;
  rain.visible = chuva > 0.01; if (rain.visible) { const cp = cam.position; for (let i = 0; i < rainN; i++) { const [a, b, , d] = rainSeed[i]; const ph = (t * 1.6 + d) % 1; V.set(cp.x - 14 + a * 28, 14 - ph * 16, cp.z - 16 + b * 22); if (i / rainN > chuva) V.y = -50; M4.compose(V, Q.identity(), S.set(1, 1, 1)); rain.setMatrixAt(i, M4); } rain.instanceMatrix.needsUpdate = true; } }

// ---------- confete ----------
const confCols = [0xffc21a, 0xff5a52, 0x3fae4a, 0x2f8fe8, 0xffffff, 0xd84fd8];
const conf = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.16, 0.1), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), 220); scene.add(conf); conf.frustumCulled = false; conf.visible = false;
const confSeed = Array.from({ length: 220 }, (_, i) => { conf.setColorAt(i, new THREE.Color(confCols[i % confCols.length])); return [R(), R(), R(), R()]; });
export function confete(t, inicio, alvo) { const on = t > inicio; conf.visible = on; if (!on) return; for (let i = 0; i < 220; i++) { const [a, b, c, d] = confSeed[i]; const age = t - inicio - d * 0.6; V.set(alvo[0] - 6 + a * 12, Math.max(-5, alvo[1] + 7 - age * (1.6 + c)), alvo[2] - 5 + b * 10); E.set(age * 4 + a * 6, age * 3 + b * 6, 0); Q.setFromEuler(E); M4.compose(V, Q, S.setScalar(age < 0 ? 0.001 : 2.2)); conf.setMatrixAt(i, M4); } conf.instanceMatrix.needsUpdate = true; conf.instanceColor.needsUpdate = true; }

// ---------- câmera ----------
export const pose3 = (p, t, f = 40) => ({ p, t, f });
let SEG = [];
function segPose(s, t) { if (s.f) return s.f(t); const u = eio(P(t, s.a, s.b)); return pose3(lerp3(s.A.p, s.B.p, u), lerp3(s.A.t, s.B.t, u), lerp(s.A.f ?? 40, s.B.f ?? 40, u)); }
const WHIP = 0.32;
export function camPose(t) { let i = 0; while (i < SEG.length - 1 && SEG[i + 1].a <= t) i++; const s = SEG[i]; let p = segPose(s, t);
  if (i > 0 && t < s.a + WHIP && s.whip) { const prev = segPose(SEG[i - 1], s.a); const u = eio(P(t, s.a, s.a + WHIP)); p = pose3(lerp3(prev.p, p.p, u), lerp3(prev.t, p.t, u), lerp(prev.f, p.f, u)); } return p; }
export const project = v => { const p = new THREE.Vector3(...v).project(cam); return [(p.x * .5 + .5) * W, (-p.y * .5 + .5) * H]; };

// ---------- overlays ----------
const $ = id => document.getElementById(id);
let CFG = null, WORDS = [], XS = [], OKS = [], BADGES = [];
function overlays(t) { const capEl = $('cap'), lab = $('lab'), ctaEl = $('cta');
  let w = null; for (const x of WORDS) { if (t >= x.s - .02) w = x; else break; }
  if (w && t - w.e < .35 && t < CFG.fimFala + 0.1) { capEl.textContent = w.w; capEl.className = w.hl ? 'hl' : ''; capEl.style.transform = `scale(${lerp(1.15, 1, eout(P(t, w.s - .02, w.s + .08)))})`; capEl.style.opacity = 1; } else capEl.style.opacity = 0;
  const L = CFG.rotulos.find(l => t >= l[1] && t < l[2]);
  if (L) { lab.textContent = L[0]; const u = back(P(t, L[1], L[1] + .3)), o = 1 - P(t, L[2] - .45, L[2]); lab.style.transform = `rotate(-5deg) scale(${Math.max(0, u)})`; lab.style.opacity = o; } else lab.style.opacity = 0;
  for (const x of [...XS, ...OKS]) { if (t < x.s || t > x.e) { x.d.style.display = 'none'; continue; } const p = typeof x.p === 'function' ? x.p(t) : x.p; const [sx, sy] = project(p); const u = back(P(t, x.s, x.s + .22)), o = 1 - P(t, x.e - .18, x.e);
    x.d.style.display = 'block'; x.d.style.left = sx + 'px'; x.d.style.top = sy + 'px'; x.d.style.transform = `scale(${Math.max(0, u * o)})`; }
  for (const b of BADGES) { if (t < b.s || t > b.e) { b.d.style.display = 'none'; continue; } const p = typeof b.p === 'function' ? b.p(t) : b.p; let [sx, sy] = b.fixo ? b.fixo : project(p);
    const u = back(P(t, b.s, b.s + .25)), o = 1 - P(t, b.e - .15, b.e); b.d.style.display = 'block'; const bw = b.d.offsetWidth, bh = b.d.offsetHeight;
    b.d.style.left = Math.max(30, Math.min(W - 30 - bw, sx - bw / 2)) + 'px'; b.d.style.top = Math.max(380, Math.min(1300, sy - bh)) + 'px'; b.d.style.transform = `scale(${Math.max(0, u * o)})`; }
  const ct = P(t, CFG.fimFala + 0.3, CFG.fimFala + 0.8); ctaEl.style.opacity = ct; ctaEl.style.transform = `scale(${lerp(0.85, 1, back(ct))})`; }

// ---------- render com desfoque de movimento ----------
const composer = new EffectComposer(renderer); composer.setPixelRatio(1); composer.setSize(Math.round(W * RS), Math.round(H * RS));
composer.addPass(new RenderPass(scene, cam));
const gtao = new GTAOPass(scene, cam, Math.round(W * RS), Math.round(H * RS)); gtao.blendIntensity = 1.0; gtao.updateGtaoMaterial({ radius: 0.9, distanceExponent: 1.5, thickness: 1.2, scale: 1.0, samples: 16 }); composer.addPass(gtao);
export const bokeh = new BokehPass(scene, cam, { focus: 15, aperture: 0.0015, maxblur: 0.0045 }); composer.addPass(bokeh);
composer.addPass(new OutputPass()); composer.addPass(new SMAAPass(Math.round(W * RS), Math.round(H * RS)));
const glc = renderer.domElement; let octx = null;
function aplicar(t) { const c = camPose(t); cam.position.set(...c.p); cam.lookAt(...c.t); bokeh.uniforms.focus.value = Math.hypot(c.p[0] - c.t[0], c.p[1] - c.t[1], c.p[2] - c.t[2]); cam.fov = c.f; cam.updateProjectionMatrix(); CFG.atualizar(t); }
function camSpeed(t) { const a = camPose(t), b = camPose(t - 1 / 30); return Math.max(Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1], a.p[2] - b.p[2]), Math.hypot(a.t[0] - b.t[0], a.t[1] - b.t[1], a.t[2] - b.t[2])); }
function renderAt(t) { const sp = camSpeed(t); const n = sp > 0.9 ? 5 : sp > 0.45 ? 3 : 1;
  if (n === 1) { aplicar(t); composer.render(); octx.globalAlpha = 1; octx.drawImage(glc, 0, 0, W, H); }
  else { for (let k = 0; k < n; k++) { aplicar(t - (1 / 30) * (n - 1 - k) / n); composer.render(); octx.globalAlpha = 1 / (k + 1); octx.drawImage(glc, 0, 0, W, H); } octx.globalAlpha = 1; aplicar(t); }
  if (CFG.filtro) $('out').style.filter = CFG.filtro(t) || 'none';
  overlays(t); }

/**
 * Inicia o vídeo. cfg = {
 *   dur: duração total (fala + ~5s de CTA), fimFala: segundo em que a narração termina,
 *   seg: [{a,b,A:pose3(p,t,f),B:pose3(...),whip:1} | {a,b,f:t=>pose3(...),whip:1}, ...]  (câmera; whip = troca rápida com desfoque)
 *   rotulos: [['TERMO', inicio, fim]], xs: [{s,e,p:[x,y,z] | t=>[x,y,z]}], oks: [...], badges: [{t:'10 cm', c:'yellow|green|red|', s,e,p}],
 *   atualizar: t => { ... posiciona tudo no tempo t (função pura, sem estado) ... }
 *   filtro (opcional): t => 'grayscale(1)' etc., filtro CSS na imagem 3D (ex.: simular daltonismo)
 * }
 */
export function iniciar(cfg) { CFG = cfg; SEG = cfg.seg; octx = $('out').getContext('2d');
  const mk = (cls, inner = '') => { const d = document.createElement('div'); d.className = cls; d.innerHTML = inner; $('xs').appendChild(d); return d; };
  XS = (cfg.xs || []).map(o => ({ ...o, d: mk('x', '<i></i>') })); OKS = (cfg.oks || []).map(o => ({ ...o, d: mk('ok') }));
  BADGES = (cfg.badges || []).map(o => { const d = document.createElement('div'); d.className = 'b ' + (o.c || ''); d.textContent = o.t; $('bs').appendChild(d); return { ...o, d }; });
  window.renderAt = renderAt;
  fetch('words.json').then(r => r.json()).then(w => { WORDS = w; return document.fonts.load('800 50px M'); }).then(() => document.fonts.load('900 50px M'))
    .then(() => { suavizar(); TEXS.forEach(t => t.userData.redraw()); renderAt(0); window.ready = true; }); }
// estilo suave: cores mais claras e menos saturadas em todos os materiais (inclusive texturas dos modelos)
function suavizar() { const feitos = new Set(); scene.traverse(o => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) { if (feitos.has(m) || !m.isMeshStandardMaterial || m.userData.cru) continue; feitos.add(m);
  m.roughness = Math.max(m.roughness ?? 1, 0.65); m.metalness = Math.min(m.metalness ?? 0, 0.2);
  m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n float lum_ = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114)); diffuseColor.rgb = mix(vec3(lum_), diffuseColor.rgb, 0.86); diffuseColor.rgb = diffuseColor.rgb * 0.9 + 0.07;'); }; m.needsUpdate = true; } }); }
// personagem peão (cabeça redonda, corpo em cone, chapéu), com contorno
export function peao(cor = 0x4f6fd0, chapeu = 'bone', altura = 1.7, corChapeu = 0x2f4fb0) { const g = new THREE.Group(); scene.add(g); const k = altura / 1.7; const B = new THREE.Group(); B.scale.setScalar(k); g.add(B);
  const corpoM = new THREE.MeshStandardMaterial({ color: cor, roughness: .7 }), peleM = new THREE.MeshStandardMaterial({ color: 0xf0d2b0, roughness: .8 }), chM = new THREE.MeshStandardMaterial({ color: corChapeu, roughness: .6 });
  const perfil = [[0, 0], [0.34, 0], [0.36, 0.06], [0.3, 0.14], [0.2, 0.55], [0.13, 1.0], [0.16, 1.08], [0.1, 1.14], [0, 1.15]].map(([x, y]) => new THREE.Vector2(x, y));
  const corpo = new THREE.Mesh(new THREE.LatheGeometry(perfil, 32), corpoM); const cabeca = new THREE.Mesh(new THREE.SphereGeometry(0.24, 32, 20), peleM); cabeca.position.y = 1.36; B.add(corpo, cabeca);
  if (chapeu === 'bone') { const c = new THREE.Mesh(new THREE.SphereGeometry(0.25, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), chM); c.position.y = 1.4; const aba = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.025, 24, 1, false, -Math.PI / 2, Math.PI), chM); aba.position.set(0, 1.41, 0.17); aba.scale.z = 1.3; B.add(c, aba); }
  if (chapeu === 'capacete') { const c = new THREE.Mesh(new THREE.SphereGeometry(0.27, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), chM); c.position.y = 1.42; const aba = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.03, 32), chM); aba.position.y = 1.42; B.add(c, aba); }
  const borda = new THREE.MeshBasicMaterial({ color: 0x1a1a1a, side: THREE.BackSide }); borda.userData.cru = true;
  B.children.slice().forEach(m => { m.castShadow = true; m.receiveShadow = true; const o = new THREE.Mesh(m.geometry, borda); o.position.copy(m.position); o.scale.copy(m.scale).multiplyScalar(1.06); B.add(o); });
  return { g, B, acts: {}, mixer: { setTime() {} } }; }
