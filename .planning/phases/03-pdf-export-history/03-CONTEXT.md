# Phase 3: PDF Export & History - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can export analysis results as branded PDF reports and search/filter their analysis history. This phase delivers:
- PDF generation and download for completed analyses
- Analysis history page with card-based layout
- Search by contract name + filters (risk level, date range)

**Out of scope:** Editing analyses, sharing with other users, re-analysis automation.
</domain>

<decisions>
## Implementation Decisions

### PDF Content
- **Completo**: Incluir todos los hallazgos, cláusulas analizadas, resumen ejecutivo, metadata
- **Longitud**: Sin límite — incluir todo lo relevante
- **Colores**: Brand colors (secondary/accent del branding Clarify)
- **Branding**: Claude decide — algo profesional y limpio (logo + nombre Clarify)
- **Entrega**: Claude decide — mejor UX para download/preview

### Historial Layout
- **Layout**: Tarjetas (cards) con resumen por análisis
- **Información**: Mínima — nombre, fecha, badge de riesgo
- **Orden**: Más recientes primero (descendente por fecha)

### Búsqueda y Filtros
- **Tipo**: Solo filtros (sin búsqueda textual full-text)
- **Filtros**: Ambos — riesgo (Alto/Medio/Bajo) + rango de fechas (desde/hasta)
- **Comportamiento**: Claude decide — instantáneo vs con botón
- **Empty state**: Claude decide — mensaje amigable

### Claude's Discretion
- Exact implementation of PDF download (direct vs preview modal)
- Branding details in PDF header
- Filter UX (instant vs apply button)
- Empty state design and copy
- Card styling details (spacing, shadows, hover states)
</decisions>

<specifics>
## Specific Ideas

- PDF should use Clarify brand colors (secondary green, accent indigo)
- Cards should be clean and scannable — risk badge prominent
- Filters: risk level dropdown + date range picker
- No text search needed — users can filter by risk and date
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.
</deferred>

---

*Phase: 03-pdf-export-history*
*Context gathered: 2026-02-24*
