import { Link } from "react-router-dom";
import { ParabolaWorkspace } from "../components/graph/ParabolaWorkspace";
import { Button } from "../components/ui/Button";
import { M } from "../components/ui/Math";
import { Reveal } from "../components/ui/Reveal";
import { SectionHeading } from "../components/ui/SectionHeading";
import { FEATURED, SIMULATIONS, TOPICS, simulationPath } from "../data/simulations";

const STEPS = [
  {
    title: "Seret, jangan ketik",
    body: "Titik, sudut, dan sisi bisa ditarik langsung di grafik. Rumus dan angka di sampingnya ikut berubah saat itu juga.",
  },
  {
    title: "Satu simulasi, satu layar",
    body: "Grafik mengisi layar dan kontrolnya tidak menutupinya. Cukup besar untuk proyektor, tetap nyaman di ponsel yang diputar.",
  },
  {
    title: "Tautan membawa keadaannya",
    body: "Nilai parameter ikut tersimpan di alamat. Siswa membuka simulasi yang sama persis dengan yang kamu tunjukkan di kelas.",
  },
  {
    title: "Tanpa akun",
    body: "Buka dan langsung pakai. Tidak ada pendaftaran sebelum grafik pertama muncul.",
  },
];

function Hero() {
  return (
    <section className="container-page pb-14 md:pb-20">
      <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
        <div>
          <Reveal as="h1" className="max-w-3xl text-[36px] leading-[1.12] md:text-[56px] md:leading-[1.08]">
            Geser satu titik, lihat rumusnya ikut berubah.
          </Reveal>
          <Reveal as="p" delay={80} className="mt-6 max-w-xl text-[19px] leading-[1.6] text-muted">
            1729 adalah kumpulan simulasi yang grafiknya bisa digeser dan diperbesar, dengan parameter yang bisa diubah
            seperti di GeoGebra dan Desmos. Coba yang di bawah ini dulu.
          </Reveal>
          <Reveal delay={160} className="mt-8 flex flex-wrap gap-3">
            <Button to="/simulasi">Buka semua simulasi</Button>
            <a href="#ruang-kerja" className="inline-flex min-h-12 items-center justify-center bg-tint px-[26px] text-base font-semibold text-ink transition-colors duration-150 hover:bg-ink hover:text-white">
              Coba grafiknya
            </a>
          </Reveal>
        </div>

        <Reveal delay={240} className="flex gap-10">
          <div>
            <p className="font-serif text-5xl font-bold leading-none text-ink">{SIMULATIONS.length}</p>
            <p className="mt-2 text-[15px] text-muted">simulasi</p>
          </div>
          <div>
            <p className="font-serif text-5xl font-bold leading-none text-ink">{TOPICS.length}</p>
            <p className="mt-2 text-[15px] text-muted">topik</p>
          </div>
        </Reveal>
      </div>

      <Reveal delay={160} className="mt-12 md:mt-14">
        <ParabolaWorkspace />
      </Reveal>
    </section>
  );
}

