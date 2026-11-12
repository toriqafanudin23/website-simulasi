import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { LandingPage } from "./pages/LandingPage";

// Halaman selain beranda dimuat saat dibutuhkan.
const PlaceholderPage = lazy(() => import("./pages/PlaceholderPage"));

const QuadraticSimulation = lazy(() => import("./simulations/quadratic/QuadraticSimulation"));
const DerivativeSimulation = lazy(() => import("./simulations/derivative/DerivativeSimulation"));

const page = (kind: "katalog" | "simulasi" | "tentang" | "404") => (
  <Suspense fallback={null}>
    <PlaceholderPage kind={kind} />
  </Suspense>
);

export function App() {
  return (
    <Routes>
      {/* Halaman simulasi memakai layar penuh sendiri, tanpa kepala dan kaki halaman situs. */}
      <Route
        path="simulasi/fungsi-kuadrat"
        element={
          <Suspense fallback={<div className="h-dvh bg-white" />}>
            <QuadraticSimulation />
          </Suspense>
        }
      />
      <Route
        path="simulasi/turunan"
        element={
          <Suspense fallback={<div className="h-dvh bg-white" />}>
            <DerivativeSimulation />
          </Suspense>
        }
      />
      <Route element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="simulasi" element={page("katalog")} />
        <Route path="simulasi/:slug" element={page("simulasi")} />
        <Route path="tentang" element={page("tentang")} />
        <Route path="*" element={page("404")} />
      </Route>
    </Routes>
  );
}
