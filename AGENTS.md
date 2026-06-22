# AGENTS.md - Guia de Execução Autônoma

## Visão Geral do Pipeline
Este projeto é uma arquitetura preditiva macroeconômica que traduz fluxos de capital globais em sistemas hidráulicos abissais, utilizando React, Three.js e uma pipeline de renderização determinística de alta performance.

## Canvas
- **Seletor CSS:** `#video-canvas`
- **Dimensões:** 1920x1080 px
- **Tipo de contexto:** webgl2 (via Three.js/R3F)

## API de Renderização
- **window.renderFrame(timeMs: number):** Define o tempo da simulação de forma determinística através de `window.__renderTimeMs`.
- **window.initializeScene(): Promise<boolean>:** Inicializa a cena e retorna sucesso.
- **window.__appReady:** `true` quando a aplicação React está montada e pronta para gravação.

## Como Executar o Pipeline
1. Gerar áudio e sincronia:
   ```bash
   uv run python conductor/generate_audio.py
   ```
2. Compilar assets web:
   ```bash
   npm run build
   ```
3. Gravar vídeo headless:
   ```bash
   node tools/Engine-Headless-Recorder/src/node/record_video.js --canvas=#video-canvas --duration=30 --fps=25 --output=pipeline/sync_drive/exports/abyssal_liquidity.mp4
   ```

## Assets Estáticos
Arquivos em `public/` incluídos no build:
- `script_ato1_sota.json`: Script de automação.
- `_words.json`: Alinhamento de legendas.
- `subtitles.json`: Legendas formatadas.
- `noticia.jpg`: Placeholder para texturas dinâmicas.

## Problemas Conhecidos e Correções Aplicadas
- **Canvas Transparency:** Adicionado `preserveDrawingBuffer: true` para captura correta via Puppeteer.
- **Deterministic Time:** Implementado `window.renderFrame` e bridge no `FluidEngine` para ignorar o delta de tempo real durante a gravação.
- **Timestamp Rounding:** Corrigido arredondamento de microssegundos no `recorder-core.js` para evitar jitter em frames de WebCodecs.
- **Missing Assets:** Criados placeholders em `public/` para evitar falhas silenciosas de `fetch()`.

## Testes
- **Vitest:** `npm test`
