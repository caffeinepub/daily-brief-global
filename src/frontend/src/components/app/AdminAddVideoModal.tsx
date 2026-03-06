import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePublishVideo } from "@/hooks/useQueries";
import {
  Instagram,
  Link,
  Loader2,
  PlusCircle,
  RefreshCw,
  Upload,
  Youtube,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

// ── helpers (mirrored from VideoSubmitModal) ──────────────────────────────────

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function detectPlatform(url: string): string {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("instagram.com")) return "instagram";
  return "other";
}

async function blobToCompressedBytes(
  blob: Blob,
): Promise<Uint8Array<ArrayBuffer>> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX_W = 800;
      const MAX_H = 450;
      let w = img.width || MAX_W;
      let h = img.height || MAX_H;
      if (w > MAX_W || h > MAX_H) {
        const ratio = Math.min(MAX_W / w, MAX_H / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (outBlob) => {
          if (!outBlob) {
            reject(new Error("Compression failed"));
            return;
          }
          outBlob
            .arrayBuffer()
            .then((buf) =>
              resolve(new Uint8Array(buf) as Uint8Array<ArrayBuffer>),
            )
            .catch(reject);
        },
        "image/jpeg",
        0.82,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };
    img.src = objectUrl;
  });
}

async function fetchImageBytes(
  directUrl: string,
): Promise<{ bytes: Uint8Array<ArrayBuffer>; previewUrl: string }> {
  const proxies = [
    (u: string) =>
      `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u: string) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  ];
  const urls = [directUrl, ...proxies.map((p) => p(directUrl))];
  let lastErr: unknown;
  for (const url of urls) {
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!resp.ok) continue;
      const blob = await resp.blob();
      if (!blob.type.startsWith("image/") && blob.size < 100) continue;
      const bytes = await blobToCompressedBytes(blob);
      const previewUrl = URL.createObjectURL(blob);
      return { bytes, previewUrl };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("All fetch attempts failed");
}

async function fetchYouTubeThumbnail(
  videoId: string,
): Promise<{ bytes: Uint8Array<ArrayBuffer>; previewUrl: string }> {
  const variants = [
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/default.jpg`,
  ];
  let lastErr: unknown;
  for (const src of variants) {
    try {
      return await fetchImageBytes(src);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("Could not fetch YouTube thumbnail");
}

// ── types ─────────────────────────────────────────────────────────────────────

interface AdminAddVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === "youtube")
    return <Youtube className="w-4 h-4 text-red-500" />;
  if (platform === "instagram")
    return <Instagram className="w-4 h-4 text-pink-500" />;
  return <Link className="w-4 h-4 text-muted-foreground" />;
}

// ── component ─────────────────────────────────────────────────────────────────

