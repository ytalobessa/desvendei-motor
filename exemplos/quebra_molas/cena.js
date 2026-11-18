// =====================================================================
// CENA: "Você construiu um quebra-molas" (exemplo de referência do motor)
// Rua ao longo de x, quebra-molas em x = 0, escola ao norte (z < 0).
// =====================================================================
import { THREE, P, sm, eio, eout, back, lerp, lerp3, win, rng, R, scene, cam, mat, mesh, boxAt, canvasTex, carregar, modelo, mundo, rua, casas, arvores,
  carro, posCarro, pessoa, pose, clima, confete, pose3, iniciar, luzesNoite, ARVORES, PLANTAS, CASAS, centroSombra } from './motor/motor.js';
const DUR = 106.8, FIM_FALA = 101.75, CURB = 0.30;
await carregar([...ARVORES, ...PLANTAS, ...CASAS, ...['sedan-sports', 'hatchback-sports', 'suv', 'van', 'sedan', 'suv-luxury', 'taxi', 'delivery'].map(n => 'car/' + n),
  ...['female-b', 'male-c', 'female-d', 'male-e'].map(n => 'mini-characters/character-' + n)]);

// ---------- mundo ----------
mundo({ plano: 45 });
rua({ meioFio: CURB, buracoFaixa: [-5, 5] });
casas({ vazio: [-28, 22] });
const treePos = [];
for (let x = -150; x <= 150; x += 11) { if (x > -40 && x < 16) continue; treePos.push([x + R() * 2, -5.9, CURB]); }
for (let x = -150; x <= 150; x += 13) { if (x > -50 && x < 26) continue; treePos.push([x + R() * 2, 5.9, CURB]); }
for (let i = 0; i < 90; i++) { const x = -110 + R() * 220, z = (R() > .5 ? 1 : -1) * (19 + R() * 28); if (Math.abs(x) < 16 && z < 0 && z > -30) continue; if (x > -50 && x < 30 && z > 0 && z < 50) continue; treePos.push([x, z, 0]); }
for (const [x, z] of [[-12, -10.5], [12, -10.5], [-9, -11.5]]) treePos.push([x, z, 0]);
arvores(treePos);
// escola
modelo('city-suburban/building-type-q', 0, 0, -18.5, 0, 17);
const escolaTex = canvasTex(1024, 256, (g, w, h) => { g.fillStyle = '#2f6fa8'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = '900 150px M, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ESCOLA', w / 2, h / 2 + 8); });
mesh(new THREE.PlaneGeometry(6.4, 1.6), new THREE.MeshStandardMaterial({ map: escolaTex, roughness: .6 }), 0, 2.15, -7.05, scene, false); boxAt(-3.3, -3.15, 0, 2.95, -7.25, -7.1, mat(0x2f6fa8)); boxAt(3.15, 3.3, 0, 2.95, -7.25, -7.1, mat(0x2f6fa8));
boxAt(-14, -3.4, 0, 1.3, -7.6, -7.3, mat(0xf1e9da)); boxAt(3.4, 14, 0, 1.3, -7.6, -7.3, mat(0xf1e9da));
for (let i = 0; i < 12; i++) boxAt(-3.3 + i * 0.57, -3.2 + i * 0.57, 0, 1.6, -7.5, -7.4, mat(0x2f6fa8), scene, false);
for (let i = 0; i < 26; i++) { const x = -13 + i + R() * 0.6; if (Math.abs(x) < 3.6) continue; modelo(PLANTAS[i % 6], x, 0, -8.1 - R() * 0.5, R() * 6, 0.7 + R() * 0.5, 'y'); }
// postes
const poleM = mat(0x8b9097), lampM = new THREE.MeshStandardMaterial({ color: 0xfff1c4, emissive: 0xffd77a, emissiveIntensity: 0 }); luzesNoite.push(lampM);
for (const x of [-48, -24, 22, 46]) { boxAt(x - .09, x + .09, CURB, 6.5, 6.2, 6.38, poleM); boxAt(x - .09, x + .09, 6.4, 6.55, 4.6, 6.38, poleM); boxAt(x - .35, x + .35, 6.25, 6.42, 4.4, 5.0, lampM, scene, false); }

