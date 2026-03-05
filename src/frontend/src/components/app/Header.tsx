import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { useState } from "react";
import { VideoSubmitModal } from "./VideoSubmitModal";

export function Header() {
  const [submitOpen, setSubmitOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-[oklch(0.08_0_0)] backdrop-blur-sm">
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

          {/* Nav actions */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <span className="hidden sm:block text-xs text-muted-foreground uppercase tracking-widest font-bold">
              Live • Breaking
            </span>
            <Button
              data-ocid="header.submit_button"
              onClick={() => setSubmitOpen(true)}
              className="bg-brand-red hover:bg-brand-red-light text-white font-bold uppercase tracking-wide text-xs px-4 h-8 rounded-sm transition-all duration-200 hover:shadow-red-glow-sm"
            >
              + Submit Video
            </Button>
          </motion.div>
        </div>

        {/* Red accent line */}
        <div className="h-0.5 w-full bg-gradient-to-r from-brand-red via-brand-red-light to-transparent" />
      </header>

      <VideoSubmitModal open={submitOpen} onOpenChange={setSubmitOpen} />
    </>
  );
}
