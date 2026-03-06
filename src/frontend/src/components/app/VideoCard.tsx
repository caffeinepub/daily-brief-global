import type { UIVideo } from "@/hooks/useQueries";
import { formatCount } from "@/utils/format";
import { Eye, MessageCircle, Play } from "lucide-react";
import { motion } from "motion/react";

interface VideoCardProps {
  video: UIVideo;
  onClick: (video: UIVideo) => void;
  index: number;
}

/** Extract a short "tag" prefix from a title — uppercase words before a space or dash */
function extractTag(title: string): { tag: string; rest: string } | null {
  // Match an ALL-CAPS word or short phrase at the start (max 4 words, before a space+lowercase)
  const match = title.match(/^([A-Z0-9][A-Z0-9 '*.!?]{0,39}?)\s+([A-Z][a-z])/);
  if (match) {
    return {
      tag: match[1].trim(),
      rest: title.slice(match[1].trim().length).trim(),
    };
  }
  // Fallback: check if whole title is upper case — split at 3rd word
  const words = title.split(" ");
  if (words.length >= 4 && title === title.toUpperCase()) {
    return { tag: words.slice(0, 2).join(" "), rest: words.slice(2).join(" ") };
  }
  return null;
}

export function VideoCard({ video, onClick, index }: VideoCardProps) {
  const ocidIndex = index + 1;
  const parsed = extractTag(video.title);

  return (
    <motion.button
      type="button"
      data-ocid={`video_feed.item.${ocidIndex}`}
      className="group flex gap-3 w-full cursor-pointer text-left bg-transparent border-0 p-0 border-b border-border/50 py-4 last:border-0"
      onClick={() => onClick(video)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.35) }}
      aria-label={`Play: ${video.title}`}
    >
      {/* Thumbnail — fixed width, 16:9 */}
      <div className="relative shrink-0 w-[140px] sm:w-[180px] aspect-video overflow-hidden bg-muted rounded-sm">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300" />
        {/* Play icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
          <div className="w-8 h-8 rounded-full bg-brand-red/90 flex items-center justify-center">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
        </div>
        {/* Platform badge */}
        <div className="absolute top-1.5 right-1.5">
          <span className="bg-black/70 text-white text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded-sm">
            {video.platform}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        {/* Title with optional colored tag prefix */}
        <div>
          {parsed ? (
            <h3 className="font-display font-bold text-sm leading-snug mb-1.5">
              <span className="text-brand-red uppercase">{parsed.tag} </span>
              <span className="text-foreground uppercase group-hover:text-white transition-colors duration-200">
                {parsed.rest}
              </span>
            </h3>
          ) : (
            <h3 className="font-display font-bold text-sm text-foreground uppercase leading-snug mb-1.5 group-hover:text-white transition-colors duration-200 line-clamp-3">
              {video.title}
            </h3>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-muted-foreground text-xs mt-1">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span className="font-bold">{formatCount(video.viewCount)}</span>
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </motion.button>
  );
}
