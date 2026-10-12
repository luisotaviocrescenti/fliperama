const fs = require('fs');
const src = fs.readFileSync(process.argv[2], 'utf8');
const code = src.split('<script>')[1].split('</script>')[0];
const listeners = {};
const on = (key) => (type, fn) => { (listeners[key + ':' + type] ||= []).push(fn); };
const grad = { addColorStop() {} };
const ctxProxy = new Proxy({}, { get: (t, k) => (k in t ? t[k] : (k.startsWith('create') ? () => grad : () => {})), set: (t, k, v) => { t[k] = v; return true; } });
function el(id) {
  return { id, style: { setProperty() {} }, classList: { toggle() {}, add() {}, remove() {}, contains: () => false }, getContext: () => ctxProxy,
    width: 300, height: 150, clientWidth: 1100, offsetHeight: 600, hidden: false, textContent: '', innerHTML: '', dataset: {},
    querySelectorAll: () => [], querySelector: () => null, contains: () => false, addEventListener: on(id), focus() {}, blur() {}, setPointerCapture() {} };
}
const els = {};
global.document = { getElementById: id => (els[id] ||= el(id)), createElement: () => el('canvas'), querySelectorAll: () => [], querySelector: () => null,
  addEventListener: on('doc'), activeElement: null, hidden: false, documentElement: el('html') };
global.window = global; global.devicePixelRatio = 1; global.innerHeight = 900;
global.matchMedia = () => ({ matches: false, addEventListener() {} });
const ls = {}; global.localStorage = { getItem: k => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); } };
let rafCb = null; global.requestAnimationFrame = cb => { rafCb = cb; };
global.ResizeObserver = class { constructor(cb) { this.cb = cb; } observe() { this.cb(); } };
global.addEventListener = on('win');
let now = 0; Object.defineProperty(global, 'performance', { value: { now: () => now }, configurable: true });
eval(code);
const fire = (k, e) => (listeners[k] || []).forEach(f => f(e));
const click = (dataset) => fire('overlay:click', { target: { closest: () => ({ dataset }) } });
const key = code => fire('win:keydown', { code, target: { closest: () => null }, preventDefault() {} });
const run = ms => { for (let t = 0; t < ms; t += 16) { now += 16; rafCb(now); } };
const dirs = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
for (const m of ['classic', 'time', 'rocks', 'turbo', 'zen']) {
  click({ act: 'modes' }); click({ act: 'play', mode: m });
  let ends = 0;
  for (let i = 0; i < 400; i++) {
    key(dirs[Math.random() * 4 | 0]); run(200);
    if (!els.overlay.hidden && /Fim de jogo|Acabou|jardim ficou/.test(els.overlay.innerHTML)) { ends++; click({ act: 'restart' }); }
  }
  key('Space'); run(100); click({ act: 'main' });
  console.log(m, 'ok, partidas terminadas:', ends, '| pontos agora:', els.score.textContent, '| recorde:', els.best.textContent);
}
click({ act: 'config' }); click({ act: 'set', key: 'walls', val: 'true' }); click({ act: 'set', key: 'apples', val: '5' }); click({ act: 'set', key: 'sky', val: 'night' }); click({ act: 'level', val: '9' });
click({ act: 'main' }); click({ act: 'modes' }); click({ act: 'play', mode: 'classic' });
for (let i = 0; i < 200; i++) { key(dirs[Math.random() * 4 | 0]); run(150); if (/Fim de jogo/.test(els.overlay.innerHTML) && !els.overlay.hidden) click({ act: 'restart' }); }
console.log('config ok', JSON.stringify(ls));
