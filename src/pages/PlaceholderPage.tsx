import { useParams } from "react-router-dom";
import { SIMULATIONS } from "../data/simulations";
import { Button } from "../components/ui/Button";

const COPY = {
  katalog: { title: "Daftar simulasi", body: "Halaman katalog dengan pencarian dan penyaring topik dibuat di tahap berikutnya." },
  simulasi: { title: "", body: "Ruang simulasi ini belum dibangun ulang. Tahap berikutnya mengerjakannya satu per satu." },
  tentang: { title: "Tentang 1729", body: "Halaman ini menyusul." },
  "404": { title: "Halaman tidak ditemukan", body: "Alamat yang kamu buka tidak ada di situs ini." },
} as const;

export default function PlaceholderPage({ kind }: { kind: keyof typeof COPY }) {
  const { slug } = useParams();
  const sim = SIMULATIONS.find((s) => s.slug === slug);
  const title = kind === "simulasi" ? (sim?.title ?? "Simulasi tidak ditemukan") : COPY[kind].title;

  return (
    <section className="container-page pb-20 pt-12">
      <h1 className="max-w-2xl text-[32px] leading-[1.15] md:text-5xl">{title}</h1>
      <p className="mt-5 max-w-lg text-[19px] leading-[1.6] text-muted">{COPY[kind].body}</p>
      <Button to="/" variant="soft" className="mt-8">
        Kembali ke beranda
      </Button>
    </section>
  );
}
