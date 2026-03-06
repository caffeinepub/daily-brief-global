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
    <div className="flex gap-3 border-b border-border/50 py-4">
      <Skeleton className="shrink-0 w-[140px] sm:w-[180px] aspect-video rounded-sm" />
      <div className="flex-1 space-y-2 py-0.5">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-3 mt-3">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
    </div>
  );
}

export function VideoFeed({ onVideoSelect }: VideoFeedProps) {
  const { data: videos, isLoading } = useVideos();

  // Get today's date label
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="py-5 px-4" aria-label="Video feed">
      {/* Section header — WSHH style: "TODAY'S VIDEOS" left, count right */}
      <motion.div
        className="flex items-baseline justify-between mb-1 border-b border-border pb-3"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="font-display text-lg font-black uppercase tracking-tight text-foreground">
          TODAY'S <span className="text-brand-red">VIDEOS</span>
        </h2>
        {videos && (
          <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
            {videos.length} {videos.length === 1 ? "video" : "videos"}
          </span>
        )}
      </motion.div>

      {/* Date sub-label */}
      <p className="text-xs text-muted-foreground/50 font-bold uppercase tracking-widest mb-4">
        {today}
      </p>

      {/* List */}
      {isLoading ? (
        <div data-ocid="video_feed.list" className="flex flex-col">
          {["s1", "s2", "s3", "s4"].map((id) => (
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
        <div data-ocid="video_feed.list" className="flex flex-col">
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
