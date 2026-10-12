const src = require('fs').readFileSync('harness2.js', 'utf8').split('function trial')[0];
eval(src.replace("process.argv[2]", "'pega-pega.html'"));
const byId = (st, id) => st.objs.find(o => o.id === id);
function trial(diffKey, setup, ms) {
  const G = makeEnv();
  G.click({ act: 'diff', val: diffKey }); G.click({ act: 'play' });
  if (setup) setup(G.snap().st, G);
  G.key('Enter');
  let t = 0;
  while (G.snap().phase === 'seek' && t < ms) { G.run(100); t += 100; }
  const z = G.snap();
  return { result: z.st.result, survived: z.st.survived };
}
const tally = (name, fn, n = 6) => {
  const res = []; for (let i = 0; i < n; i++) res.push(fn());
  const won = res.filter(r => r.result === 'won').length, lost = res.filter(r => r.result === 'lost');
  console.log(name.padEnd(40), 'corredor ganhou', won + '/' + n, lost.length ? '| pego em média aos ' + (lost.reduce((a, r) => a + r.survived, 0) / lost.length / 1000).toFixed(1) + 's' : '');
};
const fort = st => {
  Object.assign(byId(st, 8), { x: 10, y: 3, w: 2, h: 1 });
  Object.assign(byId(st, 9), { x: 12, y: 3, w: 1, h: 2 });
  Object.assign(byId(st, 10), { x: 11, y: 5, w: 2, h: 1 });
  Object.assign(byId(st, 12), { x: 10, y: 4, w: 1, h: 2 });
  st.run.x = 11.5; st.run.y = 4.5;
};
tally('parado no meio do galpão (normal)', () => trial('normal', null, 65000));
tally('parado atrás de uma caixa (fácil)', () => trial('easy', st => { st.run.x = 20.5; st.run.y = 10; }, 65000));
tally('forte fechado de 4 caixas (difícil)', () => trial('hard', fort, 65000));
tally('forte com rampa encostada (difícil)', () => trial('hard', st => { fort(st); Object.assign(byId(st, 15), { x: 13, y: 3.5, w: 2, h: 1, dir: 'left' }); }, 65000));

// pegar, carregar, girar e colocar
const A = makeEnv(); A.click({ act: 'play' });
let s = A.snap().st; s.run.x = 13.5; s.run.y = 6.5; s.run.fx = 1; s.run.fy = 0;
A.key('Space'); console.log('carregando:', s.run.carry && s.run.carry.k, '| objetos no chão:', s.objs.length);
A.key('KeyS'); A.run(500); A.key('KeyS', true);
s.run.fx = 0; s.run.fy = 1;
A.key('KeyE'); console.log('girou para', s.run.carry.w + '×' + s.run.carry.h);
A.key('Space'); const placed = s.objs[s.objs.length - 1];
console.log('colocou em', placed.x, placed.y, placed.w + '×' + placed.h, '| corredor em', s.run.x.toFixed(2), s.run.y.toFixed(2), '| objetos no chão:', s.objs.length);

// fechar o forte por dentro com a última caixa
const B = makeEnv(); B.click({ act: 'play' }); s = B.snap().st;
fort(s);
const last = byId(s, 10); s.objs.splice(s.objs.indexOf(last), 1); s.run.carry = Object.assign(last, { w: 2, h: 1 });
s.run.fx = 0; s.run.fy = 1;
B.key('Space');
console.log('fechou o forte por dentro:', !s.run.carry, '| caixa em', last.x, last.y);