// ================== quebra-molas (geometria dinâmica) ==================
const NX = 64;
const bumpGeo = new THREE.BufferGeometry();
const nTop = (NX + 1) * 2, nSide = (NX + 1) * 2 * 2;
const bPos = new Float32Array((nTop + nSide) * 3), bUv = new Float32Array((nTop + nSide) * 2);
const bIdx = [];
for (let i = 0; i < NX; i++) { const a = i * 2, b = a + 1, c = a + 2, d = a + 3; bIdx.push(a, b, c, b, d, c); }
for (let s = 0; s < 2; s++) { const o = nTop + s * (NX + 1) * 2; for (let i = 0; i < NX; i++) { const a = o + i * 2, b = a + 1, c = a + 2, d = a + 3; if (s === 0) bIdx.push(a, c, b, b, c, d); else bIdx.push(a, b, c, b, d, c); } }
bumpGeo.setIndex(bIdx); bumpGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3)); bumpGeo.setAttribute('uv', new THREE.BufferAttribute(bUv, 2));
const bumpCanvas = document.createElement('canvas'); bumpCanvas.width = 512; bumpCanvas.height = 512; const bctx = bumpCanvas.getContext('2d');
const bumpTex = new THREE.CanvasTexture(bumpCanvas); bumpTex.colorSpace = THREE.SRGBColorSpace; bumpTex.anisotropy = 4;
const bumpM = new THREE.MeshStandardMaterial({ map: bumpTex, roughness: .9, flatShading: false, emissive: 0x000000, side: THREE.DoubleSide });
const bump = new THREE.Mesh(bumpGeo, bumpM); bump.castShadow = true; bump.receiveShadow = true; scene.add(bump);
let bumpKey = '';
function bumpProfile(st, x) { const half = st.L / 2; if (Math.abs(x) >= half || st.H <= 0) return 0; const P = Math.min(st.P, st.L - 0.01); const Rr = (st.L - P) / 2;
  if (Math.abs(x) <= P / 2) return st.H; const u = (half - Math.abs(x)) / Rr; return st.H * (0.5 - 0.5 * Math.cos(Math.PI * u)); }
function drawBumpTex(st) { const key = [st.stripes.toFixed(2), st.zebra.toFixed(2), (st.P > 0.1 ? 1 : 0)].join('|'); if (key === bumpKey) return; bumpKey = key;
  const g = bctx, w = 512, h = 512; g.fillStyle = '#4a4d53'; g.fillRect(0, 0, w, h);
  // grão
  const rr = rng(7); for (let i = 0; i < 900; i++) { g.fillStyle = rr() > .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.08)'; g.fillRect(rr() * w, rr() * h, 3, 3); }
  // faixas amarelas inclinadas (u = largura da rua, v = comprimento do quebra-molas)
  const N = 9, k = st.stripes * N;
  g.save(); g.beginPath(); g.rect(0, 0, w, h); g.clip();
  for (let i = 0; i < N; i++) { const a = Math.min(1, Math.max(0, k - i)); if (a <= 0) continue; g.globalAlpha = a; g.fillStyle = '#ffc21a';
    const x0 = (i / N) * w * 1.25 - w * 0.15; g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + w * 0.07, 0); g.lineTo(x0 + w * 0.07 + w * 0.22, h); g.lineTo(x0 + w * 0.22, h); g.closePath(); g.fill(); }
  g.restore(); g.globalAlpha = 1;
  if (st.zebra > 0) { // plataforma: faixa de pedestres
    const pv = st.Pfrac; const y0 = (0.5 - pv / 2) * h, y1 = (0.5 + pv / 2) * h; g.fillStyle = '#4a4d53'; g.fillRect(0, y0, w, y1 - y0);
    const M = 9; for (let i = 0; i < M; i++) { const a = Math.min(1, Math.max(0, st.zebra * M - i)); if (a <= 0) continue; g.globalAlpha = a; g.fillStyle = '#f7f7f2'; const x = (i + 0.25) / M * w; g.fillRect(x, y0 + 8, w / M * 0.5, (y1 - y0) - 16); }
    g.globalAlpha = 1; }
  bumpTex.needsUpdate = true; }
