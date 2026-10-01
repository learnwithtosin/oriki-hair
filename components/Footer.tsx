"use client";

import { WHATSAPP_NUMBER } from "@/lib/whatsapp";
import { useShop } from "@/store/shop";

export function Footer() {
  const demo = useShop((s) => s.demo);
  const setDemo = useShop((s) => s.setDemo);

  return (
    <footer id="contact" className="scroll-mt-14 bg-espresso text-paper md:scroll-mt-[72px]">
      <div className="mx-auto max-w-[1440px] px-5 pb-8 pt-16 md:px-10 md:pt-24">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="font-display text-[clamp(2.25rem,8vw,3.25rem)] leading-[1.02] tracking-[-0.02em] md:text-[clamp(2.5rem,3.6vw,3.5rem)]">
              Every unit is named for a praise, because what you wear on your head should say
              something <span className="italic text-gold">kind</span> about you.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-[14px] md:col-span-5 md:col-start-8 md:pt-3">
            <div>
              <p className="eyebrow text-paper/45">Visit</p>
              <p className="mt-4 leading-relaxed text-paper/80">
                Studio fittings by appointment,
                <br />
                Lekki Phase 1, Lagos.
              </p>
            </div>
            <div>
              <p className="eyebrow text-paper/45">Talk to us</p>
              <ul className="mt-4 space-y-2">
                <li>
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-paper/80 underline decoration-paper/20 underline-offset-4 transition-colors hover:text-paper hover:decoration-paper"
                  >
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    aria-label="Instagram (coming soon)"
                    className="text-paper/80 underline decoration-paper/20 underline-offset-4 transition-colors hover:text-paper hover:decoration-paper"
                  >
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
            <div className="col-span-2 border-t border-paper/15 pt-6">
              <p className="eyebrow text-paper/45">Delivery</p>
              <p className="mt-4 text-paper/80">Lagos, Abuja, Port Harcourt, nationwide dispatch.</p>
            </div>
          </div>
        </div>

        <p
          aria-hidden="true"
          className="mt-20 select-none font-display text-[38vw] leading-[0.72] tracking-[-0.05em] text-paper/[0.06] md:mt-28 md:text-[30vw]"
        >
          oriki
        </p>

        <div className="mt-6 flex flex-col gap-3 border-t border-paper/15 pt-6 text-[12px] text-paper/45 md:flex-row md:items-center md:justify-between">
          <p>
            © 2026 Oriki Hair · Concept design — Oriki is a fictional brand. ·{" "}
            <a
              href="/wigs/CREDITS.md"
              className="underline decoration-paper/20 underline-offset-4 transition-colors hover:text-paper/80"
            >
              Photos: Pexels
            </a>
          </p>
          <div className="flex items-center gap-6">
            <p>Prices in naira, VAT included.</p>
            <button
              type="button"
              onClick={() => setDemo(!demo)}
              aria-pressed={demo}
              title="Demo mode (D)"
              className="text-[10px] uppercase tracking-[0.2em] text-paper/20 transition-colors hover:text-paper/70"
            >
              demo
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
