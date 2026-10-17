# RentReady

Free student renting companion for Durham: compare bills, prove the house's condition before/after, find storage and cleaning.

**Start here:** [`SPEC.md`](SPEC.md) (locked scope + every product decision). Background: [`PRD.md`](PRD.md).

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # logic unit tests
npm run build
```

- Logic: `src/lib` (pure TS) · State: `src/lib/store.ts` · Data: `src/data` (sources in `research/`)
- UI kit + palette: `src/components/ui.tsx`, `src/index.css`
- Screens: `src/pages/<module>` (thin; designed screens from Stitch replace these)
- **UI teammate:** see [`INTEGRATION.md`](INTEGRATION.md)
