// =====================================================================
// CENA: "Você construiu um chuveiro" (modelado da referência viral)
// Casa A em corte (frente aberta em z = FR) na origem: banheiro x -6..-1, cozinha x -1..6.
// Caixa d'água sobre o banheiro, sobe numa torre. Casa B (vizinho) em x = XB, com pressurizador.
// =====================================================================
import { THREE, P, eio, eout, back, lerp, lerp3, win, R, scene, mat, mesh, boxAt, carregar, modelo, mundo, arvores,
  pessoa, pose, clima, confete, pose3, iniciar, centroSombra, ARVORES, PLANTAS, CASAS } from './motor/motor.js';
const FIM_FALA = 80.85, DUR = 85.9, FR = 3, LAJE = 3.05, XB = 16, CBMAX = 8.5;
await carregar([...ARVORES, ...PLANTAS, ...CASAS]);

mundo({ plano: 50 });
centroSombra(4, -1);

// ---------- materiais ----------
const paredeM = mat(0xf1ebe0), paredeExtM = mat(0xe9c79a), lajeM = mat(0xcfc8bc), pisoBanM = mat(0xbfe0e8), pisoCozM = mat(0xe8d3a8),
  brancoM = mat(0xffffff, { roughness: .5 }), tuboM = mat(0xb5703a, { roughness: .5 }), metalM = mat(0x9aa3ad, { roughness: .4, metalness: .3 }),
  torreM = mat(0x8a6a4a), registroM = mat(0xd83a2a, { roughness: .5 }), laranjaM = new THREE.MeshStandardMaterial({ color: 0xff8a1a, emissive: 0xff6a00, emissiveIntensity: .6 });
const aguaM = new THREE.MeshStandardMaterial({ color: 0x5ab8ff, emissive: 0x1a7fe0, emissiveIntensity: .45, transparent: true, opacity: .75, roughness: .2, depthWrite: false });
const gotaM = new THREE.MeshStandardMaterial({ color: 0x7fcfff, emissive: 0x2a8fe0, emissiveIntensity: .5, roughness: .2 });
const pontoM = new THREE.MeshBasicMaterial({ color: 0x9fe0ff });

// ---------- primitivas de cano ----------
const vert = (r, x, z, m = tuboM, parent = scene) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 14).translate(0, 0.5, 0), m); o.position.set(x, 0, z); o.castShadow = true; parent.add(o); return o; };
const setV = (o, y0, y1) => { o.position.y = y0; o.scale.y = Math.max(0.001, y1 - y0); };
const horX = (r, y, z, m = tuboM, parent = scene) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 14).rotateZ(Math.PI / 2).translate(0.5, 0, 0), m); o.position.set(0, y, z); o.castShadow = true; parent.add(o); return o; };
const setH = (o, x0, x1) => { o.position.x = x0; o.scale.x = Math.max(0.001, x1 - x0); };
const horZ = (r, x, y, z0, z1, m = tuboM, parent = scene) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 14).rotateX(Math.PI / 2).translate(0, 0, 0.5), m); o.position.set(x, y, z0); o.scale.z = z1 - z0; o.castShadow = true; parent.add(o); return o; };
function seg(a, b, r, m = tuboM, parent = scene) { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b); const L = A.distanceTo(B); const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 12), m);
  o.position.copy(A).add(B).multiplyScalar(.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); o.castShadow = true; parent.add(o); return o; }