export function AdminAddVideoModal({
  open,
  onOpenChange,
}: AdminAddVideoModalProps) {
  const [url, setUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [title, setTitle] = useState("");
  const [viewCount, setViewCount] = useState("0");

  const [thumbnailBytes, setThumbnailBytes] =
    useState<Uint8Array<ArrayBuffer> | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isFetchingThumb, setIsFetchingThumb] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewBlobRef = useRef<string | null>(null);

  const publishVideo = usePublishVideo();
  const platform = detectPlatform(url);

  const clearPreviewBlob = useCallback(() => {
    if (previewBlobRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(previewBlobRef.current);
    }
    previewBlobRef.current = null;
  }, []);

  const resetForm = useCallback(() => {
    setUrl("");
    setInstagramUrl("");
    setTitle("");
    setViewCount("0");
    setThumbnailBytes(null);
    setUploadProgress(0);
    clearPreviewBlob();
    setThumbnailPreview(null);
  }, [clearPreviewBlob]);

  // ── auto-fetch thumbnail ─────────────────────────────────────────────────
  const autoFetchThumbnail = useCallback(
    async (rawUrl: string) => {
      const p = detectPlatform(rawUrl);
      if (p === "other" || !rawUrl.trim()) return;

      setIsFetchingThumb(true);
      setThumbnailBytes(null);
      clearPreviewBlob();
      setThumbnailPreview(null);

      try {
        let result: { bytes: Uint8Array<ArrayBuffer>; previewUrl: string };
        if (p === "youtube") {
          const id = getYouTubeId(rawUrl);
          if (!id) throw new Error("Invalid YouTube URL");
          result = await fetchYouTubeThumbnail(id);
        } else {
          const pageResp = await fetch(
            `https://api.allorigins.win/raw?url=${encodeURIComponent(rawUrl)}`,
            { signal: AbortSignal.timeout(10000) },
          );
          if (!pageResp.ok) throw new Error("Could not fetch Instagram page");
          const html = await pageResp.text();
          const ogMatch =
            html.match(
              /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
            ) ||
            html.match(
              /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
            );
          if (!ogMatch?.[1]) throw new Error("No og:image found");
          result = await fetchImageBytes(ogMatch[1]);
        }

        clearPreviewBlob();
        previewBlobRef.current = result.previewUrl;
        setThumbnailBytes(result.bytes);
        setThumbnailPreview(result.previewUrl);
        toast.success("Thumbnail fetched!");
      } catch {
        setThumbnailBytes(null);
        setThumbnailPreview(null);
        toast.info(
          "Could not auto-fetch thumbnail. Please upload one manually.",
        );
      } finally {
        setIsFetchingThumb(false);
      }
    },
    [clearPreviewBlob],
  );

  const handleUrlBlur = () => {
    if (url.trim() && detectPlatform(url.trim()) !== "other") {
      void autoFetchThumbnail(url.trim());
    }
  };

  const handleRefetchThumbnail = () => {
    if (url.trim() && !isFetchingThumb) {
      void autoFetchThumbnail(url.trim());
    }
  };

  // ── manual file upload ───────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large. Please use an image under 10MB.");
      return;
    }

    setIsProcessingFile(true);
    setThumbnailBytes(null);
    clearPreviewBlob();

    const blobUrl = URL.createObjectURL(file);
    previewBlobRef.current = blobUrl;
    setThumbnailPreview(blobUrl);

    try {
      const bytes = await blobToCompressedBytes(file);
      setThumbnailBytes(bytes);
    } catch {
      try {
        const buffer = await file.arrayBuffer();
        setThumbnailBytes(new Uint8Array(buffer) as Uint8Array<ArrayBuffer>);
      } catch {
        toast.error("Failed to process image. Please try another file.");
        clearPreviewBlob();
        setThumbnailPreview(null);
      }
    } finally {
      setIsProcessingFile(false);
    }
  };

  // ── publish ──────────────────────────────────────────────────────────────
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error("Please enter a video URL");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!thumbnailBytes) {
      toast.error("Please add a thumbnail image");
      return;
    }

    // If admin provided an Instagram embed URL, use that as the final URL
    const finalUrl = instagramUrl.trim() ? instagramUrl.trim() : url.trim();
    const finalPlatform = instagramUrl.trim() ? "instagram" : platform;

    try {
      await new Promise<void>((resolve, reject) => {
        publishVideo.mutate(
          {
            title: title.trim(),
            url: finalUrl,
            platform: finalPlatform,
            thumbnailBytes,
            viewCount: BigInt(Math.max(0, Number.parseInt(viewCount, 10) || 0)),
            onProgress: setUploadProgress,
          },
          {
            onSuccess: () => {
              toast.success("Video published to the live feed!");
              resetForm();
              onOpenChange(false);
              resolve();
            },
            onError: (err) => {
              const msg = err instanceof Error ? err.message : String(err);
              toast.error(msg || "Failed to publish video. Please try again.");
              console.error("Publish error:", err);
              reject(err);
            },
          },
        );
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || "Failed to publish video. Please try again.");
    }
  };

  const handleClose = () => {
    clearPreviewBlob();
    onOpenChange(false);
  };

  const isPublishDisabled =
    publishVideo.isPending ||
    isFetchingThumb ||
    isProcessingFile ||
    !url.trim() ||
    !title.trim() ||
    !thumbnailBytes;

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        data-ocid="admin.add_video.dialog"
        className="bg-card border-border max-w-md w-full mx-4 p-0 overflow-hidden rounded-sm flex flex-col max-h-[90vh]"
        aria-describedby="admin-add-video-description"
      >
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-0">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-brand-red rounded-full" />
            <DialogTitle className="font-display text-base font-black uppercase tracking-widest">
              Add Video
            </DialogTitle>
          </div>
          <p
            id="admin-add-video-description"
            className="text-xs text-muted-foreground mt-1"
          >
            Publish a video directly to the live feed. No approval step needed.
          </p>
        </DialogHeader>

        <motion.form
          onSubmit={handlePublish}
          className="px-5 py-4 space-y-4 overflow-y-auto flex-1 min-h-0"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* URL */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Video URL *
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <PlatformIcon platform={platform} />
              </div>
              <Input
                data-ocid="admin.add_video.url_input"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                placeholder="https://www.instagram.com/p/... or YouTube URL"
                className="pl-9 bg-secondary border-border text-sm focus-visible:ring-brand-red focus-visible:border-brand-red"
                required
              />
            </div>
            {platform !== "other" && url && (
              <p className="text-xs text-muted-foreground">
                Detected:{" "}
                <span className="text-brand-red font-bold capitalize">
                  {platform}
                </span>
                {" · "}
                <span className="opacity-60">
                  thumbnail will be fetched automatically
                </span>
              </p>
            )}
          </div>

          {/* Instagram Embed URL (optional) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Instagram Embed URL{" "}
              <span className="opacity-50 normal-case font-normal tracking-normal">
                (optional)
              </span>
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Instagram className="w-4 h-4 text-pink-500" />
              </div>
              <Input
                data-ocid="admin.add_video.instagram_url_input"
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://www.instagram.com/p/... or /reel/..."
                className="pl-9 bg-secondary border-border text-sm focus-visible:ring-brand-red focus-visible:border-brand-red"
              />
            </div>
            {instagramUrl.trim() && (
              <p className="text-xs text-muted-foreground">
                <span className="text-pink-500 font-bold">Instagram</span>
                {" · "}
                <span className="opacity-60">
                  This URL will override the video URL above for embedding
                </span>
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Title *
            </Label>
            <Input
              data-ocid="admin.add_video.title_input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="INSANE clip caught on camera..."
              className="bg-secondary border-border text-sm focus-visible:ring-brand-red focus-visible:border-brand-red uppercase"
              required
              maxLength={200}
            />
          </div>

          {/* View count */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              View Count
            </Label>
            <Input
              data-ocid="admin.add_video.views_input"
              type="number"
              value={viewCount}
              onChange={(e) => setViewCount(e.target.value)}
              placeholder="0"
              min="0"
              className="bg-secondary border-border text-sm focus-visible:ring-brand-red focus-visible:border-brand-red"
            />
          </div>

          {/* Thumbnail */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Thumbnail *
              </Label>
              <div className="flex items-center gap-2">
                {platform !== "other" && url && (
                  <button
                    type="button"
                    data-ocid="admin.add_video.refetch_button"
                    onClick={handleRefetchThumbnail}
                    disabled={isFetchingThumb}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-red hover:text-brand-red-light disabled:opacity-40 transition-colors"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isFetchingThumb ? "animate-spin" : ""}`}
                    />
                    {isFetchingThumb ? "Fetching..." : "Re-fetch"}
                  </button>
                )}
                <button
                  type="button"
                  data-ocid="admin.add_video.upload_button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Upload className="w-3 h-3" />
                  Upload
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Upload thumbnail image"
            />

            {/* Preview / placeholder */}
            <button
              type="button"
              className="relative w-full border-2 border-dashed border-border rounded-sm overflow-hidden cursor-pointer group text-left"
              onClick={() => fileInputRef.current?.click()}
              data-ocid="admin.add_video.dropzone"
            >
              {isFetchingThumb || isProcessingFile ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-red" />
                  <p className="text-xs font-bold uppercase tracking-wider">
                    {isProcessingFile
                      ? "Processing image..."
                      : "Fetching thumbnail..."}
                  </p>
                </div>
              ) : thumbnailPreview ? (
                <div className="relative">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <p className="text-white text-xs font-black uppercase tracking-widest">
                      Click to change
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-7 gap-2 text-muted-foreground">
                  <Upload className="w-7 h-7 opacity-40" />
                  <p className="text-xs font-bold uppercase tracking-wider">
                    {platform !== "other" && url
                      ? "Auto-fetch failed — click to upload manually"
                      : "Click to upload thumbnail"}
                  </p>
                  <p className="text-xs opacity-50">
                    JPG, PNG, WEBP — max 10MB
                  </p>
                </div>
              )}
            </button>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-secondary rounded-full h-1">
                <div
                  className="bg-brand-red h-1 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 pb-1 sticky bottom-0 bg-card z-10">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              data-ocid="admin.add_video.cancel_button"
              className="flex-1 border-border font-bold uppercase tracking-wide text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin.add_video.submit_button"
              type="submit"
              disabled={isPublishDisabled}
              className="flex-1 bg-brand-red hover:bg-brand-red-light text-white font-bold uppercase tracking-wide text-xs h-9 transition-all duration-200 disabled:opacity-40"
            >
              {publishVideo.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Publishing...
                </>
              ) : isFetchingThumb ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Fetching...
                </>
              ) : isProcessingFile ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                  Publish Video
                </>
              )}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