function updateBump(st) { const half = Math.max(st.L / 2, 0.01); const z0 = st.z0, z1 = Math.max(st.z1, st.z0 + 0.001);
  for (let i = 0; i <= NX; i++) { const x = -half + (i / NX) * 2 * half; const y = bumpProfile(st, x) + 0.004;
    for (let j = 0; j < 2; j++) { const k = (i * 2 + j); const z = j ? z1 : z0; bPos[k * 3] = x; bPos[k * 3 + 1] = y; bPos[k * 3 + 2] = z; bUv[k * 2] = (z + 3.5) / 7; bUv[k * 2 + 1] = i / NX; }
    for (let s = 0; s < 2; s++) { const z = s ? z1 : z0; const o = nTop + s * (NX + 1) * 2; const k1 = o + i * 2, k2 = k1 + 1;
      bPos[k1 * 3] = x; bPos[k1 * 3 + 1] = y; bPos[k1 * 3 + 2] = z; bPos[k2 * 3] = x; bPos[k2 * 3 + 1] = 0; bPos[k2 * 3 + 2] = z; bUv[k1 * 2] = 0.02; bUv[k1 * 2 + 1] = 0.5; bUv[k2 * 2] = 0.02; bUv[k2 * 2 + 1] = 0.5; } }
  bumpGeo.attributes.position.needsUpdate = true; bumpGeo.attributes.uv.needsUpdate = true; bumpGeo.computeVertexNormals(); bumpGeo.computeBoundingSphere();
  bump.visible = st.z1 > st.z0 + 0.02 && st.H > 0.001; drawBumpTex(st); }
// estado do quebra-molas por tempo
function bumpState(t) {
  const st = { L: 1.2, H: 0.34, P: 0, z0: -3.5, z1: -3.5, stripes: 0, zebra: 0, Pfrac: 0 };
  st.z1 = lerp(-3.5, 3.5, eio(P(t, 12.6, 16.3)));
  // estica: tipo A
  const u = eio(P(t, 26.6, 30.5)); st.L = lerp(1.2, 3.7, u); st.H = lerp(0.34, 0.17, eio(P(t, 28.6, 30.6)));
  // pintura
  st.stripes = P(t, 49.2, 51.6);
  // sarjeta livre
  const gp = eio(P(t, 72.3, 72.9)); st.z0 = lerp(-3.5, -2.95, gp); st.z1 = Math.min(st.z1, lerp(3.5, 2.95, gp));
  // lombofaixa
  const lf = eio(P(t, 85.4, 88.8)); if (lf > 0) { st.H = lerp(st.H, CURB, lf); st.P = lerp(0, 4.2, lf); st.L = lerp(3.7, 6.8, lf); st.z0 = lerp(st.z0, -3.5, lf); st.z1 = lerp(st.z1, 3.5, lf); st.stripes = lerp(1, 0.0, P(t, 85.4, 86.4)) > 0 ? st.stripes : 0; }
  if (lf > 0) { st.stripes = Math.max(0, 1 - P(t, 85.6, 86.6)); st.Pfrac = st.P / st.L; st.zebra = P(t, 91.9, 93.0); }
  return st; }
let BS = bumpState(0);
const bumpH = (x, z = -1.75) => (z < BS.z0 || z > BS.z1 || BS.z1 - BS.z0 < 0.05) ? 0 : bumpProfile(BS, x);

// fantasma do quebra-molas antigo (comparação)
const ghostM = new THREE.MeshStandardMaterial({ color: 0xff5a52, transparent: true, opacity: 0, emissive: 0xff2a20, emissiveIntensity: .5, depthWrite: false });
const ghostShape = new THREE.Shape(); ghostShape.moveTo(-0.6, 0); for (let i = 0; i <= 24; i++) { const x = -0.6 + i / 24 * 1.2; ghostShape.lineTo(x, 0.34 * (0.5 - 0.5 * Math.cos(Math.PI * (0.6 - Math.abs(x)) / 0.6))); } ghostShape.lineTo(0.6, 0);
const ghostGeo = new THREE.ExtrudeGeometry(ghostShape, { depth: 7, bevelEnabled: false }); ghostGeo.translate(0, 0.006, -3.5);
const ghost = mesh(ghostGeo, ghostM, 0, 0, 0, scene, false);