// ---------- casa em corte ----------
function casa(X) { const g = new THREE.Group(); g.position.x = X; scene.add(g);
  boxAt(-6.2, 6.2, 0, 0.15, -4.2, FR, lajeM, g); boxAt(-5.9, -1.1, 0.15, 0.17, -3.85, FR, pisoBanM, g, false); boxAt(-0.9, 5.9, 0.15, 0.17, -3.85, FR, pisoCozM, g, false);
  boxAt(-6.2, 6.2, 0.15, 2.8, -4.2, -3.85, paredeM, g); boxAt(-6.2, -5.9, 0.15, 2.8, -3.85, FR, paredeM, g); boxAt(5.9, 6.2, 0.15, 2.8, -3.85, FR, paredeM, g);
  boxAt(-1.1, -0.9, 0.15, 2.8, -3.85, FR, paredeM, g); boxAt(-6.25, 6.25, 0.15, 2.8, -4.25, -4.2, paredeExtM, g); // fundo externo
  boxAt(-6.3, 6.3, 2.8, LAJE, -4.3, FR + 0.05, lajeM, g); boxAt(-6.3, 6.3, LAJE, LAJE + 0.35, -4.3, -4.1, lajeM, g); boxAt(-6.3, -6.1, LAJE, LAJE + 0.35, -4.3, FR + 0.05, lajeM, g); boxAt(6.1, 6.3, LAJE, LAJE + 0.35, -4.3, FR + 0.05, lajeM, g);
  // banheiro: box do chuveiro, vaso, pia
  boxAt(-4.3, -2.5, 0.17, 0.22, -3.85, -2.1, mat(0x9fd0dc), g, false); boxAt(-2.52, -2.48, 0.22, 2.0, -3.85, -2.1, new THREE.MeshStandardMaterial({ color: 0xcfefff, transparent: true, opacity: .22, roughness: .1 }), g, false);
  boxAt(-5.6, -5.0, 0.17, 0.6, -3.85, -3.2, brancoM, g); boxAt(-5.6, -5.0, 0.6, 1.1, -3.85, -3.65, brancoM, g);
  boxAt(-1.9, -1.3, 0.17, 0.85, -3.85, -3.35, brancoM, g);
  // cozinha: pia, armário, geladeira, mesa
  boxAt(2.2, 4.0, 0.17, 0.95, -3.85, -3.0, mat(0x6f8fbf), g); boxAt(2.15, 4.05, 0.95, 1.0, -3.9, -2.95, mat(0xdcdcdc), g); boxAt(2.7, 3.3, 0.85, 0.98, -3.7, -3.2, metalM, g);
  boxAt(4.6, 5.6, 0.17, 2.0, -3.85, -3.0, brancoM, g); boxAt(0.4, 1.6, 0.8, 0.88, -1.6, -0.4, mat(0xb07a4a), g); for (const [x, z] of [[0.5, -1.5], [1.5, -1.5], [0.5, -0.5], [1.5, -0.5]]) boxAt(x - 0.04, x + 0.04, 0.17, 0.8, z - 0.04, z + 0.04, mat(0x8a5a3a), g);
  // canos internos do chuveiro (fixos): desce até o registro, vai ao lado, sobe e o braço do chuveiro
  const v1 = vert(0.06, -2.2, -3.6, tuboM, g); setV(v1, 1.6, LAJE); const h1 = horX(0.06, 1.6, -3.6, tuboM, g); setH(h1, -3.4, -2.2); const v2 = vert(0.06, -3.4, -3.6, tuboM, g); setV(v2, 1.6, 2.2);
  horZ(0.05, -3.4, 2.2, -3.6, -3.0, tuboM, g); mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.08, 18), metalM, -3.4, 2.16, -3.0, g);
  const reg = new THREE.Group(); reg.position.set(-2.2, 1.6, -3.42); g.add(reg); mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), metalM, 0, 0, -0.1, reg); const vol = new THREE.Group(); reg.add(vol); vol.position.z = 0.05;
  mesh(new THREE.TorusGeometry(0.13, 0.03, 8, 18), registroM, 0, 0, 0, vol); mesh(new THREE.BoxGeometry(0.26, 0.04, 0.03), registroM, 0, 0, 0, vol); mesh(new THREE.BoxGeometry(0.04, 0.26, 0.03), registroM, 0, 0, 0, vol);
  // torneira da cozinha (descida fixa)
  const vk = vert(0.05, 3.0, -3.6, tuboM, g); setV(vk, 1.3, 2.68); horZ(0.04, 3.0, 1.3, -3.6, -3.3, tuboM, g);
  return { g, vol, X }; }
const A = casa(0), B = casa(XB);

