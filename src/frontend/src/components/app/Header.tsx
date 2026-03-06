import { Button } from "@/components/ui/button";
import { Menu, Search } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { VideoSubmitModal } from "./VideoSubmitModal";

export function Header() {
  const [submitOpen, setSubmitOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-[oklch(0.08_0_0)]">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          {/* Logo */}
          <motion.button
            type="button"
            className="flex items-center gap-2 cursor-pointer bg-transparent border-0 p-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Daily Brief Global - scroll to top"
          >
            <div className="flex items-baseline gap-1">
              <span className="font-display text-xl font-black uppercase tracking-tighter text-brand-red leading-none">
                Daily Brief
              </span>
              <span className="font-display text-xl font-black uppercase tracking-tighter text-foreground leading-none">
                Global
              </span>
            </div>
          </motion.button>

          {/* Right nav — matches WSHH: Submit button + hamburger */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Button
              data-ocid="header.submit_button"
              onClick={() => setSubmitOpen(true)}
              className="bg-brand-red hover:bg-brand-red-light text-white font-black uppercase tracking-wide text-xs px-4 h-9 rounded-sm transition-all duration-200 hover:shadow-red-glow-sm flex items-center gap-1.5"
            >
              <span className="text-base leading-none font-black">+</span>
              Submit Video
            </Button>
            <button
              type="button"
              data-ocid="header.menu_button"
              onClick={() => setMenuOpen((p) => !p)}
              className="flex items-center justify-center w-9 h-9 text-foreground hover:text-brand-red transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </motion.div>
        </div>

        {/* DISCOVER nav bar — below header row */}
        <div className="border-t border-border/50 bg-[oklch(0.07_0_0)]">
          <div className="container mx-auto px-4 flex items-center justify-between h-9">
            <nav className="flex items-center gap-5">
              <button
                type="button"
                data-ocid="header.discover_link"
                className="font-display text-xs font-black uppercase tracking-[0.15em] text-foreground hover:text-brand-red transition-colors duration-200"
                onClick={() =>
                  window.scrollTo({ top: 400, behavior: "smooth" })
                }
              >
                Discover
              </button>
              <span className="text-border">|</span>
              <button
                type="button"
                data-ocid="header.trending_link"
                className="font-display text-xs font-black uppercase tracking-[0.15em] text-muted-foreground hover:text-brand-red transition-colors duration-200"
                onClick={() =>
                  window.scrollTo({ top: 400, behavior: "smooth" })
                }
              >
                Trending
              </button>
            </nav>
            <button
              type="button"
              data-ocid="header.search_button"
              className="flex items-center justify-center w-7 h-7 text-muted-foreground hover:text-brand-red transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="absolute top-full left-0 right-0 bg-[oklch(0.1_0_0)] border-b border-border shadow-lg z-50">
            <div className="container mx-auto px-4 py-3 flex flex-col gap-2">
              <button
                type="button"
                className="text-left font-display text-xs font-black uppercase tracking-[0.15em] text-foreground hover:text-brand-red transition-colors py-1.5"
                onClick={() => {
                  setMenuOpen(false);
                  window.scrollTo({ top: 400, behavior: "smooth" });
                }}
              >
                Discover
              </button>
              <button
                type="button"
                className="text-left font-display text-xs font-black uppercase tracking-[0.15em] text-muted-foreground hover:text-brand-red transition-colors py-1.5"
                onClick={() => {
                  setMenuOpen(false);
                  window.scrollTo({ top: 400, behavior: "smooth" });
                }}
              >
                Trending
              </button>
              <button
                type="button"
                className="text-left font-display text-xs font-black uppercase tracking-[0.15em] text-muted-foreground hover:text-brand-red transition-colors py-1.5"
                onClick={() => {
                  setSubmitOpen(true);
                  setMenuOpen(false);
                }}
              >
                Submit Video
              </button>
            </div>
          </div>
        )}
      </header>

      <VideoSubmitModal open={submitOpen} onOpenChange={setSubmitOpen} />
    </>
  );
}
