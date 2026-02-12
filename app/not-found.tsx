import Link from "next/link";

const NotFound = () => {
  return (
    <section className="relative h-[100dvh] w-screen overflow-hidden text-white">
      <div className="absolute inset-0 bg-black" />
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/404.png')" }}
      />
      <div className="absolute inset-0 bg-black/45" />

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-xs tracking-[0.35em] text-white/80">404</p>
        <h1 className="text-3xl font-semibold md:text-5xl">Page Not Found</h1>
        <p className="max-w-xl text-sm text-white/90 md:text-base">
          The page you requested could not be found.
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex rounded-full border border-white/60 px-5 py-2 text-sm font-medium transition hover:bg-white hover:text-black"
        >
          Back to Home
        </Link>
      </div>
    </section>
  );
};

export default NotFound;