// vizinhança
for (const [x, z, s] of [[-18, -8, 9], [34, -8, 9], [-30, -10, 9], [46, -10, 9], [-16, -24, 9], [4, -22, 9], [22, -24, 9], [38, -24, 9]]) modelo(CASAS[(Math.abs(x * 5 + z * 3) | 0) % CASAS.length], x, 0, z, 0, s);
const tp = []; for (let i = 0; i < 60; i++) tp.push([(R() > .5 ? 1 : -1) * (10 + R() * 80) + 8, -12 - R() * 60]); tp.push([-9, 1], [8.5, -1], [24, 0], [-9.5, -5], [25, -6]); arvores(tp);
for (let i = 0; i < 10; i++) modelo(PLANTAS[i % 6], (R() > .5 ? -7.5 : 9) + R() * 1.5, 0, -2 + R() * 6, R() * 6, 0.8, 'y');
boxAt(-60, 80, 0, 0.02, 6, 13, mat(0x3a3d43), scene, false); boxAt(-60, 80, 0, 0.12, 3.2, 6, mat(0xd3cfc6), scene, false);

// ---------- caixa d'água (casa A e casa B) ----------
function caixa(parent) { const g = new THREE.Group(); parent.add(g);
  mesh(new THREE.CylinderGeometry(0.95, 0.85, 0.06, 28), mat(0x2f7fd0), 0, 0.03, 0, g);
  const casco = mesh(new THREE.CylinderGeometry(0.95, 0.85, 1.15, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0x4f9fe8, transparent: true, opacity: .38, roughness: .3, side: THREE.DoubleSide, depthWrite: false }), 0, 0.575, 0, g, false);
  const tampa = mesh(new THREE.CylinderGeometry(1.0, 0.98, 0.1, 28), mat(0x2f7fd0), 0, 1.2, 0, g); mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 18), mat(0x2a6fc0), 0, 1.28, 0, g);
  const agua = mesh(new THREE.CylinderGeometry(0.9, 0.86, 1, 28).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ color: 0x3fa9ff, transparent: true, opacity: .85, roughness: .2 }), 0, 0.06, 0, g, false);
  return { g, agua, casco }; }
const CXA = [-3.5, -2.9]; const cxA = caixa(scene); cxA.g.position.set(CXA[0], LAJE, CXA[1]);
const cxB = caixa(B.g); cxB.g.position.set(CXA[0], LAJE, CXA[1]);

// torre (cresce em y)
const torre = new THREE.Group(); torre.position.set(CXA[0], LAJE, CXA[1]); scene.add(torre); const TH = CBMAX - LAJE;
for (const [x, z] of [[-1, -0.85], [1, -0.85], [-1, 0.85], [1, 0.85]]) boxAt(x - 0.08, x + 0.08, 0, TH, z - 0.08, z + 0.08, torreM, torre);
for (let k = 1; k <= 4; k++) { const y = k * TH / 4.4; boxAt(-1, 1, y - 0.05, y + 0.05, -0.9, -0.8, torreM, torre); boxAt(-1, 1, y - 0.05, y + 0.05, 0.8, 0.9, torreM, torre); boxAt(-1.05, -0.95, y - 0.05, y + 0.05, -0.85, 0.85, torreM, torre); boxAt(0.95, 1.05, y - 0.05, y + 0.05, -0.85, 0.85, torreM, torre); }
for (let k = 0; k < 4; k++) { const y0 = k * TH / 4.4, y1 = (k + 1) * TH / 4.4; seg([-1, y0, 0.86], [1, y1, 0.86], 0.04, torreM, torre); seg([-1.02, y0, -0.85], [-1.02, y1, 0.85], 0.04, torreM, torre); }
const plat = boxAt(-1.2, 1.2, TH - 0.12, TH, -1.05, 1.05, mat(0x9a7a55), torre);

