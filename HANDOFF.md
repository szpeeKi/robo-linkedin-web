# Handoff — Bot de Posts do LinkedIn

Contexto pro Claude (no VS Code) continuar exatamente de onde parou. Escrito
em 23/09/2026, fim de uma sessão longa que resolveu vários bugs reais.

## O que é o projeto

Sistema pro time de marketing agendar posts no LinkedIn (via um app web +
Supabase) e um robô Python que roda numa máquina dedicada, lê os posts
agendados e publica automaticamente no LinkedIn usando Playwright (automação
de navegador, não é API oficial).

Quatro partes, cada uma numa pasta (na raiz `Robo-Linkedin`):

- **App web** (`app/`, `components/`, `lib/` — Next.js): onde o time
  cadastra os posts. Publicado em
  **https://deluxe-treacle-2c7453.netlify.app**.
- **App de mesa** (`desktop-src/` — Electron): abre o app web numa janela
  sem barra de navegador, com uma barra de status própria (ícone InovaComm,
  "próxima execução automática" e botão "Rodar agora").
- **Robô** (`robo-src/` — Python + Playwright): lê posts pendentes no
  Supabase e publica no LinkedIn, incluindo anexar imagem de verdade.
- **Instalador** (`instalador/` — Inno Setup): empacota o app + o robô +
  um Python portátil num único `.exe` pro time de marketing instalar sem
  nenhum passo manual.

## Estado atual — tudo funcionando e testado hoje

### 1. App web (Netlify)
✅ No ar, com upload de **foto ou vídeo** no formulário (link OU arquivo do
computador — os dois preenchem o mesmo campo `imagem_url`; escolher um arquivo
substitui o link). Editar/excluir posts também já existia e continua
funcionando.

**Vídeo (adicionado em 23/09/2026, commit `b8d501d`)**: o arquivo NÃO passa
mais pela Server Action. O navegador pede uma URL de upload assinada
(`prepararUploadDeMidia` em `lib/actions.ts`, usa a service_role só no
servidor) e manda o arquivo direto pro Supabase Storage
(`uploadToSignedUrl`, em `components/FormularioPost.tsx`) — vídeo é grande
demais pro limite de corpo das Server Actions/funções do Netlify. Limites em
`lib/constantes.ts`: foto 8 MB, vídeo **50 MB** (teto do plano gratuito do
Supabase; se o plano subir, é só aumentar lá). A coluna e o campo continuam
chamados `imagem_url` de propósito (o robô já instalado lê esse nome; guarda
foto OU vídeo). O bucket continua `linkedin-imagens`.
⚠️ Verificado: build, tsc, eslint e upload de vídeo no Storage com a chave
pública. **Não** foi testado o fluxo completo pela tela (precisa de login) —
o trecho da URL assinada só roda em produção (a service_role local está vazia
no `.env.local`).

**Deploy automático**: conectado a um repositório GitHub
(**https://github.com/szpeeKi/robo-linkedin-web** — **público**, sem
segredos) que builda sozinho no Netlify a cada `git push origin master`.

⚠️ **Duas armadilhas de deploy que já foram resolvidas, mas guarde isso**:
- **Deploy manual pelo Windows não funciona** (`netlify deploy --prod`
  rodando localmente) — bug real do empacotador de Edge Functions do
  Netlify no Windows (mistura caminho estilo Unix com Windows,
  `Cannot find module`). É por isso que o deploy tem que ser sempre via
  `git push` (builda nos servidores Linux do Netlify).
- **O repositório precisa continuar público** — Netlify bloqueia deploy de
  repositório privado nessa conta com "Unrecognized Git contributor" (é uma
  restrição de plano, não resolvi via painel/API). Se alguém tornar o repo
  privado de novo, o deploy quebra.

Pra deployar mudanças no app web: `git add`, `git commit`, `git push origin
master` — o Netlify pega sozinho. Confirmar com
`npx netlify-cli api listSiteDeploys --data '{"site_id":"055ad1dd-658c-4d4b-88fc-4a9e007efef6"}'`.

