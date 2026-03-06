import { Skeleton } from "@/components/ui/skeleton";
import { useFeaturedVideo } from "@/hooks/useQueries";
import type { UIVideo } from "@/hooks/useQueries";
import { formatCount } from "@/utils/format";
import { Eye, Heart, Play } from "lucide-react";
import { motion } from "motion/react";

interface HeroSectionProps {
  onVideoSelect: (video: UIVideo) => void;
}

// Decorative dot pagination — static (WSHH style, 7 dots, first active)
function HeroDots({
  total = 7,
  active = 0,
}: { total?: number; active?: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-2">
      {Array.from({ length: total }, (_, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: decorative dots with stable order
          key={i}
          className={`rounded-full transition-all duration-200 ${
            i === active ? "w-2.5 h-2.5 bg-white" : "w-2 h-2 bg-white/30"
          }`}
        />
      ))}
    </div>
  );
}

export function HeroSection({ onVideoSelect }: HeroSectionProps) {
  const { data: featured, isLoading } = useFeaturedVideo();

  if (isLoading) {
    return (
      <section
        data-ocid="hero.section"
        className="relative w-full bg-card"
        aria-label="Featured video"
      >
        <Skeleton className="w-full aspect-[16/7] md:aspect-[21/9]" />
        <div className="bg-[oklch(0.08_0_0)] py-1">
          <HeroDots />
        </div>
      </section>
    );
  }

  if (!featured) {
    return (
      <section
        data-ocid="hero.section"
        className="relative w-full aspect-[16/7] md:aspect-[21/9] bg-card flex items-center justify-center border-b border-border"
        aria-label="Featured video"
      >
        <div className="text-center text-muted-foreground">
          <Play className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="font-bold uppercase tracking-widest text-xs">
            No Featured Video Yet
          </p>
        </div>
      </section>
    );
  }

  return (
    <section data-ocid="hero.section" className="w-full border-b border-border">
      <button
        type="button"
        className="relative w-full cursor-pointer group overflow-hidden block text-left"
        onClick={() => onVideoSelect(featured)}
        aria-label={`Featured: ${featured.title}`}
      >
        {/* Thumbnail */}
        <div className="relative w-full aspect-[16/7] md:aspect-[21/9] overflow-hidden">
          <img
            src={featured.thumbnailUrl}
            alt={featured.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="eager"
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.05_0_0)] via-[oklch(0.05_0_0/0.25)] to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.05_0_0/0.55)] to-transparent" />

          {/* Play button overlay */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            whileHover={{ scale: 1.04 }}
          >
            <div className="w-16 h-16 rounded-full bg-brand-red/90 flex items-center justify-center shadow-red-glow opacity-0 group-hover:opacity-100 transition-all duration-300">
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            </div>
          </motion.div>

          {/* Author / source row (top-left) — mimics WSHH user + time */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="bg-black/60 text-white/80 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-red inline-block" />
              {featured.platform}
            </span>
          </div>

          {/* Title + stats overlay — bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
            <motion.h2
              className="font-display text-xl md:text-3xl lg:text-4xl font-black text-white uppercase tracking-tight leading-tight mb-2 drop-shadow-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {featured.title}
            </motion.h2>

            <div className="flex items-center gap-4 text-white/80 text-sm">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span className="font-bold">
                  {formatCount(featured.viewCount)}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-brand-red" />
                <span className="font-bold">
                  {formatCount(featured.likeCount)}
                </span>
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Dot pagination — decorative, WSHH style */}
      <div className="bg-[oklch(0.08_0_0)]">
        <HeroDots total={7} active={0} />
      </div>
    </section>
  );
}
