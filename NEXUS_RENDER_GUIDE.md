# 🎬 NEXUS RENDER GUIDELINES: MOTOR HEADLESS SOTA 2026

Este projeto **DEVE** utilizar o motor de gravação industrial headless (`Engine-Headless-Recorder`) para todas as renderizações de vídeo final. Pipelines legados baseados em renderização nativa de GPU sem áudio sincronizado ou gravação por screenshot estão proibidos.

### 1. Requisitos de Integração (Obrigatoriedade)
Para ser detectado e orquestrado pela CLI centralizada (`scripts/render-all.js`), este projeto deve implementar:

1. **Dependência**: Adicionar `@nexus/recorder-sdk` ao `package.json`.
2. **Interface de Registro**: No ponto de entrada da sua fábrica visual (e.g., `App.jsx` ou `main.js`), registrar a interface:
   ```javascript
   import { registerRecordingInterface } from '@nexus/recorder-sdk';
   // ... após inicializar seu canvas e audio context
   registerRecordingInterface(meuCanvas, minhaFuncaoRenderFrame, meuOfflineAudioCtx);
   ```

### 2. Padrão de Renderização Determinística
*   **Virtual Time**: Não use `requestAnimationFrame` para lógica de animação que dependa de tempo real. Use a referência `virtualTimeMs` passada pela `renderFn` registrada.
*   **Áudio**: Utilize `OfflineAudioContext` para processamento determinístico de áudio sincronizado com o frame visual.

### 3. Workflow de Renderização
Não execute comandos de renderização manuais (`ffmpeg`, scripts de gravação antigos). O projeto deve estar configurado para ser capturado pela orquestração central.

*Para dúvidas técnicas, consulte o Design Spec em: `Engine-Headless-Recorder/docs/specs/2026-06-18-zero-network-headless-recording-design.md`*