// ---------- carros: x(t), faixa z, quando aparece ----------
const cars = [
  { c: carro('sedan-sports'), z: -1.75, t0: 5.6, t1: 9.2, x: t => -35 + 17 * (t - 5.6), amp: 0 },
  { c: carro('hatchback-sports'), z: -1.75, t0: 9.3, t1: 11.5, x: t => -25 + 18 * (t - 9.3), amp: 0 },
  { c: carro('suv'), z: -1.75, t0: 16.0, t1: 19.6, x: t => -40 + 18 * (t - 16.0), amp: 0.55 },
  { c: carro('van'), z: -1.75, t0: 21.6, t1: 25.9, x: t => -8 + 3.2 * (t - 22.2), amp: 0.02 },
  { c: carro('sedan'), z: -1.75, t0: 35.4, t1: 40.2, x: t => -20 + 8.3 * (t - 35.7), amp: 0.03 },
  { c: carro('suv-luxury'), z: -1.75, t0: 38.4, t1: 41.6, x: t => -40 + 19.4 * (t - 38.0), amp: 0.45 },
  { c: carro('taxi'), z: -1.75, t0: 42.6, t1: 48.6, x: t => -55 + 11.5 * (t - 42.8), amp: 0.3 },
  { c: carro('delivery'), z: -1.75, t0: 54.0, t1: 57.9, x: t => { const tb = 55.7; if (t < tb) return -10 + 14 * (t - tb); const tau = Math.min(t - tb, 14 / 9); return -10 + 14 * tau - 4.5 * tau * tau; }, amp: 0.25, brake: [55.7, 57.26] },
  { c: carro('hatchback-sports'), z: -1.75, t0: 94.0, t1: 107, x: t => { if (t < 94.4) return -15.6 - 10 * (94.4 - t); const tau = Math.min(t - 94.4, 2); return -15.6 + 10 * tau - 2.5 * tau * tau; }, amp: 0 },
  { c: carro('van'), z: 1.75, dir: -1, t0: 99.5, t1: 107, x: t => 40 - 6 * (t - 99.5), amp: 0.02 },
];
const NIGHT = t => win(t, 42.84, 54.25, 0.45);
const carX = i => t => cars[i].x(t);
function updateCars(t) { for (const cd of cars) { const vis = t >= cd.t0 && t <= cd.t1; let pe = 0; if (cd.brake && t > cd.brake[0] && t < cd.brake[1] + 0.4) pe = -0.05 * Math.sin(Math.PI * P(t, cd.brake[0], cd.brake[1] + 0.4));
  posCarro(cd.c, { visivel: vis, x: vis ? cd.x(t) : 0, z: cd.z, dir: cd.dir || 1, chao: bumpH, amp: cd.amp, pitchExtra: pe, noite: NIGHT(t) }); } }

// ---------- pessoas ----------
const kidP = pessoa('female-b', 1.3); const kid = kidP.g;
function kidWalking(t) { return (t > 79.7 && t < 82.6) || (t > 96.9 && t < 99.4) || (t > 7.55 && t < 8.35) || (t > 10.25 && t < 11.1); }
function kidAt(t) { // [x,y,z,rotY,visível]
  if (t < 11.6) { const o1 = sm(P(t, 7.55, 7.85)) * (1 - sm(P(t, 7.95, 8.35))), o2 = sm(P(t, 10.25, 10.55)) * (1 - sm(P(t, 10.75, 11.1)));
    const z = -4.4 + 0.9 * Math.max(o1, o2); const y = z > -3.5 ? lerp(CURB, 0, P(z, -3.6, -3.4)) : CURB; return [4, y, z, 0, true]; }
  if (t > 78.2 && t < 83.4) { const z = lerp(-4.4, 4.4, P(t, 79.7, 82.6)); let y = CURB; if (z > -3.6 && z < 3.6) y = 0; if (z >= -3.75 && z <= -3.45) y = lerp(CURB, 0, P(z, -3.75, -3.45)); if (z >= 3.45 && z <= 3.75) y = lerp(0, CURB, P(z, 3.45, 3.75)); return [3, y, z, 0, true]; }
  if (t > 94.6) { const z = lerp(-4.6, 4.6, P(t, 96.9, 99.4)); const y = Math.abs(z) < 3.5 ? bumpH(0, z) : CURB; return [0.2, y, z, 0, true]; }
  return [0, 0, 0, 0, false]; }
const ADULTS = [['male-c', -4.6, -6.0, 0.3], ['female-d', 5.2, -6.1, -0.3], ['male-e', 8.5, -5.9, 0.4], ['female-d', -9, -5.6, 1.2]].map(([n, x, z, r]) => { const o = pessoa(n, 1.75); o.g.position.set(x, CURB, z); o.g.rotation.y = r; return o; });

