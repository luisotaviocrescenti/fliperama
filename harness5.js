const fs = require('fs'), vm = require('vm');
const code = fs.readFileSync('abismo.html', 'utf8').split('<script>')[1].split('</script>')[0];
function makeEnv() {
  const listeners = {};
  const on = key => (type, fn) => { (listeners[key + ':' + type] ||= []).push(fn); };
  const grad = { addColorStop() {} }; const ctxObj = new Proxy({ createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), createLinearGradient: () => grad, createRadialGradient: () => grad }, { get: (t, k) => k in t ? t[k] : () => {}, set: (t, k, v) => { t[k] = v; return true; } });
  const els = {};
  const el = id => ({ id, style: {}, classList: { toggle() {}, add() {}, remove() {} }, getContext: () => ctxObj, width: 300, height: 150, clientWidth: 1000,
    hidden: false, textContent: '', innerHTML: '', dataset: {}, querySelectorAll: () => [], querySelector: () => null, contains: () => false,
    addEventListener: on(id), focus() {}, blur() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 562 }), requestPointerLock() {} });
  const T = { now: 0 };
  const G = {
    document: { getElementById: id => (els[id] ||= el(id)), createElement: () => el('canvas'), querySelectorAll: () => [], addEventListener: on('doc'), activeElement: null, hidden: false, pointerLockElement: null },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    localStorage: (() => { const ls = {}; return { getItem: k => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); } }; })(),
    performance: { now: () => T.now }, requestAnimationFrame: cb => { T.raf = cb; }, ResizeObserver: class { observe() {} },
    addEventListener: on('win'), devicePixelRatio: 1, Math, JSON, Object, Array, Set, Float32Array, Uint32Array, Uint8Array, Int16Array, Uint8ClampedArray, String, Number, Infinity, console,
    claude: { hot: { snapshot: fn => { T.snap = fn; } } }
  };
  G.window = G;
  vm.createContext(G); vm.runInContext(code, G);
  const fire = (k, e) => (listeners[k] || []).forEach(fn => fn(e));
  return {
    G, els, snap: () => T.snap(),
    click: dataset => fire('overlay:click', { target: { closest: () => ({ dataset }) } }),
    key: (code, up) => fire(up ? 'win:keyup' : 'win:keydown', { code, repeat: false, target: { closest: () => null }, preventDefault() {} }),
    run: ms => { for (let t = 0; t < ms; t += 16) { T.now += 16; T.raf(T.now); } }
  };
}
const A = makeEnv();
let s = A.snap();
const lv = s.st.lv;
// 1) coisas no chão
const bad = lv.things.filter(([c, x, y]) => lv.m[Math.floor(y)][Math.floor(x)] !== '.');
console.log('coisas fora do chão:', bad.length ? JSON.stringify(bad) : 'nenhuma');
console.log(lv.m.map(r => r.join('')).join('\n'));
// 2) dá para terminar? BFS liberando portas conforme os cartões
const reach = (sx, sy, red, blue) => {
  const seen = new Set([sy * lv.W + sx]), q = [[sx, sy]];
  while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x + dx, ny = y + dy, c = lv.m[ny][nx], k = ny * lv.W + nx;
    if (seen.has(k)) continue; const ok = c === '.' || c === 'D' || (c === 'R' && red) || (c === 'U' && blue); if (!ok) continue; seen.add(k); q.push([nx, ny]); } }
  return seen;
};
const at = (x, y) => Math.floor(y) * lv.W + Math.floor(x);
const r0 = reach(9, 19, false, false), r1 = reach(9, 19, true, false), r2 = reach(9, 19, true, true);
console.log('cartão vermelho alcançável sem chaves:', r0.has(at(3.5, 20.5)));
console.log('cartão azul só com o vermelho:', !r0.has(at(28.5, 13.5)) && r1.has(at(28.5, 13.5)));
console.log('chega na frente da alavanca só com os dois:', !r1.has(at(24.5, 21.5)) && r2.has(at(24.5, 21.5)));
// 3) jogar 10 s com teclas aleatórias
A.click({ act: 'play' });
const keysList = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowLeft', 'ArrowRight'];
for (let i = 0; i < 40; i++) { const k = keysList[i % keysList.length]; A.key(k); A.key('KeyF'); A.run(250); A.key(k, true); A.key('KeyF', true); }
s = A.snap();
console.log('10s jogando: fase', s.phase, '| saúde', Math.round(s.st.p.hp), '| balas', s.st.p.bullets, '| mortos', s.st.kills, '| pixels pintados', [...A.G.document.getElementById ? [1] : []].length);
// 4) atirar num rastejante na frente
const B = makeEnv(); B.click({ act: 'play' }); s = B.snap().st;
const e = s.foes.find(f => f.type === 'crawler');
Object.assign(e, { x: s.p.x, y: s.p.y - 2.5, state: 'chase', cool: 5 });
s.p.a = -Math.PI / 2;
B.key('KeyF'); B.run(2500); B.key('KeyF', true);
console.log('rastejante a 2,5 m depois de 2,5 s de tiro: morto?', e.dead, '| balas gastas', 50 - s.p.bullets);
// 5) porta: anda até a porta da sala inicial, usa, atravessa
const C = makeEnv(); C.click({ act: 'play' }); s = C.snap().st;
for (const f of s.foes) f.state = 'idle';
s.foes.forEach(f => { f.x += 0; });
C.key('KeyW'); C.run(900); C.key('KeyW', true);
const yBefore = s.p.y;
C.key('KeyE'); C.run(700);
C.key('KeyW'); C.run(1500); C.key('KeyW', true);
console.log('porta: parou em y', yBefore.toFixed(2), '→ depois de abrir chegou a y', s.p.y.toFixed(2), '(corredor fica em y<16)');
// 6) monstros acordados acham o jogador atravessando portas
const Dd = makeEnv(); Dd.click({ act: 'play' }); s = Dd.snap().st;
for (const f of s.foes) if (f.x < 15 && f.y < 11) { f.state = 'chase'; f.alerted = true; }
let firstHit = null;
for (let t = 0; t < 30000; t += 250) { Dd.run(250); if (s.p.hp < 100 && firstHit === null) firstHit = t; if (Dd.snap().phase !== 'play') break; }
console.log('monstros do salão vieram até a sala inicial: primeiro dano aos', firstHit === null ? 'nunca' : (firstHit / 1000).toFixed(1) + 's', '| fase', Dd.snap().phase, '| saúde', Math.round(s.p.hp));
// 7) cartão e porta trancada
const E = makeEnv(); E.click({ act: 'play' }); s = E.snap().st;
Object.assign(s.p, { x: 14.5, y: 6.5, a: 0 });
E.key('KeyE'); E.run(100); console.log('porta vermelha sem cartão:', s.msg);
s.p.red = true; E.key('KeyE'); E.run(800); console.log('com cartão abriu:', s.doors[6 * 32 + 15].open.toFixed(2));
// 8) alavanca
Object.assign(s.p, { x: 24.5, y: 21.5, a: Math.PI / 2 });
E.key('KeyE'); console.log('alavanca → fase', E.snap().phase);
