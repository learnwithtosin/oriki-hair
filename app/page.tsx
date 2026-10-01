import { Care } from "@/components/Care";
import { CartDrawer } from "@/components/CartDrawer";
import { Collection } from "@/components/Collection";
import { DemoMode } from "@/components/DemoMode";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Nav } from "@/components/Nav";
import { Providers } from "@/components/Providers";

export default function Home() {
  return (
    <Providers>
      <Nav />
      <main>
        <Hero />
        <Collection />
        <Care />
      </main>
      <Footer />
      <CartDrawer />
      <DemoMode />
      <div className="grain" aria-hidden="true" />
    </Providers>
  );
}