// ================== placas ==================
function signPole(x, z, h = 2.5) { boxAt(x - 0.05, x + 0.05, CURB, CURB + h, z - 0.05, z + 0.05, poleM); }
const devagarTex = canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.strokeStyle = '#111'; g.lineWidth = 14; g.strokeRect(10, 10, w - 20, h - 20); g.fillStyle = '#111'; g.font = '900 100px M, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('DEVAGAR', w / 2, h / 2 + 6); });
const a18Tex = canvasTex(512, 512, (g, w, h) => { g.translate(w / 2, h / 2); g.rotate(Math.PI / 4); g.fillStyle = '#111'; g.fillRect(-176, -176, 352, 352); g.fillStyle = '#ffc21a'; g.fillRect(-160, -160, 320, 320); g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = '#111'; g.beginPath(); g.moveTo(110, 300); g.quadraticCurveTo(256, 170, 402, 300); g.lineTo(402, 318); g.lineTo(110, 318); g.closePath(); g.fill(); });
const r19Tex = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#d8342c'; g.beginPath(); g.arc(256, 256, 250, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(256, 256, 190, 0, 7); g.fill(); g.fillStyle = '#111'; g.font = '900 200px M, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('30', 256, 266); });
const signMat = tex => new THREE.MeshStandardMaterial({ map: tex, roughness: .5, transparent: true, emissive: 0x000000 });
const signBackM = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, transparent: true, alphaTest: 0.5 });
function makeSign(x, z, tex, w, h) { const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g); const pole = boxAt(-0.05, 0.05, CURB, CURB + 2.3, -0.05, 0.05, poleM, g);
  const m = signMat(tex); const p = mesh(new THREE.PlaneGeometry(w, h), m, -0.06, CURB + 2.3 + h / 2 - 0.1, 0, g); p.rotation.y = -1.0;
  const bm = signBackM.clone(); bm.map = tex; bm.color.setHex(0x8a9096); const bk = mesh(new THREE.PlaneGeometry(w, h), bm, -0.04, CURB + 2.3 + h / 2 - 0.1, 0.01, g); bk.rotation.y = -1.0 + Math.PI; bk.scale.x = -1; bm.emissive = new THREE.Color(0); bm.map = null; bm.alphaMap = null; return { g, m }; }
const sDev = makeSign(-12, -4.4, devagarTex, 1.4, 0.7), sA18 = makeSign(-24, -4.4, a18Tex, 1.2, 1.2), sR19 = makeSign(-20, -4.4, r19Tex, 1.0, 1.0);
function popScale(t, a) { return t < a ? 0 : back(P(t, a, a + 0.35)); }

// ================== linhas de medida ==================
const dimM = new THREE.MeshBasicMaterial({ color: 0xffc21a, transparent: true, opacity: 0, depthTest: false });
const dimH = boxAt(-1.85, 1.85, 0.0, 0.04, 3.35, 3.45, dimM, scene, false); dimH.renderOrder = 5;
const dimV = boxAt(-0.02, 0.02, 0, 1, 3.35, 3.45, dimM, scene, false); dimV.renderOrder = 5;
const tickA = boxAt(-1.87, -1.83, 0, 0.3, 3.35, 3.45, dimM, scene, false), tickB = boxAt(1.83, 1.87, 0, 0.3, 3.35, 3.45, dimM, scene, false);


// ================== água ==================
const waterM = new THREE.MeshStandardMaterial({ color: 0x2a8fd8, transparent: true, opacity: 0.85, roughness: .1, metalness: .1, emissive: 0x0a3050, emissiveIntensity: .4 });
const water = boxAt(-1, 0, 0, 0.035, -3.5, -3.05, waterM, scene, false); // geometria unitária em x, ajustada por scale
water.geometry.translate(0.5, 0, 0); water.position.set(0, 0, 0);
const water2 = new THREE.Mesh(water.geometry.clone(), waterM); scene.add(water2);
const puddle = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.04, 28), waterM); scene.add(puddle);
const specks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.02, 0.05), new THREE.MeshBasicMaterial({ color: 0xd8f0ff }), 80); scene.add(specks);
const RAIN = t => win(t, 65.5, 78.3, 0.5);

// ================== faíscas, fumaça, confete ==================
const sparkM = new THREE.MeshBasicMaterial({ color: 0xffb030 }); const sparks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), sparkM, 40); scene.add(sparks); sparks.frustumCulled = false;
const smokeM = new THREE.MeshStandardMaterial({ color: 0xbfc4c8, transparent: true, opacity: 0.6, depthWrite: false, flatShading: true }); const smoke = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.35, 0), smokeM, 30); scene.add(smoke); smoke.frustumCulled = false;
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), E = new THREE.Euler();


// ================== destaques (amarelo / vermelho) ==================
const HL = [[18.9, 20.65], [40.74, 42.85], [52.16, 54.2], [87.7, 89.4], [93.29, 94.7]];
const RED = [[21.5, 25.7]];
function tint(t) { let y = 0; for (const [a, b] of HL) y = Math.max(y, win(t, a, b, .25) * (0.32 + 0.16 * Math.sin((t - a) * 9))); let r = 0; for (const [a, b] of RED) r = Math.max(r, win(t, a, b, .3)); return [y, r]; }