// ---------- canos da casa A ----------
const CZ = -3.6, CXc = -2.2; // coluna do chuveiro
const stubA = horX(0.06, 0, CZ); const colFina = vert(0.045, CXc, CZ); const colGrossa = vert(0.1, CXc, CZ, tuboM);
// cano fino cheio de curvas (só no trecho da torre)
const ZZ = [[CXc, CBMAX + 0.12], [CXc, 7.8], [-1.3, 7.8], [-1.3, 6.8], [CXc, 6.8], [CXc, 5.8], [-1.3, 5.8], [-1.3, 4.8], [CXc, 4.8], [CXc, LAJE]];
const curvG = new THREE.Group(); scene.add(curvG); for (let i = 0; i < ZZ.length - 1; i++) seg([ZZ[i][0], ZZ[i][1], CZ], [ZZ[i + 1][0], ZZ[i + 1][1], CZ], 0.045, tuboM, curvG);
const cantos = ZZ.slice(1, -1).map(([x, y], i) => ({ o: mesh(new THREE.SphereGeometry(0.13, 12, 8), laranjaM, x, y, CZ + 0.05, scene, false), i }));
// respiro
const respG = new THREE.Group(); scene.add(respG); respG.position.set(CXc, 0, CZ); const respV = vert(0.035, 0, 0, tuboM, respG); const respH1 = seg([0, 0, 0], [0.35, 0.25, 0], 0.035, tuboM, respG); const respH2 = seg([0.35, 0.25, 0], [0.45, -0.05, 0], 0.035, tuboM, respG);
// ramal antigo da cozinha (sai da coluna) e ramal exclusivo (sai direto da caixa)
const ramVelho = horX(0.05, 2.55, CZ); setH(ramVelho, CXc, 3.0); const RZ = -3.3, RX = -1.6;
const ramStub = horX(0.05, 0, RZ), ramV = vert(0.05, RX, RZ), ramH = horX(0.05, 2.65, RZ), ramJ = horZ(0.05, 3.0, 2.65, CZ, RZ);
// entrada de água da rua (enche a caixa)
const entV = vert(0.05, -6.5, CXA[1]), entH = horX(0.05, 0, CXA[1]), entBico = vert(0.05, -3.8, CXA[1]);
const jorro = vert(0.08, -3.8, CXA[1], aguaM);
// régua de altura
const reguaG = new THREE.Group(); reguaG.position.set(-4.95, 2.2, FR + 0.3); scene.add(reguaG); const reguaM = new THREE.MeshBasicMaterial({ color: 0xffc21a });
const regua = mesh(new THREE.BoxGeometry(0.07, 1, 0.07).translate(0, 0.5, 0), reguaM, 0, 0, 0, reguaG, false); const ticks = Array.from({ length: 8 }, (_, i) => mesh(new THREE.BoxGeometry(0.32, 0.05, 0.05), reguaM, 0, i + 1, 0, reguaG, false));
// pressurizador na casa B
const bomba = new THREE.Group(); bomba.position.set(CXc, 2.0, CZ + 0.18); B.g.add(bomba); const bombaCorpo = new THREE.Group(); bomba.add(bombaCorpo);
mesh(new THREE.BoxGeometry(0.55, 0.42, 0.36), mat(0x2f6fd0), 0, 0, 0, bombaCorpo); mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.32, 16).rotateZ(Math.PI / 2), mat(0x3a7fe0), 0.42, 0, 0, bombaCorpo);
const ledM = new THREE.MeshStandardMaterial({ color: 0x224422, emissive: 0x22ff55, emissiveIntensity: 0 }); mesh(new THREE.SphereGeometry(0.05, 10, 8), ledM, -0.15, 0.08, 0.19, bombaCorpo, false);
const vB = vert(0.06, CXc, CZ, tuboM, B.g); setV(vB, LAJE, LAJE + 0.12); const sB = horX(0.06, LAJE + 0.12, CZ, tuboM, B.g); setH(sB, -3.0, CXc);

