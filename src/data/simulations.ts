/** Metadata simulasi untuk beranda dan katalog. Komponen simulasinya dibuat di tahap berikutnya. */
export interface SimulationMeta {
  slug: string;
  title: string;
  topic: "Aljabar" | "Geometri" | "Trigonometri" | "Kalkulus" | "Fungsi";
  /** Sumber LaTeX untuk simbol besar di kartu. */
  glyph: string;
  summary: string;
  featured?: boolean;
}

export const SIMULATIONS: readonly SimulationMeta[] = [
  { slug: "plotter-grafik", title: "Plotter Grafik", topic: "Fungsi", glyph: "f(x)", featured: true,
    summary: "Ketik fungsi, lihat kurvanya. Tambahkan beberapa fungsi sekaligus dan bandingkan." },
  { slug: "fungsi-kuadrat", title: "Fungsi Kuadrat", topic: "Aljabar", glyph: "ax^2", featured: true,
    summary: "Ubah koefisien parabola dan amati puncak, sumbu simetri, serta akar-akarnya." },
  { slug: "turunan", title: "Turunan", topic: "Kalkulus", glyph: "f'(x)", featured: true,
    summary: "Gerakkan satu titik di kurva dan lihat garis singgung serta kemiringannya." },
  { slug: "integral", title: "Integral", topic: "Kalkulus", glyph: "\\int_a^b", featured: true,
    summary: "Atur batas bawah dan atas, lalu lihat luas daerah di bawah kurva terisi." },
  { slug: "trigonometri", title: "Trigonometri", topic: "Trigonometri", glyph: "\\sin\\theta", featured: true,
    summary: "Putar titik pada lingkaran satuan dan baca nilai sinus, kosinus, dan tangen." },
  { slug: "bangun-ruang-sisi-datar", title: "Bangun Ruang Sisi Datar", topic: "Geometri", glyph: "V=\\frac{1}{3}Lt", featured: true,
    summary: "Putar kubus, prisma, dan limas. Buka jaring-jaringnya dan lihat volumenya terbentuk." },
  { slug: "sistem-linear", title: "Sistem Linear", topic: "Aljabar", glyph: "y=mx+c",
    summary: "Geser dua garis sampai berpotongan. Titik potongnya adalah solusi sistem." },
  { slug: "transformasi-fungsi", title: "Transformasi Fungsi", topic: "Fungsi", glyph: "f(x-a)+b",
    summary: "Geser, regangkan, dan cerminkan grafik fungsi lalu bandingkan dengan aslinya." },
  { slug: "irisan-kerucut", title: "Irisan Kerucut", topic: "Geometri", glyph: "\\frac{x^2}{a^2}+\\frac{y^2}{b^2}=1",
    summary: "Elips, parabola, dan hiperbola dari fokus dan eksentrisitas yang bisa diubah." },
  { slug: "transformasi-geometri", title: "Transformasi Geometri", topic: "Geometri", glyph: "\\begin{pmatrix}x'\\\\y'\\end{pmatrix}",
    summary: "Translasi, rotasi, refleksi, dan dilatasi pada bangun di bidang koordinat." },
  { slug: "vektor", title: "Vektor", topic: "Geometri", glyph: "\\vec{a}\\cdot\\vec{b}",
    summary: "Geser ujung dua vektor, lihat jumlah, sudut, proyeksi, dan hasil kali titik." },
  { slug: "sektor-lingkaran", title: "Sektor Lingkaran", topic: "Geometri", glyph: "\\tfrac{\\theta}{360^\\circ}\\pi r^2",
    summary: "Ubah jari-jari dan sudut pusat, baca panjang busur dan luas juring." },
  { slug: "titik-istimewa-segitiga", title: "Titik Istimewa Segitiga", topic: "Geometri", glyph: "G,\\ I,\\ O,\\ H",
    summary: "Tarik titik sudut segitiga dan lihat titik berat, pusat lingkaran dalam, dan lainnya bergerak." },
  { slug: "teorema-pythagoras", title: "Teorema Pythagoras", topic: "Geometri", glyph: "a^2+b^2=c^2",
    summary: "Ubah sisi siku-siku dan lihat luas dua persegi kecil menyamai persegi besar." },
  { slug: "garis-singgung-dua-lingkaran", title: "Garis Singgung Dua Lingkaran", topic: "Geometri", glyph: "d^2-(r_1\\pm r_2)^2",
    summary: "Geser dua lingkaran dan amati garis singgung persekutuan dalam dan luar." },
];

export const TOPICS = [...new Set(SIMULATIONS.map((s) => s.topic))];
export const FEATURED = SIMULATIONS.filter((s) => s.featured);
export const simulationPath = (slug: string) => `/simulasi/${slug}`;