// ---------- câmera ----------
const DUR_ = DUR;
const SEG = [
  { a: 0, b: 5.6, A: pose3([-30, 22, 30], [-4, 0, -6]), B: pose3([-18.5, 3.0, 2.6], [-12, 2.6, -4.4]) },
  { a: 5.6, b: 7.25, whip: 1, f: t => { const x = carX(0)(t); return pose3([x - 9, 2.3, 3.6], [x + 3, 1.0, -2.6]); } },
  { a: 7.25, b: 11.45, whip: 1, A: pose3([11, 2.0, 4.6], [3.5, 0.9, -3.4]), B: pose3([10, 1.8, 3.8], [3.5, 0.9, -3.6]) },
  { a: 11.45, b: 16.75, whip: 1, A: pose3([8.5, 6.2, 11], [0, 0, -0.5]), B: pose3([6.5, 4.4, 8.6], [0, 0, -0.5]) },
  { a: 16.75, b: 18.85, whip: 1, A: pose3([7.5, 1.9, 6.4], [0, 0.6, -1.75]), B: pose3([6.5, 1.8, 6.0], [1, 0.6, -1.75]) },
  { a: 18.85, b: 20.65, whip: 1, A: pose3([5, 4.6, 6.8], [0, 0.1, -1.2], 44), B: pose3([3.5, 4.8, 7], [0, 0.1, -1.2], 44) },
  { a: 20.65, b: 25.7, whip: 1, A: pose3([-4.6, 1.6, 3.4], [0.4, 0.25, -1.75], 42), B: pose3([-3.6, 1.4, 3.0], [0.4, 0.25, -1.75], 42) },
  { a: 25.7, b: 31.85, whip: 1, A: pose3([-1.2, 2.4, 6.0], [0.2, 0.1, -0.2], 44), B: pose3([-0.6, 2.2, 6.4], [0.2, 0.1, 0.2], 44) },
  { a: 31.85, b: 36.1, whip: 1, A: pose3([6, 2.6, 7], [0, 0.1, -1]), B: pose3([4.5, 2.2, 6.4], [0, 0.1, -1]) },
  { a: 36.1, b: 40.7, whip: 1, A: pose3([-2.2, 1.9, 7.4], [0.5, 0.5, -1.75], 44), B: pose3([1.0, 1.9, 7.4], [0.5, 0.5, -1.75], 44) },
  { a: 40.7, b: 42.84, whip: 1, A: pose3([5, 4.6, 6.8], [0, 0.1, -1.2], 44), B: pose3([3.5, 4.8, 7], [0, 0.1, -1.2], 44) },
  { a: 42.84, b: 48.0, whip: 1, f: t => { const x = carX(6)(t); const sh = (t > 47.45 && t < 47.95) ? 0.08 * Math.sin((t - 47.45) * 60) * (1 - P(t, 47.45, 47.95)) : 0; return pose3([x - 7, 2.1 + sh, 1.2], [x + 6, 0.5 + sh, -1.75]); } },
  { a: 48.0, b: 54.2, whip: 1, A: pose3([5, 4.5, 6.5], [0, 0, -0.8]), B: pose3([3.5, 4.0, 6.0], [0, 0, -0.8]) },
  { a: 54.2, b: 57.75, whip: 1, f: t => { const x = carX(7)(t); return pose3([x - 7.5, 2.0, 1.6], [x + 5, 0.6, -1.75]); } },
  { a: 57.75, b: 62.95, whip: 1, A: pose3([-31, 2.6, 3.4], [-22, 1.8, -4.4]), B: pose3([-30, 2.4, 2.6], [-22, 2.0, -4.4]) },
  { a: 62.95, b: 65.5, A: pose3([-27.6, 2.6, 3.4], [-23.4, 2.5, -4.4]), B: pose3([-27.0, 2.6, 3.0], [-23.4, 2.6, -4.4]) },
  { a: 65.5, b: 71.0, whip: 1, A: pose3([-7.5, 1.6, 0.6], [-2.2, 0.1, -3.3]), B: pose3([-6.5, 1.4, 0.2], [-2.2, 0.1, -3.3]) },
  { a: 71.0, b: 78.25, A: pose3([-4.5, 2.4, 1.2], [0.2, 0.1, -3.2]), B: pose3([-3.0, 2.8, 1.4], [0.8, 0.1, -3.2]) },
  { a: 78.25, b: 83.2, whip: 1, f: t => { const k = kidAt(t); return pose3([k[0] + 5.5, 2.0, k[2] + 3.2], [k[0] - 0.6, 0.8, k[2] - 0.4], 42); } },
  { a: 83.2, b: 90.0, whip: 1, A: pose3([7, 1.4, 5.6], [0, 0.25, -2.6], 44), B: pose3([5.2, 1.2, 4.8], [0, 0.25, -2.6], 44) },
  { a: 90.0, b: 93.25, A: pose3([6, 3.2, 6.0], [0, 0.2, -1.2], 44), B: pose3([5.0, 3.4, 6.0], [0, 0.2, -1.2], 44) },
  { a: 93.25, b: 94.7, whip: 1, A: pose3([5, 3, 6], [0, 0.2, -0.5]), B: pose3([4, 3.2, 6.4], [0, 0.2, -0.5]) },
  { a: 94.7, b: 98.9, whip: 1, f: t => { const k = kidAt(Math.max(t, 96.0)); const u = eio(P(t, 94.7, 96.6)); const a = pose3([4, 2.6, 7], [-4, 0.8, -1.5], 44); const b = pose3([k[0] + 5.5, 2.4, k[2] + 4.6], [k[0] - 1.8, 0.8, k[2] - 0.2], 44); return pose3(lerp3(a.p, b.p, u), lerp3(a.t, b.t, u), 44); } },
  { a: 98.9, b: DUR + 1, f: t => { const u = eio(P(t, 98.9, 103.2)); const k = kidAt(98.9); const a = pose3([k[0] + 5.5, 2.4, k[2] + 4.6], [k[0] - 1.8, 0.8, k[2] - 0.2]), b = pose3([-16, 30, 36], [0, 0, -5]);
      const p = lerp3(a.p, b.p, u), tg = lerp3(a.t, b.t, u); const o = Math.max(0, t - 103.2) * 0.6; return pose3([p[0] + o, p[1], p[2]], tg); } },
];