// ---------- jatos ----------
function jato(parent, x, y0, z, n = 46) { const cone = mesh(new THREE.CylinderGeometry(0.12, 0.3, 1, 18, 1, true).translate(0, -0.5, 0), aguaM, x, y0, z, parent, false);
  const gotas = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 6, 4), gotaM, n); gotas.frustumCulled = false; parent.add(gotas); const sd = Array.from({ length: n }, () => [R(), R(), R()]);
  return { cone, gotas, sd, x, y0, z, n }; }
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3();
function setJato(j, t, f, yf = 0.2) { const h = j.y0 - yf; j.cone.visible = f > 0.2; j.cone.scale.set(0.4 + 0.9 * f, h, 0.4 + 0.9 * f); j.cone.material.opacity = 0.75;
  for (let i = 0; i < j.n; i++) { const [a, b, c] = j.sd[i]; let on = f > 0.02 && (f > 0.2 || i < 4);
    const vel = f > 0.2 ? 1.4 + f * 1.5 : 0.55; const ph = (t * vel / h * 2 + a) % 1; const yy = f > 0.2 ? j.y0 - ph * h : j.y0 - Math.max(0, (ph - 0.55) / 0.45) ** 2 * h;
    const sp = f > 0.2 ? (0.1 + 0.28 * f) * (yy < j.y0 ? (j.y0 - yy) / h : 0) : 0; V.set(j.x + (b - .5) * 2 * sp, yy, j.z + (c - .5) * 2 * sp);
    M4.compose(on ? V : V.set(0, -50, 0), Q.identity(), S.setScalar(f > 0.2 ? 1 : 1.6)); j.gotas.setMatrixAt(i, M4); } j.gotas.instanceMatrix.needsUpdate = true; }
const jA = jato(scene, -3.4, 2.12, -3.0), jB = jato(B.g, -3.4, 2.12, -3.0), jK = jato(scene, 3.0, 1.26, -3.3, 16), jKb = jato(B.g, 3.0, 1.26, -3.3, 4);
// pontos de água descendo a coluna e bolhas de ar
const pontos = Array.from({ length: 14 }, (_, i) => ({ o: mesh(new THREE.SphereGeometry(0.11, 8, 6), pontoM, 0, -50, 0, scene, false), ph: i / 14 }));
const bolhaM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: .35, transparent: true, opacity: .9 });
const bolhas = Array.from({ length: 7 }, (_, i) => ({ o: mesh(new THREE.SphereGeometry(0.09 + R() * 0.06, 12, 8), bolhaM, 0, -50, 0, scene, false), i }));
// pessoas
const cozinheiro = pessoa('male-c', 1.7); cozinheiro.g.position.set(2.0, 0.17, -2.6); cozinheiro.g.rotation.y = Math.PI * 0.35;
const vizinho = pessoa('female-b', 1.65); vizinho.g.position.set(XB - 1.55, 0.17, -3.05); vizinho.g.rotation.y = -Math.PI / 2;

// ---------- tempo ----------
const CB = t => t < 10.68 ? LAJE : lerp(LAJE, CBMAX, eio(P(t, 10.68, 13.3)));
const NV = t => { if (t < 1.38) return 0; if (t < 36.29) return 0.85 * eout(P(t, 1.5, 2.6)); if (t < 37.4) return lerp(0.85, 0.03, eio(P(t, 36.29, 37.1))); return lerp(0.03, 0.85, eio(P(t, 37.6, 40.0))); };
const FA = t => { if (t < 3.6) return 0; if (t < 8.38) return 0.42 * eout(P(t, 3.6, 3.9));
  if (t < 18.5) return lerp(0.42, 0.06, P(t, 8.38, 8.7)); if (t < 26.6) return lerp(0.06, 1, eio(P(t, 18.6, 20.4)));
  if (t < 32.3) return lerp(1, 0.32, eio(P(t, 26.6, 27.3))); if (t < 36.29) return lerp(0.32, 1, eout(P(t, 32.3, 32.8)));
  if (t < 38.6) return t < 37.0 ? lerp(1, 0, P(t, 36.4, 37.0)) : 0; if (t < 44.8) return t < 40.3 ? 0.06 : (Math.sin(t * 8.5) > 0.2 ? 0.9 : 0.04);
  if (t < 49.4) return 0.06 + 0.84 * (Math.sin(t * 7) > 0.6 ? 1 : 0) * (1 - P(t, 46, 48)); if (t < 55.5) return lerp(0.06, 1, eout(P(t, 49.4, 49.9)));
  if (t < 59.0) return lerp(1, 0.3, eio(P(t, 55.5, 56.1))); return lerp(0.3, 1, eout(P(t, 59.0, 59.5))); };
