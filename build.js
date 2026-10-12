// Junta os jogos (cada um no seu .html) num único Fliperama com menu de escolha.
const fs = require('fs');
const path = require('path');
const dir = __dirname;

const GAMES = [
  { id: 'cobrinha', file: 'cobrinha.html', fn: 'mountCobrinha' },
  { id: 'pega-pega', file: 'pega-pega.html', fn: 'mountPegaPega' },
  { id: 'abismo', file: 'abismo.html', fn: 'mountAbismo' }
];

function once(src, from, to, label) {
  const n = typeof from === 'string' ? src.split(from).length - 1 : (src.match(new RegExp(from.source, 'g' + from.flags.replace('g', ''))) || []).length;
  if (n !== 1) throw new Error(label + ': esperava 1 ocorrência, achei ' + n);
  return src.replace(from, to);
}

function convert(g) {
  const html = fs.readFileSync(path.join(dir, g.file), 'utf8');
  const css = html.split('<style>')[1].split('</style>')[0];
  const markup = html.split('</style>')[1].split('<script>')[0].trim();
  let js = html.split('<script>')[1].split('</script>')[0].trim();
  if (!js.startsWith('(() => {') || !js.endsWith('})();')) throw new Error(g.id + ': script fora do formato esperado');
  js = js.slice('(() => {'.length, -'})();'.length);

  // ouvintes globais passam a ser registrados para sair quando o jogo fecha
  const before = js;
  js = js.replace(/^  addEventListener\(/gm, '  on(window, ');
  js = js.replace(/^  document\.addEventListener\(/gm, '  on(document, ');
  if (before === js) throw new Error(g.id + ': nenhum ouvinte global encontrado');
  js = once(js, "coarse.addEventListener('change', syncOverlay);", "on(coarse, 'change', syncOverlay);", g.id + ' coarse');
  js = once(js, 'new ResizeObserver(layout).observe(fit);', '{ const ro = new ResizeObserver(layout); ro.observe(fit); offs.push(() => ro.disconnect()); }', g.id + ' resize');
  js = once(js, 'function frame(now) {', 'function frame(now) {\n    if (!alive) return;', g.id + ' frame');
  js = once(js,
    /  window\.claude\?\.hot\?\.snapshot\?\.\(\(\) => (\(\{[^}]*\}\))\);\n  window\.claude\?\.hot\?\.ready[^\n]*\n/,
    '  boot(data || {});\n  return { unmount, snapshot: () => $1 };\n',
    g.id + ' boot');

  const head =
    '  const offs = [];\n' +
    '  let alive = true;\n' +
    '  const on = (t, type, fn) => { t.addEventListener(type, fn); offs.push(() => t.removeEventListener(type, fn)); };\n' +
    '  const unmount = () => { alive = false; offs.forEach(f => f()); try { if (actx) actx.close(); } catch (e) {} };\n';
  return {
    css, markup,
    js: 'function ' + g.fn + '(data) {\n' + head + js + '}\n'
  };
}

const parts = GAMES.map(g => Object.assign({}, g, convert(g)));
const hub = fs.readFileSync(path.join(dir, 'hub.html'), 'utf8');
const hubCss = hub.split('<style>')[1].split('</style>')[0];
const hubJs = hub.split('<script>')[1].split('</script>')[0].trim();

const out =
  '<title>Fliperama</title>\n' +
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Big+Shoulders+Display:wght@700;900&family=Bricolage+Grotesque:opsz,wght@12..96,700..800&family=Teko:wght@500;600;700&display=swap">\n' +
  '<style>\n' +
  '[hidden] { display: none !important; }\n' +
  '/* botão de voltar ao Fliperama, usa as cores de cada jogo */\n' +
  '.backbtn { align-self: flex-start; display: inline-flex; align-items: center; gap: 8px; font: 700 13px/1 "Atkinson Hyperlegible", system-ui, sans-serif; color: var(--ink); background: var(--panel); border: 1px solid var(--line); border-radius: 999px; padding: 9px 15px; cursor: pointer; }\n' +
  '.backbtn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }\n' +
  '</style>\n' +
  '<style id="screen-css"></style>\n' +
  '<div id="app"></div>\n' +
  '<template id="css-hub"><style>' + hubCss + '</style></template>\n' +
  parts.map(p => '<template id="css-' + p.id + '"><style>' + p.css + '</style></template>\n<template id="html-' + p.id + '">' + p.markup + '</template>\n').join('') +
  '<script>\n' +
  parts.map(p => p.js).join('\n') + '\n' +
  hubJs + '\n' +
  '</script>\n';

fs.writeFileSync(path.join(dir, 'fliperama.html'), out);
console.log('fliperama.html', (out.length / 1024).toFixed(1) + ' KB');
