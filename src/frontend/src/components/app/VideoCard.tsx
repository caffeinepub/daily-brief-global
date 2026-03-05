import type { UIVideo } from "@/hooks/useQueries";
import { formatCount } from "@/utils/format";
import { Eye, Heart, MessageCircle, Play } from "lucide-react";
import { motion } from "motion/react";

interface VideoCardProps {
  video: UIVideo;
  onClick: (video: UIVideo) => void;
  index: number;
}

export function VideoCard({ video, onClick, index }: VideoCardProps) {
  const ocidIndex = index + 1;

  return (
    <motion.button
      type="button"
      data-ocid={`video_feed.item.${ocidIndex}`}
      className="group relative bg-card border border-border rounded-sm overflow-hidden cursor-pointer card-hover text-left w-full"
      onClick={() => onClick(video)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4) }}
      aria-label={`Play: ${video.title}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-10 h-10 rounded-full bg-brand-red/90 flex items-center justify-center shadow-red-glow-sm">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Platform badge */}
        <div className="absolute top-2 right-2">
          <span className="bg-black/70 text-white text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm">
            {video.platform}
          </span>
        </div>

        {/* Red left border accent */}
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-red opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>

      {/* Card content */}
      <div className="p-3">
        <h3 className="font-display font-bold text-sm text-foreground line-clamp-2 uppercase leading-snug mb-2 group-hover:text-brand-red-light transition-colors duration-200">
          {video.title}
        </h3>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-muted-foreground text-xs">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span className="font-bold">{formatCount(video.viewCount)}</span>
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-brand-red/70" />
            <span className="font-bold">{formatCount(video.likeCount)}</span>
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <MessageCircle className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </motion.button>
  );
}