const FB = t => t < 72.21 ? (t > 62 ? 0.06 : 0) : lerp(0.06, 1, eout(P(t, 72.21, 72.7)));
const FK = t => t < 52.59 ? 0 : eout(P(t, 52.59, 52.9));
// caminho da coluna (para pontos e bolhas): caixa -> laje -> registro -> lado -> sobe -> chuveiro
const caminho = t => [[CXc, CB(t) + 0.12, CZ], [CXc, 1.6, CZ], [-3.4, 1.6, CZ], [-3.4, 2.2, CZ]];
function ao(pts, u) { const L = []; let tot = 0; for (let i = 0; i < pts.length - 1; i++) { const l = Math.hypot(...pts[i + 1].map((v, k) => v - pts[i][k])); L.push(l); tot += l; } let d = u * tot;
  for (let i = 0; i < L.length; i++) { if (d <= L[i] || i === L.length - 1) { const k = Math.min(1, d / L[i]); return lerp3(pts[i], pts[i + 1], k); } d -= L[i]; } }

// ---------- marcações ----------
const XS = [{ s: 9.07, e: 9.75, p: [-3.4, 1.4, -3.0] }, { s: 26.96, e: 28.1, p: [-1.75, 6.3, CZ + 0.3] }, { s: 40.95, e: 43.9, p: [-3.4, 1.95, CZ + 0.2] },
  { s: 55.55, e: 56.6, p: [-3.4, 1.4, -3.0] }, { s: 66.28, e: 67.4, p: [XB - 3.5, 4.8, -2.9] }];
const OKS = [{ s: 20.9, e: 21.4, p: [-3.4, 1.4, -3.0] }, { s: 32.8, e: 33.45, p: [-2.2, 6.0, CZ + 0.3] }, { s: 49.5, e: 50.2, p: [-1.8, CBMAX + 2.2, CZ] },
  { s: 60.92, e: 61.55, p: [-3.4, 1.4, -3.0] }, { s: 72.4, e: 73.1, p: [XB - 3.4, 1.4, -3.0] }];
const BADGES = [{ t: 'POUCA ALTURA', c: 'red', s: 6.49, e: 9.7, p: [-3.5, 4.5, -2.9] }, { t: 'PESO DA ÁGUA', c: 'yellow', s: 17.44, e: 18.2, p: [-3.5, CBMAX + 1.5, -2.9] },
  { t: 'MAIS ALTURA', c: 'yellow', s: 19.3, e: 21.35, p: [-4.95, CBMAX + 1.0, FR + 0.3] }, { t: 'MAIS FORÇA', c: 'green', s: 20.07, e: 21.35, p: [-3.4, 0.9, -3.0] },
  { t: 'AR PRESO', c: 'red', s: 40.89, e: 44.0, p: [-3.4, 4.4, CZ] }, { t: 'NÃO DÁ PRA SUBIR', c: 'red', s: 65.72, e: 67.4, p: [XB - 3.5, 5.0, -2.9] },
  { t: 'LIGA SOZINHA', c: 'green', s: 72.21, e: 74.3, p: [XB - 1.4, 1.0, CZ + 0.3] }];
const LABELS = [['TORRE DA CAIXA', 22.19, 23.3], ['COLUNA', 34.49, 35.1], ['RESPIRO', 51.19, 51.9], ['RAMAL EXCLUSIVO', 62.51, 64.2], ['PRESSURIZADOR', 73.22, 74.35]];