### 2. Robô (`robo-src/`)
✅ Funcionando, com três correções importantes feitas hoje:

- **Usa o Microsoft Edge do sistema** (`channel="msedge"` no
  `pw.chromium.launch(...)`) em vez de baixar um Chromium próprio — antes
  precisava carregar ~350 MB extra pra distribuir.
- **`requirements.txt` estava desatualizado**: pedia `supabase==2.9.1`
  (não aceita o formato novo de chave `sb_secret_...`), mas a venv real já
  usava 2.31.0 há tempos. Corrigido pra `supabase>=2.31.0`.
- **Imagem anexada de verdade no post** (antes só guardava o link sem
  usar). Fluxo: baixa a imagem pra um arquivo temporário → clica em "Mídia"
  (usando `expect_file_chooser` pra não abrir o diálogo nativo do Windows)
  → escolhe o arquivo → clica "Avançar" → confere se a prévia carregou
  (não ficou com ícone de "imagem quebrada") antes de publicar.
  **MUITO IMPORTANTE**: o arquivo temporário da imagem só pode ser apagado
  **depois que o post inteiro publicar** — o LinkedIn lê o arquivo de forma
  assíncrona, e apagar cedo demais é o que causava posts saindo sem imagem
  ou com ela quebrada. Essa lógica já está certa em `linkedin_bot.py`
  (`publicar_post` baixa a imagem e só apaga no `finally`, depois de tudo).
  Não mexer nisso sem entender essa ordem.
- **Publica como PÁGINA da empresa** (24/09/2026): descobrimos que o marketing
  NÃO posta pelo feed do perfil pessoal — entra na conta pessoal e posta pelo
  painel de admin da página InovaComm (botão "Criar" > "Começar publicação").
  Agora, se `LINKEDIN_PAGINA_ADMIN_URL` estiver no `.env` do robô, ele segue
  esse caminho (`_abrir_caixa_como_pagina` + `_conferir_autor_da_pagina` em
  `linkedin_bot.py`); vazia = comportamento antigo (feed pessoal). O
  `instalador\robo.env` já vem com
  `LINKEDIN_PAGINA_ADMIN_URL=https://www.linkedin.com/company/inovacomm/admin/dashboard/`
  e `LINKEDIN_PAGINA_NOME=InovaComm Comunicações Unificadas` (o `robo-src\.env`
  de desenvolvimento continua no modo pessoal, pra testar com "Rafael Teste").
  A conferência de `LINKEDIN_PAGINA_NOME` aborta se a caixa abrir como pessoa
  (nunca posta na conta errada). ⚠️ **O fluxo como ADMIN nunca foi testado de
  verdade**: a conta "Rafael Teste" não administra a página (o LinkedIn manda
  ela pra `/company/unavailable/` e o robô para com erro claro — isso foi
  testado). Os seletores ("Criar", "Começar publicação", o `dialog`, o botão de
  mídia) vêm dos prints do Rafael. Se falhar na primeira vez, olhe o
  `ultimo_erro.png` (screenshot salvo ao lado do robô a cada erro, ex.:
  `%LOCALAPPDATA%\...\robo\ultimo_erro.png`) e ajuste os seletores. A conta
  cadastrada em Configurações no app precisa ser a do marketing que é ADMIN da
  página, não a "Rafael Teste".
- **Link do post** (24/09/2026): depois de publicar, `_capturar_link_do_post`
  lê o aviso "Publicação concluída. **Ver publicação**" (`role=alert`) e devolve
  `https://www.linkedin.com/feed/update/urn:li:activity:<id>/`. `main.py` grava
  em `linkedin_post_url` (coluna nova, migration `adiciona_linkedin_post_url`)
  e o URN em `linkedin_post_urn`; a fila do app mostra "Ver post no LinkedIn ↗"
  nos posts publicados. Nunca levanta erro (o post já saiu; falhar aqui
  duplicaria o post numa nova tentativa) — se não achar, grava `None`. Testado
  no perfil pessoal (texto e vídeo); no modo página assume-se o mesmo aviso.
