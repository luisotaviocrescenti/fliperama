# Joguinhos

O Fliperama é a porta de entrada. Ele abre numa tela com um cartão para cada jogo. A pessoa escolhe um, joga, e o botão de voltar leva de novo para a escolha.

Os jogos de hoje:

- **Cobrinha.** Uma cobra-do-milho num jardim, com cinco modos (Clássico, Contra o relógio, Pedregulho, Turbo e Zen), velocidade de 1 a 9 e ciclo de dia e noite.
- **Pega-pega.** Num galpão, você tem um minuto para montar o esconderijo levantando caixas e rampas e mais um minuto para fugir do pegador, que só consegue empurrar.
- **Abismo.** Tiro em primeira pessoa no estilo dos jogos dos anos 90, numa estação de pesquisa. Nome, mapa, desenhos e sons são originais.

Os recordes e as configurações ficam salvos no navegador de quem joga.

## Como abrir

Abra o `index.html` no navegador. Não precisa instalar nada.

Com o GitHub Pages ligado (Settings > Pages, publicando a partir de um branch, pasta raiz), o jogo abre em https://luisotaviocrescenti.github.io/joguinhos/, no computador ou no celular.

## Como os arquivos se juntam

Cada jogo tem o seu arquivo: `cobrinha.html`, `pega-pega.html` e `abismo.html`. O `hub.html` é a tela de escolha. O `build.js` junta tudo:

```
node build.js
```

Ele grava dois arquivos. O `fliperama.html` é o mesmo que foi publicado no claude.ai. O `index.html` é esse mesmo conteúdo com o cabeçalho de página completo, para abrir direto no navegador e no GitHub Pages.

O GitHub Pages serve o `index.html` como está no repositório. Depois de mexer num jogo, rode o build e faça commit dos arquivos gerados junto com a mudança.

Um jogo novo entra como mais um item na lista `GAMES` do `build.js` e mais um cartão no `hub.html`. O build confere o formato do arquivo do jogo e para com uma mensagem quando algo está fora do esperado.

## Testes

Os `harness*.js` testam a lógica dos jogos no Node, sem navegador. Rode de dentro da pasta do repositório:

```
node harness.js cobrinha.html
node harness3.js
node harness5.js
```

O primeiro passa pelos cinco modos da Cobrinha e pelas configurações. O segundo testa esconderijos do Pega-pega contra o pegador. O terceiro confere no Abismo se os cartões e a saída são alcançáveis, as portas, o tiro e os monstros.

O `harness2.js` foi escrito para a primeira versão do Pega-pega e não roda sozinho com a atual. Ele continua aqui porque o `harness3.js` usa a preparação dele.

## De onde veio

Os jogos foram feitos em 12/10/2026 num chat do Claude Code aberto por engano no projeto DevMaster. Os arquivos estavam só na pasta temporária daquele chat e foram reconstruídos aqui a partir do histórico de edições. O build gera o mesmo Fliperama que estava publicado no claude.ai, byte a byte.