// ---------- câmera ----------
const SEG = [
  { a: 0, b: 4.87, A: pose3([-1.8, 3.25, 9.8], [-3.0, 4.2, -3]), B: pose3([-2.3, 3.25, 7.9], [-3.0, 4.2, -3]) },
  { a: 4.87, b: 9.8, whip: 1, A: pose3([-2.5, 3.25, 7.8], [-3.2, 3.5, -3]), B: pose3([-2.7, 3.25, 7.0], [-3.2, 3.45, -3]) },
  { a: 9.8, b: 18.2, whip: 1, A: pose3([-1.2, 3.25, 14.5], [-3.0, 5.0, -3]), B: pose3([-1.6, 3.25, 13.6], [-3.0, 5.0, -3]) },
  { a: 18.2, b: 23.31, whip: 1, A: pose3([-2.0, 3.25, 14.6], [-3.6, 5.0, -2.5]), B: pose3([-2.4, 3.25, 13.8], [-3.6, 5.0, -2.5]) },
  { a: 23.31, b: 35.12, whip: 1, A: pose3([-0.6, 3.25, 13.8], [-2.6, 5.0, -3.2]), B: pose3([-1.0, 3.25, 13.0], [-2.6, 5.0, -3.2]) },
  { a: 35.12, b: 51.93, whip: 1, A: pose3([-1.0, 3.25, 13.8], [-2.8, 5.1, -3.2]), B: pose3([-1.4, 3.25, 13.0], [-2.8, 5.1, -3.2]) },
  { a: 51.93, b: 64.3, whip: 1, A: pose3([0.4, 3.25, 18.0], [-0.4, 5.6, -2.8]), B: pose3([0.1, 3.25, 17.0], [-0.4, 5.6, -2.8]) },
  { a: 64.3, b: 74.39, whip: 1, A: pose3([XB - 1.6, 3.25, 9.2], [XB - 2.8, 4.1, -3]), B: pose3([XB - 2.0, 3.25, 7.8], [XB - 2.8, 4.1, -3]) },
  { a: 74.39, b: 77.86, whip: 1, A: pose3([0.9, 3.25, 18.6], [-0.4, 5.6, -2.8]), B: pose3([0.4, 3.25, 17.6], [-0.4, 5.6, -2.8]) },
  { a: 77.86, b: DUR + 1, f: t => { const u = eio(P(t, 77.86, 83)); return pose3(lerp3([0.4, 3.25, 17.6], [10, 16, 44], u), lerp3([-0.4, 5.6, -2.8], [7, 4, -2], u)); } },
];