// ---------- marcações na tela ----------
const XS = [ { s: 6.45, e: 7.5, p: [-12, 3.9, -4.4] }, { s: 10.75, e: 11.45, p: [4, 2.2, -4.0] }, { s: 24.6, e: 25.65, p: [0, 0.9, -1.75] }, { s: 21.8, e: 23.4, p: [0, 0.75, -1.0] },
  { s: 47.6, e: 48.0, p: [0, 1.0, -1.75] }, { s: 56.75, e: 57.7, p: [1.5, 1.6, -1.75] }, { s: 70.3, e: 71.0, p: [-2.8, 0.3, -3.0] }, { s: 82.2, e: 83.15, p: [3, 1.8, 3.9] } ];
const OKS = [ { s: 38.1, e: 39.2, p: [2, 1.9, -1.75] }, { s: 74.4, e: 75.7, p: [1.8, 0.4, -3.25] }, { s: 98.3, e: 98.95, p: [0.2, 2.2, 1.5] } ];
const BADGES = [ { t: '3,70 m', c: 'yellow', s: 28.4, e: 31.8, p: [0, 0.75, 2.4] }, { t: '10 cm', c: 'yellow', s: 30.2, e: 31.8, p: [0, 0.2, 2.4] },
  { t: '30 km/h', c: 'green', s: 36.3, e: 38.9, p: t => [cars[4].x(t), 2.3, -1.75] }, { t: '70 km/h', c: 'red', s: 39.0, e: 40.65, p: t => [cars[5].x(t), 2.3, -1.75] } ];
const LABELS = [['QUEBRA-MOLAS', 18.9, 21.2], ['ONDULAÇÃO TIPO A', 40.74, 43.2], ['PINTURA DE ADVERTÊNCIA', 52.16, 54.6], ['PLACA DE LOMBADA', 63.04, 65.6], ['DRENAGEM SUPERFICIAL', 75.71, 78.3], ['LOMBOFAIXA', 93.29, 95.3]];