/** Kartu: putih dengan garis hitam tebal di atas. Saat disorot, seluruh area kartu terisi warna aksen dan garisnya memutih. */
function Catalog() {
  return (
    <section id="simulasi" className="container-page scroll-mt-6 pb-16 md:pb-24">
      <Reveal>
        <SectionHeading
          title="Pilih satu, mulai menggeser"
          action={
            <Link to="/simulasi" className="link hidden shrink-0 md:inline">
              Lihat semua {SIMULATIONS.length} simulasi
            </Link>
          }
        />
      </Reveal>

      <ul className="-mx-5 mt-3 grid md:-mx-9 md:grid-cols-2 lg:grid-cols-3">
        {FEATURED.map((s, i) => (
          <Reveal as="li" key={s.slug} delay={(i % 3) * 70} className="defer-paint">
            <article className="group relative h-full px-5 pb-8 pt-7 transition-colors duration-150 focus-within:bg-brand hover:bg-brand md:px-9 md:pt-9">
              <div aria-hidden="true" className="mb-[18px] h-1 bg-ink transition-colors duration-150 group-focus-within:bg-white group-hover:bg-white" />
              <p className="mb-4 overflow-hidden text-[1.9rem] leading-tight text-ink transition-colors duration-150 group-focus-within:text-white group-hover:text-white">
                <M t={s.glyph} />
              </p>
              <h3 className="mb-[14px] text-[26px] leading-[1.12] transition-colors duration-150 group-focus-within:text-white group-hover:text-white">
                <Link to={simulasiLink(s.slug)} className="after:absolute after:inset-0">
                  {s.title}
                </Link>
              </h3>
              <p className="mb-5 text-[17px] leading-[1.56] text-muted transition-colors duration-150 group-focus-within:text-white group-hover:text-white">
                {s.summary}
              </p>
              <p className="text-[15px] leading-[1.7] text-link transition-colors duration-150 group-focus-within:text-white group-hover:text-white">
                #{s.topic.toLowerCase()}
              </p>
            </article>
          </Reveal>
        ))}
      </ul>

      <Link to="/simulasi" className="link mt-6 inline-block md:hidden">
        Lihat semua {SIMULATIONS.length} simulasi
      </Link>
    </section>
  );
}

const simulasiLink = simulationPath;

function HowTo() {
  return (
    <section id="cara-pakai" className="container-page scroll-mt-6 pb-16 md:pb-24">
      <Reveal>
        <SectionHeading title="Dibuat untuk dipakai di depan kelas" />
      </Reveal>
      <Reveal as="p" delay={60} className="mt-5 max-w-xl text-[19px] leading-[1.6] text-muted">
        Setiap simulasi mengikuti satu aturan: yang penting ada di grafik, bukan di menu.
      </Reveal>

      <ol className="mt-10 grid gap-x-9 gap-y-10 sm:grid-cols-2">
        {STEPS.map((s, i) => (
          <Reveal as="li" key={s.title} delay={(i % 2) * 70}>
            <div aria-hidden="true" className="mb-[18px] h-1 bg-ink" />
            <p className="mb-2 text-[15px] font-medium text-link">{String(i + 1).padStart(2, "0")}</p>
            <h3 className="mb-2 text-[22px] leading-[1.2]">{s.title}</h3>
            <p className="max-w-md text-[17px] leading-[1.56] text-muted">{s.body}</p>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

function Closing() {
  return (
    <section className="container-page pb-16 md:pb-24">
      <Reveal className="relative overflow-hidden bg-brand px-7 pb-12 pt-9 md:px-14 md:pb-16 md:pt-12">

        <div className="relative max-w-lg">
          <div aria-hidden="true" className="mb-[18px] h-1 bg-white" />
          <h2 className="text-[30px] leading-[1.12] !text-white md:text-5xl">Coba satu simulasi sampai ketemu polanya.</h2>
          <p className="mt-5 max-w-md text-[19px] leading-[1.6] text-white">
            Tidak perlu daftar. Pilih topik, geser, lalu lihat apa yang berubah.
          </p>
          <Button to="/simulasi" variant="inverse" className="mt-8">
            Mulai dari daftar simulasi
          </Button>
        </div>

        {/* Kurva hiasan: di bawah teks pada layar sempit, di sisi kanan hanya mulai lg supaya tidak menimpa teks. */}
        <Reveal delay={300} className="draw pointer-events-none relative mt-10 h-32 w-full lg:absolute lg:inset-y-0 lg:right-0 lg:mt-0 lg:h-auto lg:w-[38%]">
          <svg aria-hidden="true" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid meet" className="size-full">
            <path d="M0 120 H400 M220 0 V240" fill="none" stroke="#ffffff" strokeOpacity={0.25} strokeWidth="1.5" pathLength={1} />
            <path d="M20 230 C 120 230, 150 20, 220 20 S 320 230, 400 230" fill="none" stroke="#ffffff" strokeWidth="3" pathLength={1} />
          </svg>
        </Reveal>
      </Reveal>
    </section>
  );
}

export function LandingPage() {
  return (
    <>
      <Hero />
      <Catalog />
      <HowTo />
      <Closing />
    </>
  );
}
