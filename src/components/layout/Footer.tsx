import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TOPICS } from "../../data/simulations";

export function Footer() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/simulasi?q=${encodeURIComponent(q)}` : "/simulasi");
  }

  return (
    <footer className="container-page">
      <div aria-hidden="true" className="h-1.5 bg-ink" />
      <div className="grid gap-8 pb-8 pt-8 lg:grid-cols-[1.2fr_1fr] lg:gap-[72px] lg:pb-10 lg:pt-12">
        <div>
          <h2 className="mb-2 text-[22px] leading-[1.25] lg:text-2xl">Toriq Afanudin</h2>
          <p className="text-[17px] leading-[1.56] text-muted">
            Saya membangun 1729 sebagai ruang simulasi untuk belajar dan mengajar matematika: grafik yang bisa digeser,
            parameter yang bisa diubah, dan hasilnya langsung terlihat.
          </p>
          <Link to="/tentang" className="link mt-3 inline-block text-[17px]">
            Tentang 1729
          </Link>
        </div>

        <div>
          <form role="search" onSubmit={onSubmit}>
            <label htmlFor="cari" className="mb-2 block font-medium text-ink">
              Cari simulasi
            </label>
            <input
              id="cari"
              name="q"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Misalnya: parabola"
              className="min-h-12 w-full border-2 border-ink bg-white px-3.5 font-sans text-base transition-colors hover:border-brand focus:border-brand"
            />
          </form>
          <ul className="mt-5 flex flex-wrap gap-x-1.5 text-[15px] leading-[1.7] text-link">
            {TOPICS.map((t, i) => (
              <li key={t}>
                <Link to={`/simulasi?topik=${t.toLowerCase()}`} className="inline-flex min-h-8 items-center hover:text-ink hover:underline underline-offset-2 pointer-coarse:min-h-11">
                  #{t.toLowerCase()}
                </Link>
                {i < TOPICS.length - 1 ? "," : null}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-3 pb-12 pt-4 text-muted sm:flex-row sm:justify-between">
        <span>1729, oleh Toriq Afanudin, S.Pd.</span>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="link inline-flex min-h-11 items-center self-start sm:self-auto">
          Kembali ke atas
        </button>
      </div>
    </footer>
  );
}
