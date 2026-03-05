import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { UIVideo } from "@/hooks/useQueries";
import {
  useAddComment,
  useComments,
  useIncrementViewCount,
  useLikeVideo,
} from "@/hooks/useQueries";
import { formatCount, formatTimestamp } from "@/utils/format";
import {
  Clock,
  ExternalLink,
  Eye,
  Heart,
  Loader2,
  MessageCircle,
  Send,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useEffect } from "react";
import { toast } from "sonner";

interface VideoPlayerProps {
  video: UIVideo | null;
  onClose: () => void;
}

function extractInstagramShortcode(url: string): string | null {
  try {
    const u = new URL(url);
    // Matches /p/{shortcode}/ or /reel/{shortcode}/
    const match = u.pathname.match(/\/(p|reel|tv)\/([^/]+)/);
    return match ? match[2] : null;
  } catch {
    return null;
  }
}

export function VideoPlayer({ video, onClose }: VideoPlayerProps) {
  const [commentText, setCommentText] = useState("");
  const { data: comments, isLoading: commentsLoading } = useComments(
    video?.id ?? null,
  );
  const likeVideo = useLikeVideo();
  const addComment = useAddComment();
  const incrementViews = useIncrementViewCount();

  const videoId = video?.id ?? null;
  const incrementViewsMutate = incrementViews.mutate;

  // Lock body scroll when player is open
  useEffect(() => {
    if (video) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [video]);

  // Increment view count when video opens
  useEffect(() => {
    if (videoId !== null && videoId > 0n) {
      incrementViewsMutate(videoId);
    }
  }, [videoId, incrementViewsMutate]);

  const handleLike = () => {
    if (!video || video.id < 0n) {
      toast.error("Connect your wallet to like videos");
      return;
    }
    likeVideo.mutate(video.id, {
      onSuccess: () => toast.success("Liked!"),
      onError: () => toast.error("Failed to like"),
    });
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!video || video.id < 0n) {
      toast.error("Connect your wallet to comment");
      return;
    }
    addComment.mutate(
      { videoId: video.id, text: commentText.trim() },
      {
        onSuccess: () => {
          setCommentText("");
          toast.success("Comment posted!");
        },
        onError: () => toast.error("Failed to post comment"),
      },
    );
  };

  return (
    <AnimatePresence>
      {video && (
        <motion.section
          data-ocid="video_player.section"
          className="fixed inset-0 z-50 bg-[oklch(0.06_0_0)] overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-label={`Now playing: ${video.title}`}
        >
          <motion.div
            className="max-w-5xl mx-auto pb-20"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            {/* Top bar */}
            <div className="sticky top-0 z-10 bg-[oklch(0.06_0_0)] border-b border-border flex items-center justify-between px-4 h-12">
              <span className="font-display text-xs font-black uppercase tracking-widest text-brand-red flex items-center gap-2">
                ▶ Now Playing
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 hover:bg-brand-red hover:text-white transition-colors"
                aria-label="Close player"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Video embed */}
            <div className="w-full bg-black">
              {video.platform === "instagram" ? (
                (() => {
                  const shortcode = extractInstagramShortcode(video.url);
                  return shortcode ? (
                    <div className="w-full flex justify-center bg-[oklch(0.06_0_0)] py-2">
                      <div
                        className="w-full max-w-sm"
                        style={{ height: "500px", maxHeight: "60vh" }}
                      >
                        <iframe
                          src={`https://www.instagram.com/p/${shortcode}/embed/`}
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          scrolling="no"
                          allow="autoplay; encrypted-media"
                          allowFullScreen
                          title={video.title}
                          className="w-full h-full"
                          style={{ overflow: "hidden" }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video flex flex-col items-center justify-center bg-gradient-to-br from-[oklch(0.15_0_0)] to-[oklch(0.1_0_0)] gap-4 relative">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover absolute inset-0 opacity-30"
                      />
                      <div className="relative z-10 text-center">
                        <p className="text-muted-foreground text-sm mb-3 uppercase tracking-widest font-bold">
                          Instagram Video
                        </p>
                        <Button
                          onClick={() => window.open(video.url, "_blank")}
                          className="bg-brand-red hover:bg-brand-red-light text-white font-bold uppercase tracking-wide flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Watch on Instagram
                        </Button>
                      </div>
                    </div>
                  );
                })()
              ) : video.platform === "youtube" ? (
                <div className="aspect-video flex flex-col items-center justify-center bg-gradient-to-br from-[oklch(0.15_0_0)] to-[oklch(0.1_0_0)] gap-4 relative">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover absolute inset-0 opacity-40"
                  />
                  <div className="relative z-10 text-center">
                    <p className="text-muted-foreground text-sm mb-3 uppercase tracking-widest font-bold">
                      YouTube Video
                    </p>
                    <Button
                      onClick={() => window.open(video.url, "_blank")}
                      className="bg-brand-red hover:bg-brand-red-light text-white font-bold uppercase tracking-wide flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Watch on YouTube
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center bg-muted">
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-red flex items-center gap-2 font-bold"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Watch Video
                  </a>
                </div>
              )}
            </div>

            {/* Video info */}
            <div className="px-4 pt-4 border-b border-border pb-4">
              <h1 className="font-display text-lg md:text-2xl font-black uppercase text-foreground leading-tight mb-3">
                {video.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4">
                {/* Stats */}
                <div className="flex items-center gap-4 text-muted-foreground text-sm">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    <span className="font-bold">
                      {formatCount(video.viewCount)}
                    </span>
                    <span className="text-xs">views</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-brand-red" />
                    <span className="font-bold">
                      {formatCount(video.likeCount)}
                    </span>
                    <span className="text-xs">likes</span>
                  </span>
                </div>

                {/* Like button */}
                <Button
                  data-ocid="video_player.like_button"
                  onClick={handleLike}
                  disabled={likeVideo.isPending}
                  variant="outline"
                  className="ml-auto border-brand-red/50 text-brand-red hover:bg-brand-red hover:text-white hover:border-brand-red transition-all duration-200 font-bold uppercase tracking-wide text-xs h-8"
                >
                  {likeVideo.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Heart className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Like
                </Button>
              </div>
            </div>

            {/* Comments section */}
            <div className="px-4 pt-4">
              {/* Comment header */}
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="w-4 h-4 text-brand-red" />
                <h2 className="font-display text-xs font-black uppercase tracking-widest">
                  Comments{" "}
                  {comments && comments.length > 0 && `(${comments.length})`}
                </h2>
                <div className="flex-1 h-px bg-border ml-1" />
              </div>

              {/* Add comment */}
              <form onSubmit={handleComment} className="flex gap-2 mb-5">
                <Input
                  data-ocid="video_player.comment_input"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Drop a comment..."
                  className="flex-1 bg-muted border-border text-sm font-medium placeholder:text-muted-foreground/50 focus-visible:ring-brand-red focus-visible:border-brand-red"
                  maxLength={500}
                />
                <Button
                  data-ocid="video_player.submit_button"
                  type="submit"
                  disabled={!commentText.trim() || addComment.isPending}
                  className="bg-brand-red hover:bg-brand-red-light text-white font-bold h-9 px-3"
                >
                  {addComment.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>

              {/* Comments list */}
              {commentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !comments || comments.length === 0 ? (
                <div
                  data-ocid="comments.empty_state"
                  className="flex flex-col items-center justify-center py-10 text-muted-foreground"
                >
                  <MessageCircle className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">
                    No comments yet
                  </p>
                  <p className="text-xs opacity-50 mt-1">
                    Be the first to comment
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <motion.div
                      key={String(comment.id)}
                      className="flex gap-3 py-3 border-b border-border/50 last:border-0"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {/* Avatar */}
                      <div className="w-7 h-7 rounded-full bg-brand-red/20 border border-brand-red/30 flex items-center justify-center shrink-0 text-xs font-black text-brand-red">
                        A
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-foreground">
                            Anonymous
                          </span>
                          <span className="flex items-center gap-0.5 text-muted-foreground text-xs">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(comment.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90 leading-relaxed break-words">
                          {comment.text}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