- **Vídeo** (23/09/2026): `_baixar_midia_temporaria` decide foto×vídeo pelo
  `Content-Type` real da resposta (extensão só como reserva). No LinkedIn o
  vídeo **não passa pelo editor "Avançar"** — volta direto pra caixa de
  publicação com a prévia (`<video>`) e o botão Publicar (testado com MP4
  H.264 de 5 s na conta "Rafael Teste": publicou com o vídeo em ~26 s).
  `_confirmar_video_anexado` só libera quando aparece um `<video>` novo na
  caixa (se não aparecer, para com erro em vez de publicar só o texto), e o
  clique em Publicar espera até 10 min o botão habilitar (vídeos grandes).
  **Não testado com vídeo grande** (dezenas de MB) — se o LinkedIn desabilitar
  o Publicar durante o envio, o código já espera, mas vale conferir na
  primeira vez.

`config.py` também já resolve tudo (`.env`, caminho da sessão) relativo à
própria pasta do script, não à pasta de onde foi chamado — então roda igual
seja via Task Scheduler, `python main.py` direto, ou o `.bat` do instalador.

### 3. App de mesa (`desktop-src/`)
✅ Não é mais só uma janela passiva. Agora tem:
- Barra de status no topo com logo InovaComm, texto "Próxima execução
  automática: HH:MM" e botão **"Rodar agora"**.
- "Rodar agora" aciona a **mesma tarefa agendada** (`Robo Posts LinkedIn`)
  via PowerShell (`Start-ScheduledTask`) — nunca sobe um robô paralelo.
  Se a tarefa não existir na máquina (app rodando sem o instalador), mostra
  aviso e desabilita o botão em vez de travar.
- Conteúdo do app web carrega dentro de uma `<webview>` (não mais
  `loadURL` direto) — necessário pra caber a barra de status acima.
- Ícone: `desktop-src/build/icon.ico` (marca circular da InovaComm
  recortada da logo, gerado com `electron-icon-builder`).

