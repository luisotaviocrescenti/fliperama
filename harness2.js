const fs = require('fs'), vm = require('vm');
const code = fs.readFileSync(process.argv[2], 'utf8').split('<script>')[1].split('</script>')[0];
function makeEnv() {
  const listeners = {};
  const on = key => (type, fn) => { (listeners[key + ':' + type] ||= []).push(fn); };
  const grad = { addColorStop() {} };
  const ctxProxy = new Proxy({}, { get: (t, k) => (k in t ? t[k] : (String(k).startsWith('create') ? () => grad : () => {})), set: (t, k, v) => { t[k] = v; return true; } });
  const els = {};
  const el = id => ({ id, style: {}, classList: { toggle() {}, add() {}, remove() {} }, getContext: () => ctxProxy, width: 300, height: 150, clientWidth: 1120,
    hidden: false, textContent: '', innerHTML: '', dataset: {}, querySelectorAll: () => [], querySelector: () => null, contains: () => false,
    addEventListener: on(id), focus() {}, blur() {} });
  const T = { now: 0 };
  const G = {
    document: { getElementById: id => (els[id] ||= el(id)), createElement: () => el('canvas'), querySelectorAll: () => [], addEventListener: on('doc'), activeElement: null, hidden: false },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    localStorage: (() => { const ls = {}; return { getItem: k => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); } }; })(),
    performance: { now: () => T.now },
    requestAnimationFrame: cb => { T.raf = cb; },
    ResizeObserver: class { observe() {} },
    addEventListener: on('win'), devicePixelRatio: 1, Math, JSON, Object, Array, Set, Float32Array, Int16Array, Int32Array, String, Number, Infinity, console,
    claude: { hot: { snapshot: fn => { T.snap = fn; } } }
  };
  G.window = G;
  vm.createContext(G); vm.runInContext(code, G);
  const fire = (k, e) => (listeners[k] || []).forEach(fn => fn(e));
  return {
    els, snap: () => T.snap(),
    click: dataset => fire('overlay:click', { target: { closest: () => ({ dataset }) } }),
    key: (code, up) => fire(up ? 'win:keyup' : 'win:keydown', { code, repeat: false, target: { closest: () => null }, preventDefault() {} }),
    run: ms => { for (let t = 0; t < ms; t += 16) { T.now += 16; T.raf(T.now); } }
  };
}
function trial(diffKey, setup, ms) {
  const G = makeEnv();
  G.click({ act: 'diff', val: diffKey }); G.click({ act: 'play' });
  if (setup) setup(G.snap().st, G);
  G.key('Enter');
  let t = 0;
  while (G.snap().phase === 'seek' && t < ms) { G.run(100); t += 100; }
  const z = G.snap();
  return { result: z.st.result, survived: z.st.survived, sek: z.st.sek };
}
const tally = (name, fn, n = 6) => {
  const res = []; for (let i = 0; i < n; i++) res.push(fn());
  const won = res.filter(r => r.result === 'won').length, lost = res.filter(r => r.result === 'lost');
  console.log(name.padEnd(40), 'corredor ganhou', won + '/' + n, lost.length ? '| pego em média aos ' + (lost.reduce((a, r) => a + r.survived, 0) / lost.length / 1000).toFixed(1) + 's' : '');
};
tally('parado no meio da sala (normal)', () => trial('normal', null, 65000));
tally('parado no canto aberto (fácil)', () => trial('easy', st => { st.run.x = 26; st.run.y = 16.5; }, 65000));
const fort = st => {
  const o = st.objs;
  Object.assign(o[6], { x: 13, y: 6.4 }); Object.assign(o[7], { x: 13, y: 10.6 });
  Object.assign(o[0], { x: 13.5, y: 7.4 }); Object.assign(o[1], { x: 13.5, y: 9.6 });
  Object.assign(o[10], { x: 21, y: 16 }); Object.assign(o[11], { x: 1, y: 16 });
  st.run.x = 11.2; st.run.y = 9;
};
tally('forte bem feito (difícil)', () => trial('hard', fort, 65000));
tally('forte com rampa encostada (difícil)', () => trial('hard', st => { fort(st); Object.assign(st.objs[10], { x: 18.4, y: 8 }); }, 65000));
tally('portas tampadas sem escora (difícil)', () => trial('hard', st => { fort(st); Object.assign(st.objs[0], { x: 25.5, y: 13 }); Object.assign(st.objs[1], { x: 1.5, y: 13 }); }, 65000));

const A = makeEnv(); A.click({ act: 'play' });
let s = A.snap().st; s.run.x = 13.6; s.run.y = 9; s.run.fx = -1; s.run.fy = 0;
A.key('Space'); const h = s.run.held; console.log('segurando objeto', h, s.objs[h] && s.objs[h].k);
const bx = s.objs[h].x;
A.key('KeyD'); A.run(600); A.key('KeyD', true);
console.log('arrastou de', bx, 'para', s.objs[h].x.toFixed(2), '| corredor em', s.run.x.toFixed(2));
A.key('KeyE'); console.log('girou: w×h =', s.objs[h].w + '×' + s.objs[h].h);
A.key('Space'); console.log('soltou:', s.run.held === -1);
const B = makeEnv(); B.click({ act: 'play' }); s = B.snap().st; s.run.x = 7.5; s.run.y = 10;
B.key('KeyD'); let maxZ = 0; for (let i = 0; i < 40; i++) { B.run(50); maxZ = Math.max(maxZ, s.run.z); } B.key('KeyD', true); B.run(500);
console.log('subiu a rampa: z máximo', maxZ.toFixed(2), '| terminou em x', s.run.x.toFixed(2), 'z', s.run.z.toFixed(2));
const C = makeEnv(); C.click({ act: 'play' }); s = C.snap().st; s.run.x = 12; s.run.y = 4; s.run.fx = 0; s.run.fy = -1;
const b0 = s.objs[1].y; C.key('KeyW'); C.run(800); C.key('KeyW', true);
console.log('corredor empurrou cubo de y', b0, 'para', s.objs[1].y.toFixed(2));
