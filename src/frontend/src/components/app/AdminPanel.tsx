import { AdminAddVideoModal } from "@/components/app/AdminAddVideoModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import {
  type UIVideo,
  useApproveVideo,
  useGetPendingVideos,
  useInitializeAdmin,
  useIsAdmin,
} from "@/hooks/useQueries";
import { useRejectVideo } from "@/hooks/useQueries";
import { formatCount } from "@/utils/format";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  Heart,
  Loader2,
  LogIn,
  PlusCircle,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDate(timestamp: bigint): string {
  // Motoko timestamps are in nanoseconds
  const ms = Number(timestamp / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateUrl(url: string, maxLen = 48): string {
  if (url.length <= maxLen) return url;
  return `${url.slice(0, maxLen)}…`;
}

// ── Pending Video Card ────────────────────────────────────────────────────────

interface PendingVideoCardProps {
  video: UIVideo;
  index: number;
}

function PendingVideoCard({ video, index }: PendingVideoCardProps) {
  const approveVideo = useApproveVideo();
  const rejectVideo = useRejectVideo();
  const ocidIndex = index + 1;

  const isMock = "isMock" in video && video.isMock;

  const handleApprove = () => {
    if (isMock) return;
    approveVideo.mutate(video.id, {
      onSuccess: () => {
        toast.success(`"${video.title}" approved and published.`);
      },
      onError: (err) => {
        const msg = err instanceof Error ? err.message : "Approve failed";
        toast.error(msg);
      },
    });
  };

  const handleReject = () => {
    if (isMock) return;
    rejectVideo.mutate(video.id, {
      onSuccess: () => {
        toast.success(`"${video.title}" has been rejected.`);
      },
      onError: (err) => {
        const msg = err instanceof Error ? err.message : "Reject failed";
        toast.error(msg);
      },
    });
  };

  const isApproving = approveVideo.isPending;
  const isRejecting = rejectVideo.isPending;
  const isBusy = isApproving || isRejecting;

  return (
    <motion.div
      data-ocid={`admin.pending.item.${ocidIndex}`}
      className="bg-card border border-border rounded-sm overflow-hidden flex flex-col sm:flex-row gap-0"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
    >
      {/* Thumbnail */}
      <div className="relative sm:w-44 sm:flex-shrink-0 aspect-video sm:aspect-auto bg-muted overflow-hidden">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-2 left-2">
          <Badge
            variant="outline"
            className="bg-black/70 border-0 text-white text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
          >
            {video.platform}
          </Badge>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent sm:hidden" />
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col gap-3 min-w-0">
        {/* Title */}
        <h3 className="font-display font-black text-sm text-foreground uppercase leading-tight line-clamp-2">
          {video.title}
        </h3>

        {/* URL */}
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-brand-red hover:text-brand-red-light font-mono truncate block transition-colors"
          title={video.url}
        >
          {truncateUrl(video.url)}
        </a>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {"submittedAt" in video && typeof video.submittedAt === "bigint"
              ? formatDate(video.submittedAt)
              : "Unknown date"}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {formatCount(video.viewCount)}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3 text-brand-red/70" />
            {formatCount(video.likeCount)}
          </span>
          <Badge
            variant="outline"
            className="border-yellow-500/40 text-yellow-400 bg-yellow-500/10 text-[10px] uppercase tracking-wider font-bold ml-auto"
          >
            Pending Review
          </Badge>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          <Button
            data-ocid={`admin.pending.approve_button.${ocidIndex}`}
            size="sm"
            disabled={isBusy}
            onClick={handleApprove}
            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wide text-xs h-8 rounded-sm transition-all duration-200 disabled:opacity-40"
          >
            {isApproving ? (
              <>
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Approve
              </>
            )}
          </Button>
          <Button
            data-ocid={`admin.pending.reject_button.${ocidIndex}`}
            size="sm"
            disabled={isBusy}
            onClick={handleReject}
            variant="outline"
            className="flex-1 sm:flex-none border-red-600/60 text-red-400 hover:bg-red-600/10 hover:text-red-300 hover:border-red-500 font-bold uppercase tracking-wide text-xs h-8 rounded-sm transition-all duration-200 disabled:opacity-40"
          >
            {isRejecting ? (
              <>
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                Reject
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Loading skeletons ─────────────────────────────────────────────────────────

function PendingVideoSkeleton({ index }: { index: number }) {
  return (
    <div
      data-ocid="admin.pending.loading_state"
      className="bg-card border border-border rounded-sm overflow-hidden flex flex-col sm:flex-row"
      style={{ opacity: 1 - index * 0.15 }}
    >
      <Skeleton className="sm:w-44 aspect-video sm:aspect-auto" />
      <div className="flex-1 p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  );
}

// ── Not-admin gate ────────────────────────────────────────────────────────────

function NotAdminGate() {
  const { login, isLoggingIn, identity } = useInternetIdentity();
  const initializeAdmin = useInitializeAdmin();
  const queryClient = useQueryClient();
  const [isAutoClaimPending, setIsAutoClaimPending] = useState(false);
  const [claimError, setClaimError] = useState("");

  // Auto-claim admin access whenever identity becomes available
  useEffect(() => {
    if (!identity) return;

    setClaimError("");
    setIsAutoClaimPending(true);

    void (async () => {
      try {
        await initializeAdmin.mutateAsync("3049_ash");
        await queryClient.invalidateQueries({ queryKey: ["is_admin"] });
        await queryClient.invalidateQueries({ queryKey: ["pending_videos"] });
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Could not verify admin access. Please try logging in again.";
        setClaimError(msg);
      } finally {
        setIsAutoClaimPending(false);
      }
    })();
  }, [identity, initializeAdmin.mutateAsync, queryClient.invalidateQueries]);

  const handleRetry = () => {
    if (!identity) return;
    setClaimError("");
    setIsAutoClaimPending(true);

    void (async () => {
      try {
        await initializeAdmin.mutateAsync("3049_ash");
        await queryClient.invalidateQueries({ queryKey: ["is_admin"] });
        await queryClient.invalidateQueries({ queryKey: ["pending_videos"] });
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Could not verify admin access. Please try logging in again.";
        setClaimError(msg);
      } finally {
        setIsAutoClaimPending(false);
      }
    })();
  };

  return (
    <div
      data-ocid="admin.login.panel"
      className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col items-center gap-6 w-full max-w-sm"
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-brand-red/10 border border-brand-red/30 flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-brand-red" />
        </div>

        {/* Not logged in — show login button */}
        {!identity && (
          <>
            <div className="space-y-2">
              <h2 className="font-display font-black text-xl uppercase tracking-wider text-foreground">
                Admin Access Required
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Connect with Internet Identity to access the admin panel.
              </p>
            </div>
            <Button
              data-ocid="admin.login.primary_button"
              onClick={login}
              disabled={isLoggingIn}
              className="w-full bg-brand-red hover:bg-brand-red-light text-white font-bold uppercase tracking-wide text-xs px-6 h-10 rounded-sm transition-all duration-200 hover:shadow-red-glow-sm disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5 mr-2" />
                  Connect with Internet Identity
                </>
              )}
            </Button>
          </>
        )}

        {/* Logged in and auto-claim in progress */}
        {identity && isAutoClaimPending && (
          <div
            data-ocid="admin.claim.loading_state"
            className="flex flex-col items-center gap-3"
          >
            <Loader2 className="w-6 h-6 animate-spin text-brand-red" />
            <p className="text-sm text-muted-foreground">
              Verifying admin access...
            </p>
          </div>
        )}

        {/* Logged in, auto-claim failed */}
        {identity && !isAutoClaimPending && claimError && (
          <div
            data-ocid="admin.claim.error_state"
            className="flex flex-col items-center gap-4 w-full"
          >
            <div className="space-y-2">
              <h2 className="font-display font-black text-xl uppercase tracking-wider text-foreground">
                Access Denied
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Could not verify admin access. Please try logging in again.
              </p>
            </div>
            <Button
              data-ocid="admin.claim.primary_button"
              onClick={handleRetry}
              className="w-full bg-brand-red hover:bg-brand-red-light text-white font-bold uppercase tracking-wide text-xs px-6 h-10 rounded-sm transition-all duration-200 hover:shadow-red-glow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-2" />
              Try Again
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Main AdminPanel ───────────────────────────────────────────────────────────

export function AdminPanel() {
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const {
    data: pendingVideos,
    isLoading: isPendingLoading,
    isError: isPendingError,
    refetch: refetchPending,
  } = useGetPendingVideos(isAdmin === true);
  const [addVideoOpen, setAddVideoOpen] = useState(false);

  // Re-fetch pending videos whenever admin status transitions to true
  useEffect(() => {
    if (isAdmin) {
      void refetchPending();
    }
  }, [isAdmin, refetchPending]);

  const handleBackToSite = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("admin");
    window.history.pushState({}, "", url.toString());
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Admin header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-[oklch(0.08_0_0)] backdrop-blur-sm">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 max-w-5xl">
          {/* Logo + badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-lg font-black uppercase tracking-tighter text-brand-red leading-none">
                Daily Brief
              </span>
              <span className="font-display text-lg font-black uppercase tracking-tighter text-foreground leading-none">
                Global
              </span>
            </div>
            <Badge
              variant="outline"
              className="border-brand-red/50 text-brand-red bg-brand-red/10 text-[10px] font-black uppercase tracking-wider"
            >
              Admin
            </Badge>
          </div>

          {/* Back to site */}
          <Button
            data-ocid="admin.back_button"
            variant="outline"
            size="sm"
            onClick={handleBackToSite}
            className="border-border text-muted-foreground hover:text-foreground font-bold uppercase tracking-wide text-xs h-8 rounded-sm transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back to Site
          </Button>
        </div>
        <div className="h-0.5 w-full bg-gradient-to-r from-brand-red via-brand-red-light to-transparent" />
      </header>

      {/* Admin Add Video Modal */}
      <AdminAddVideoModal open={addVideoOpen} onOpenChange={setAddVideoOpen} />

      {/* Main content */}
      <main className="container mx-auto max-w-5xl px-4 py-8">
        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-6 bg-brand-red rounded-full" />
            <h1 className="font-display font-black text-2xl uppercase tracking-wider text-foreground">
              Moderation Queue
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">
            Review and approve or reject user-submitted videos before they go
            live.
          </p>
        </motion.div>

        {/* Gate: check admin status */}
        {isAdminLoading ? (
          <div
            data-ocid="admin.loading_state"
            className="flex items-center justify-center py-20"
          >
            <Loader2 className="w-6 h-6 animate-spin text-brand-red" />
          </div>
        ) : !isAdmin ? (
          <NotAdminGate />
        ) : (
          <div data-ocid="admin.panel" className="space-y-4">
            {/* Stats strip */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                <span>
                  {isPendingLoading ? (
                    <Skeleton className="h-3 w-20 inline-block" />
                  ) : (
                    <>
                      <span className="text-foreground text-lg font-black mr-1">
                        {pendingVideos?.length ?? 0}
                      </span>
                      pending
                    </>
                  )}
                </span>
              </div>
              <Button
                data-ocid="admin.add_video.open_modal_button"
                size="sm"
                onClick={() => setAddVideoOpen(true)}
                className="bg-brand-red hover:bg-brand-red-light text-white font-bold uppercase tracking-wide text-xs h-8 rounded-sm transition-all duration-200 hover:shadow-red-glow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                Add Video
              </Button>
            </div>

            {/* Error state */}
            {isPendingError && (
              <div
                data-ocid="admin.pending.error_state"
                className="flex items-center gap-3 bg-red-600/10 border border-red-600/30 rounded-sm px-4 py-3 text-sm text-red-400"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                Failed to load pending videos. Please refresh and try again.
              </div>
            )}

            {/* Loading skeletons */}
            {isPendingLoading && (
              <div className="space-y-3">
                {(["skeleton-a", "skeleton-b", "skeleton-c"] as const).map(
                  (k, i) => (
                    <PendingVideoSkeleton key={k} index={i} />
                  ),
                )}
              </div>
            )}

            {/* Video list */}
            {!isPendingLoading && !isPendingError && (
              <AnimatePresence mode="popLayout">
                {pendingVideos && pendingVideos.length > 0 ? (
                  <div data-ocid="admin.pending.list" className="space-y-3">
                    {pendingVideos.map((video, i) => (
                      <PendingVideoCard
                        key={String(video.id)}
                        video={video}
                        index={i}
                      />
                    ))}
                  </div>
                ) : (
                  <motion.div
                    data-ocid="admin.pending.empty_state"
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 gap-4 text-center"
                  >
                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-display font-black text-base uppercase tracking-wider text-foreground">
                        Queue Clear
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        No videos pending review right now.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