// ---------- estado no tempo t ----------
const sc = (o, v) => o.scale.setScalar(Math.max(0.001, v));
function atualizar(t) {
  clima(t, 0, 0);
  const cb = CB(t), nv = NV(t);
  // caixa A aparece e sobe
  cxA.g.visible = t > 1.3; sc(cxA.g, back(P(t, 1.38, 1.8))); cxA.g.position.y = cb; cxA.agua.scale.y = Math.max(0.001, nv); cxA.agua.visible = nv > 0.01;
  cxB.agua.scale.y = 0.85;
  torre.visible = t > 10.6; torre.scale.y = Math.max(0.001, (cb - LAJE) / TH);
  // canos A: stub e coluna
  setH(stubA, -3.0, CXc); stubA.position.y = cb + 0.12; const pipeOn = t > 3.0; stubA.visible = pipeOn;
  const grossaU = eio(P(t, 30.4, 32.0)); const curvOn = t > 24.25 && t < 32.2;
  colFina.visible = pipeOn && !(t > 24.25); setV(colFina, LAJE, cb + 0.12);
  curvG.visible = curvOn; curvG.scale.setScalar(1); cantos.forEach(c => { c.o.visible = t > 25.4 + c.i * 0.1 && t < 28.3; sc(c.o, back(P(t, 25.4 + c.i * 0.1, 25.7 + c.i * 0.1))); });
  colGrossa.visible = t > 30.4; setV(colGrossa, lerp(cb + 0.12, LAJE, grossaU), cb + 0.12);
  // respiro
  const ru = eio(P(t, 45.9, 47.4)); respG.visible = t > 45.9; respG.position.y = cb + 0.12; respV.scale.y = Math.max(0.001, ru * 1.75); respH1.position.y = respH2.position.y = 0; respH1.visible = respH2.visible = ru > 0.98;
  respH1.position.set(0.175, 1.75 + 0.125, 0); respH2.position.set(0.4, 1.75 + 0.1, 0);
  // ramal da cozinha antigo / exclusivo
  const kOn = t > 51.93; ramVelho.visible = kOn && t < 60.2; ramVelho.scale.y = ramVelho.scale.z = Math.max(0.001, 1 - P(t, 59.6, 60.2)); ramVelho.scale.x = (3.0 - CXc) * back(P(t, 51.93, 52.4));
  const r1 = eio(P(t, 57.47, 57.9)), r2 = eio(P(t, 57.9, 58.4)), r3 = eio(P(t, 58.4, 59.0)); const rOn = t > 57.47;
  ramStub.visible = ramV.visible = ramH.visible = ramJ.visible = rOn; ramStub.position.y = cb + 0.3; setH(ramStub, -3.0, lerp(-3.0, RX, r1)); setV(ramV, lerp(cb + 0.3, 2.65, r2), cb + 0.3); setH(ramH, RX, lerp(RX, 3.0, r3)); ramJ.visible = r3 > 0.98;
  // entrada da rua e enchimento
  setV(entV, 0, cb + 1.45); entH.position.y = cb + 1.45; setH(entH, -6.5, -3.8); setV(entBico, cb + 1.05, cb + 1.45); const entOn = t > 3.0; entV.visible = entH.visible = entBico.visible = entOn;
  const ench = (t > 1.45 && t < 2.6) || (t > 37.5 && t < 40.0); jorro.visible = ench; setV(jorro, cb + 0.06 + nv, cb + 1.05);
  // régua
  const rgU = eout(P(t, 18.53, 19.6)); reguaG.visible = t > 18.45 && t < 21.4; const altR = (cb + 0.06 + 0.85) - 2.2; regua.scale.y = Math.max(0.001, rgU * altR); ticks.forEach((k, i) => { k.visible = (i + 1) < rgU * altR; });
  // jatos
  setJato(jA, t, FA(t)); setJato(jB, t, FB(t)); setJato(jK, t, FK(t), 1.0); setJato(jKb, t, 0, 1.0);
  // registro da casa B gira e bomba liga
  B.vol.rotation.z = -eio(P(t, 71.68, 72.2)) * Math.PI * 1.5; sc(bomba, t < 68.8 ? 0 : back(P(t, 68.8, 69.2))); bomba.visible = t > 68.8;
  const lig = t > 72.21; ledM.emissiveIntensity = lig ? 3 : 0; bombaCorpo.position.set(lig ? Math.sin(t * 90) * 0.012 : 0, lig ? Math.cos(t * 77) * 0.01 : 0, 0);
  // pontos de água empurrados pela coluna
  const pOn = t > 15.9 && t < 18.3; pontos.forEach(p => { if (!pOn) { p.o.position.y = -50; return; } const u = ((t - 15.9) * 0.45 + p.ph) % 1; p.o.position.set(...ao(caminho(t), u)); sc(p.o, win(t, 15.9, 18.3, .2)); });
  // bolhas: entram (38.5), ficam presas no alto (40.3..45.5); depois do respiro saem por cima (48.8..50.2)
  bolhas.forEach(b => { const i = b.i; let p = null, s = 1;
    if (t > 38.5 + i * 0.15 && t < 45.6) { const u = Math.min(1, (t - 38.5 - i * 0.15) / 1.6); p = ao(caminho(t), u); if (u >= 1) { p = [-3.4 + 0.05 * Math.sin(t * 5 + i), 2.2 - 0.12 * (i % 3) + 0.03 * Math.sin(t * 7 + i), CZ + 0.02]; } s = 1 - P(t, 45.0, 45.6); }
    else if (t > 48.6 + i * 0.18 && t < 50.4 + i * 0.18) { const u = P(t, 48.6 + i * 0.18, 49.8 + i * 0.18); p = [CXc + (u > 0.85 ? (u - 0.85) * 2.5 : 0), cb + 0.15 + u * 1.85, CZ]; s = 1 - P(t, 49.8 + i * 0.18, 50.4 + i * 0.18); }
    if (!p) { b.o.position.y = -50; return; } b.o.position.set(...p); sc(b.o, s); });
  // pessoas
  cozinheiro.g.visible = t > 51.5; pose(cozinheiro, t, t > 52.3 && t < 53.2 ? 'interact-right' : 'idle'); pose(vizinho, t, t > 71.5 && t < 72.4 ? 'interact-right' : 'idle');
  confete(t, 77.86, [-1, 6, -1]);
}
iniciar({ dur: DUR, fimFala: FIM_FALA, seg: SEG, rotulos: LABELS, xs: XS, oks: OKS, badges: BADGES, atualizar });
