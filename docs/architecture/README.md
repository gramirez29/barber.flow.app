# Diagramas de arquitectura — Barber Flow

Visualizaciones generadas a partir del knowledge graph guardado en `codebase-memory` (MCP), que mapea las 86 entidades y 85 relaciones entre las tres apps del monorepo (`barber-flow-api`, `barber-flow-web`, `barber-flow-mobile`).

Son archivos **HTML autocontenidos** — ábrelos directamente con doble clic o `start archivo.html` (Windows) / `open archivo.html` (Mac). No requieren servidor ni build.

## Archivos

| Archivo | Qué muestra | Cuándo usarlo |
|---|---|---|
| [`architecture-overview.html`](./architecture-overview.html) | 4 diagramas Mermaid estáticos: Backend, Web, Mobile y el "puente" `CALLS_API` entre frontends y backend. | Vista rápida por capas, ideal para explicar la arquitectura a alguien nuevo. |
| [`knowledge-graph-interactive.html`](./knowledge-graph-interactive.html) | Un único diagrama Mermaid con las 86 entidades, con pan/zoom, clic-para-ver-ficha y buscador de entidades. | Explorar el grafo completo y leer las observaciones de cada componente. |
| [`knowledge-graph-3d.html`](./knowledge-graph-3d.html) | Grafo de fuerzas en 3D (`3d-force-graph` + Three.js, embebido sin CDN). Nodos arrastrables, cámara orbital, partículas animadas en los enlaces `CALLS_API`. | Explorar visualmente la densidad de conexiones y detectar hubs (nodos muy conectados). Pesa ~1.3 MB porque incluye la librería completa. |

## Regenerar tras cambios en el código

Estos archivos son una **fotografía** del grafo al 2026-07-25 (rama `features/ConnectingFrontendWithBackend`). Si el knowledge graph en `codebase-memory` cambia (nuevas entidades/relaciones), hay que regenerarlos pidiéndole a Claude Code:

> "Ejecuta read_graph en codebase-memory y actualiza los diagramas en docs/architecture/"

## Origen de los datos

Fuente: `mcp__codebase-memory__read_graph`. El grafo se construyó explorando manualmente la estructura de carpetas de las tres apps y registrando entidades (Controllers, Services, Repositories, Contexts, Stores, etc.) y relaciones (`CALLS`, `USES`, `IMPLEMENTS`, `PERSISTS`, `INJECTS`, `RENDERS`, `CALLS_API`).
