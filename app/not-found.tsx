"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DEFAULT_LANG,
  getLangFromPath,
  type SiteLang,
} from "@/shared/lib/i18n";

const COPY: Record<
  SiteLang,
  { title: string; description: string; action: string }
> = {
  ja: {
    title: "ページが見つかりません",
    description: "んなページねえよ！",
    action: "ホームへ",
  },
  en: {
    title: "Page Not Found",
    description: "The page you requested could not be found.",
    action: "Back to Home",
  },
};

const NotFound = () => {
  const pathname = usePathname();
  const lang = getLangFromPath(pathname) ?? DEFAULT_LANG;
  const copy = COPY[lang];

  return (
    <section className="relative h-[100dvh] w-screen overflow-hidden text-white">
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="not-found-bg absolute left-1/2 top-1/2 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/404.png')" }}
        />
      </div>
      <div className="absolute inset-0 bg-black/45" />

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-xs tracking-[0.35em] text-white/80">404</p>
        <h1 className="text-3xl font-semibold md:text-5xl">{copy.title}</h1>
        <p className="max-w-xl text-sm text-white/90 md:text-base">
          {copy.description}
        </p>
        <Link
          href={`/${lang}`}
          className="mt-2 inline-flex rounded-full border border-white/60 px-5 py-2 text-sm font-medium transition hover:bg-white hover:text-black"
        >
          {copy.action}
        </Link>
      </div>
      <style jsx>{`
        .not-found-bg {
          width: 100%;
          height: 100%;
          transform: translate(-50%, -50%);
          transform-origin: center;
        }

        @media (orientation: portrait) {
          .not-found-bg {
            width: 100dvh;
            height: 100dvw;
            transform: translate(-50%, -50%) rotate(90deg);
          }
        }
      `}</style>
    </section>
  );
};

export default NotFound;
