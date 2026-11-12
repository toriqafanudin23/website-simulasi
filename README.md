# 1729 — simulasi matematika (tahap 1: navbar, footer, landing page)

```bash
npm install
npm run dev
```

Stack: Vite, React 19, TypeScript, Tailwind CSS v4, React Router. Font: Libre Baskerville dan Rubik (self-hosted via Fontsource).

Aturan UI: putih, slate, aksen sky; tanpa sudut membulat; tanpa border pada tombol dan kartu.

- `src/components/layout`: Navbar, Footer, Layout
- `src/components/graph`: kanvas grafik interaktif di beranda (tanpa dependensi)
- `src/components/layout/SimulationShell.tsx`: kerangka halaman simulasi (header, papan, tab kontrol, layar penuh) yang dipakai semua simulasi
- `src/simulations/quadratic`, `src/simulations/derivative`: simulasi fungsi kuadrat dan turunan
- `src/components/ui/Reveal.tsx`: animasi muncul saat di-scroll (satu IntersectionObserver bersama)
- `src/data/simulations.ts`: daftar 15 simulasi dari proyek lama (metadata saja)
