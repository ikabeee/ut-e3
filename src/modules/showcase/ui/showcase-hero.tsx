import Link from "next/link";
import { EVENT_INFO } from "../domain/event-info";

export function ShowcaseHero() {
  return (
    <section className="flex flex-col items-start gap-6 py-20">
      <span className="rounded-full border border-black/10 px-3 py-1 text-xs uppercase tracking-widest dark:border-white/20">
        {EVENT_INFO.date} · {EVENT_INFO.location}
      </span>
      <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">{EVENT_INFO.name}</h1>
      <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">{EVENT_INFO.tagline}</p>
      <div className="flex gap-3">
        <Link href="/games" className="rounded-full bg-foreground px-5 py-2 text-background">
          Ver videojuegos
        </Link>
        <Link
          href="/teams"
          className="rounded-full border border-black/10 px-5 py-2 dark:border-white/20"
        >
          Conocer equipos
        </Link>
      </div>
    </section>
  );
}