Rebuild: `cd desktop-src && npm run empacotar-windows` (gera
`desktop-src\dist\Posts do LinkedIn-win32-x64\`).

### 4. Instalador (`instalador/`)
✅ **117 MB** (era 208 MB antes de hoje). Arquivo final:
`instalador\saida\Instalar-Posts-LinkedIn.exe`.

Duas mudanças grandes hoje:
- **Não copia mais a `.venv` do robô** — isso quebrava em qualquer PC
  diferente do do Rafael, porque a venv guarda o caminho exato de onde foi
  criada (`pyvenv.cfg` aponta pra uma instalação específica do Python que
  só existe nesse PC). Sintoma era exatamente "abre um cmd e fecha rápido".
  Agora usa uma **distribuição Python portátil de verdade**
  (`instalador\python-portatil\`, baixada do python.org como "embeddable
  zip", com pip + as dependências do `requirements.txt` já instaladas
  dentro) — funciona em qualquer Windows sem precisar de Python instalado.
- **Não empacota mais o Chromium do Playwright** (usa o Edge do sistema,
  ver seção do robô acima).

**Como recompilar** depois de mexer em `desktop-src` ou `robo-src`:
```powershell
cd instalador
& "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe" setup.iss
```
(ou o caminho completo:
`C:\Users\RafaelPintodeSouzaSa\AppData\Local\Programs\Inno Setup 6\ISCC.exe`)

Se só mudar `robo-src/*.py`, **não precisa reinstalar nada no
`python-portatil`** — ele só tem os pacotes pip, os `.py` são copiados
fresquinhos do `robo-src` a cada compilação.

Se mudar `robo-src/requirements.txt` (nova dependência), aí sim precisa
rodar de novo:
```powershell
& "instalador\python-portatil\python.exe" -m pip install -r "robo-src\requirements.txt"
```

**Testar instalação limpa** (útil antes de distribuir):
```powershell
Start-Process "instalador\saida\Instalar-Posts-LinkedIn.exe" -ArgumentList "/VERYSILENT","/DIR=$env:LOCALAPPDATA\TesteX","/SUPPRESSMSGBOXES","/NORESTART" -Wait
& "$env:LOCALAPPDATA\TesteX\rodar_robo.bat"   # roda o robô de verdade, publica se tiver post pendente
schtasks /Delete /TN "Robo Posts LinkedIn" /F  # limpar depois
Remove-Item "$env:LOCALAPPDATA\TesteX" -Recurse -Force
```

## ⚠️ Pendência urgente pro Rafael (não é código, é ação humana)

O Rafael já subiu o instalador corrigido (venv + imagem) pro time. **Mas vídeo,
publicação como página e captura do link mexeram em `robo-src/`**, então o robô
instalado no marketing ainda NÃO faz nada disso: o instalador foi recompilado em
24/09/2026 (`instalador\saida\Instalar-Posts-LinkedIn.exe`) e precisa ser
**subido de novo pro Drive e reinstalado na máquina do marketing**. Depois de
reinstalar, o primeiro post pela página é o teste real (ver aviso sobre o fluxo
de admin não testado, na seção do robô). Até lá, posts com vídeo agendados pelo app web vão
dar erro no robô antigo (ele espera o "Avançar" da foto, que não aparece no
vídeo) e ficar com status "erro" na fila.

## Pendências de mais longo prazo (não urgentes)

- O repositório GitHub está **público** por necessidade (ver seção de
  deploy acima). Se isso incomodar no futuro, as opções são: contatar
  suporte do Netlify pedindo "verified member", ou aceitar o repo público
  (não tem segredo nenhum nele — todos os `.env`/chaves ficam fora do git).
- A conta de teste do LinkedIn (perfil "Rafael Teste") acumulou muitos
  posts de teste durante os testes de hoje (textos tipo "TESTE FIX ####",
  "teste imagem", etc.) — apagar manualmente se incomodar, não é urgente.
- Criar os usuários de login do time de marketing no Supabase Auth
  (pendência antiga, ainda não feita).
- Existe um projeto Netlify extra por acidente (`eloquent-hummingbird-0db7ef`)
  — provavelmente não usado, nunca confirmado com o Rafael se pode apagar.
- `desktop-src` não tem testes automatizados formais — as verificações
  feitas hoje foram via Playwright `_electron` manualmente (não fica salvo
  como suite de testes no repo).

## Onde estão as coisas (referência rápida)

| O quê | Caminho |
|---|---|
| App web (código) | raiz do repo: `app/`, `components/`, `lib/` |
| Robô (dev, com `.venv` própria) | `robo-src/` |
| App de mesa (Electron) | `desktop-src/` |
| App de mesa (build) | `desktop-src\dist\Posts do LinkedIn-win32-x64\` |
| Instalador (fonte) | `instalador\setup.iss`, `instalador\python-portatil\`, `instalador\robo.env`, `instalador\rodar_robo.bat` |
| Instalador (.exe final) | `instalador\saida\Instalar-Posts-LinkedIn.exe` |
| Repositório GitHub (app web) | https://github.com/szpeeKi/robo-linkedin-web (público) |
| Site no Netlify | https://deluxe-treacle-2c7453.netlify.app (site_id `055ad1dd-658c-4d4b-88fc-4a9e007efef6`) |
| Bucket de imagens (Supabase Storage) | `linkedin-imagens` (público) |
| Tarefa agendada do robô (Windows) | nome exato: `Robo Posts LinkedIn` |

**Importante**: `robo-src/`, `desktop-src/` e `instalador/` estão todos no
`.gitignore` do repositório do app web — só o app web (Next.js) é
versionado no GitHub. Isso é intencional (robô/instalador têm segredos e
são grandes demais).

## Regra importante (segurança)

Nunca digitar senhas, chaves de API ou outros segredos direto em
formulários/arquivos sem o Rafael colar ele mesmo — regra seguida à risca
até aqui. A `SUPABASE_SERVICE_ROLE_KEY` já está em `robo-src/.env` e em
`instalador/robo.env` (o Rafael topou distribuir essa chave dentro do
instalador pro time de marketing — decisão consciente dele, registrada na
sessão).
