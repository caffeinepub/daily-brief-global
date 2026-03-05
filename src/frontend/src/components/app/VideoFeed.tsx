import { Skeleton } from "@/components/ui/skeleton";
import { useVideos } from "@/hooks/useQueries";
import type { UIVideo } from "@/hooks/useQueries";
import { Flame } from "lucide-react";
import { motion } from "motion/react";
import { VideoCard } from "./VideoCard";

interface VideoFeedProps {
  onVideoSelect: (video: UIVideo) => void;
}

function VideoCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-sm overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-3 mt-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
    </div>
  );
}

export function VideoFeed({ onVideoSelect }: VideoFeedProps) {
  const { data: videos, isLoading } = useVideos();

  return (
    <section className="py-6 px-4" aria-label="Video feed">
      {/* Section header */}
      <motion.div
        className="flex items-center gap-2 mb-4"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-1 h-5 bg-brand-red rounded-full" />
        <h2 className="font-display text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
          <Flame className="w-4 h-4 text-brand-red" />
          Latest Videos
        </h2>
        <div className="flex-1 h-px bg-border ml-2" />
        {videos && (
          <span className="text-xs text-muted-foreground font-bold">
            {videos.length} clips
          </span>
        )}
      </motion.div>

      {/* Grid */}
      {isLoading ? (
        <div
          data-ocid="video_feed.list"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
        >
          {["s1", "s2", "s3", "s4", "s5", "s6"].map((id) => (
            <VideoCardSkeleton key={id} />
          ))}
        </div>
      ) : !videos || videos.length === 0 ? (
        <div
          data-ocid="video_feed.list"
          className="flex flex-col items-center justify-center py-20 text-muted-foreground"
        >
          <Flame className="w-10 h-10 mb-3 opacity-20" />
          <p className="font-bold uppercase tracking-widest text-xs">
            No Videos Yet
          </p>
          <p className="text-xs mt-1 opacity-60">
            Be the first to submit a clip
          </p>
        </div>
      ) : (
        <div
          data-ocid="video_feed.list"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
        >
          {videos.map((video, index) => (
            <VideoCard
              key={String(video.id)}
              video={video}
              onClick={onVideoSelect}
              index={index}
            />
          ))}
        </div>
      )}
    </section>
  );
}