// ---------- estado no tempo t (função pura) ----------
function atualizar(t) {
  BS = bumpState(t); updateBump(BS);
  const [ty, tr] = tint(t); bumpM.emissive.setRGB(ty * 0.9 + tr * 0.55, ty * 0.62, tr * 0.05);
  ghostM.opacity = 0.45 * win(t, 32.9, 35.9, .3);
  clima(t, NIGHT(t), RAIN(t));
  updateCars(t);
  const [kx, ky, kz, kr, kv] = kidAt(t); kid.visible = kv; kid.position.set(kx, ky, kz); kid.rotation.y = kr; pose(kidP, t, kidWalking(t) ? 'walk' : 'idle'); ADULTS.forEach((o, i) => pose(o, t + i * 0.7));
  sDev.g.scale.setScalar(popScale(t, 1.55)); sA18.g.scale.setScalar(popScale(t, 60.4)); sR19.g.scale.setScalar(popScale(t, 62.1));
  const sy = win(t, 63.04, 65.45, .25) * (0.55 + 0.25 * Math.sin((t - 63) * 9)); sA18.m.emissive.setRGB(sy * .8, sy * .6, 0); sR19.m.emissive.setRGB(sy * .8, sy * .6, 0);
  const dm = win(t, 28.3, 31.85, .25); dimM.opacity = dm; dimH.visible = tickA.visible = tickB.visible = dm > 0.01; const hl2 = BS.L / 2; dimH.scale.x = BS.L / 3.7; dimH.position.set(0, BS.H + 0.12, 2.4); tickA.position.set(-hl2, BS.H / 2 + 0.06, 2.4); tickB.position.set(hl2, BS.H / 2 + 0.06, 2.4); tickA.scale.y = tickB.scale.y = (BS.H + 0.14) / 0.3;
  const dv = win(t, 30.1, 31.85, .25); dimV.visible = dv > 0.01; dimV.scale.y = BS.H + 0.0001; dimV.position.set(0, BS.H / 2, 2.4);
  const bumpStart = -BS.L / 2; const wFront = lerp(-60, bumpStart, eio(P(t, 66.7, 68.95))); const wOn = t > 66.7 && t < 79;
  water.visible = wOn; water.position.set(-60, 0.018, -3.275); water.scale.set(Math.max(0.01, wFront + 60), 1, 1);
  const gap = P(t, 72.4, 72.9); const w2 = lerp(bumpStart, 40, eio(P(t, 72.5, 74.6)));
  water2.visible = wOn && gap > 0; water2.scale.set(Math.max(0.01, w2 - bumpStart), 1, 1); water2.position.set(bumpStart, 0.018, -3.275);
  const pz = sm(P(t, 68.9, 70.4)) * (1 - sm(P(t, 72.6, 74.2))) * (1 - P(t, 78, 79)); puddle.visible = wOn && pz > 0.01; puddle.scale.set(1.15 * pz + 0.01, 1, 0.7 * pz + 0.01); puddle.position.set(bumpStart - 1.0, 0.02, -3.5 + 0.55 * pz);
  specks.visible = wOn; if (wOn) { for (let i = 0; i < 80; i++) { const ph = (t * 0.07 + i / 80) % 1; let x = lerp(-40, 30, ph); if (x > wFront || (x > bumpStart && gap < 0.5) || (x > w2 && x > bumpStart)) x = -999;
      V.set(x, 0.045, -3.42 + (i % 3) * 0.12); M4.compose(V, Q.identity(), S.set(1, 1, 1)); specks.setMatrixAt(i, M4); } specks.instanceMatrix.needsUpdate = true; }
  const sc = win(t, 24.3, 25.3, .1); sparks.visible = sc > 0.01; if (sparks.visible) { for (let i = 0; i < 40; i++) { const ph = (t * 3 + i / 40) % 1; V.set(cars[3].x(t) - 0.2 - ph * 1.2, 0.25 + Math.sin(ph * 3) * 0.4 * ((i % 5) / 5), -1.75 + ((i * 37) % 11 - 5) * 0.12); M4.compose(V, Q.identity(), S.setScalar(1 - ph)); sparks.setMatrixAt(i, M4); } sparks.instanceMatrix.needsUpdate = true; }
  const sk = t > 55.7 && t < 58.4; smoke.visible = sk; if (sk) { for (let i = 0; i < 30; i++) { const born = 55.7 + i * 0.055; const age = t - born; if (age < 0 || born > 57.3) { V.set(0, -50, 0); M4.compose(V, Q, S.setScalar(0.01)); smoke.setMatrixAt(i, M4); continue; }
      const x0 = cars[7].x(born) - 1.35; V.set(x0 - age * 0.6, 0.25 + age * 0.5, -1.75 + ((i % 2) ? 0.86 : -0.86)); M4.compose(V, Q.identity(), S.setScalar(0.5 + age * 1.2)); smoke.setMatrixAt(i, M4); } smoke.instanceMatrix.needsUpdate = true; smokeM.opacity = 0.55 * (1 - P(t, 57.6, 58.4)); }
  confete(t, 98.9, [-1, 0.7, 0.4]);
}
iniciar({ dur: DUR, fimFala: FIM_FALA, seg: SEG, rotulos: LABELS, xs: XS, oks: OKS, badges: BADGES, atualizar });
