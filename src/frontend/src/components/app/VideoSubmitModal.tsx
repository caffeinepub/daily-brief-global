import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSubmitVideo } from "@/hooks/useQueries";
import {
  Instagram,
  Link,
  Loader2,
  RefreshCw,
  Upload,
  Youtube,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

// ── helpers ───────────────────────────────────────────────────────────────────

async function compressImage(file: File): Promise<Uint8Array<ArrayBuffer>> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX_W = 800;
      const MAX_H = 450;
      let w = img.width;
      let h = img.height;
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
        (blob) => {
          if (!blob) {
            reject(new Error("Compression failed"));
            return;
          }
          blob
            .arrayBuffer()
            .then((buf) => resolve(new Uint8Array(buf)))
            .catch(reject);
        },
        "image/jpeg",
        0.82,
      );
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

async function compressImageFromUrl(
  imgUrl: string,
): Promise<{ bytes: Uint8Array<ArrayBuffer>; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const MAX_W = 800;
      const MAX_H = 450;
      let w = img.width;
      let h = img.height;
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
      const previewUrl = canvas.toDataURL("image/jpeg", 0.82);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Compression failed"));
            return;
          }
          blob
            .arrayBuffer()
            .then((buf) => resolve({ bytes: new Uint8Array(buf), previewUrl }))
            .catch(reject);
        },
        "image/jpeg",
        0.82,
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imgUrl;
  });
}

/** Extract YouTube video ID from various URL formats */
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

/** Build a proxy URL to bypass CORS for thumbnail fetching */
function proxyUrl(direct: string): string {
  return `https://corsproxy.io/?url=${encodeURIComponent(direct)}`;
}

async function fetchYouTubeThumbnail(
  videoId: string,
): Promise<{ bytes: Uint8Array<ArrayBuffer>; previewUrl: string }> {
  // Try highest quality first, fall back to hq
  const variants = [
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
  ];
  for (const src of variants) {
    try {
      const result = await compressImageFromUrl(proxyUrl(src));
      return result;
    } catch {
      // try next
    }
  }
  throw new Error("Could not fetch YouTube thumbnail");
}

async function fetchInstagramThumbnail(
  igUrl: string,
): Promise<{ bytes: Uint8Array<ArrayBuffer>; previewUrl: string }> {
  // Fallback: use a proxy on the page's og:image via allorigins
  const allOriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(igUrl)}`;
  const resp = await fetch(allOriginsUrl);
  const html = await resp.text();
  const match =
    html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    ) ||
    html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    );
  if (match?.[1]) {
    return compressImageFromUrl(proxyUrl(match[1]));
  }
  throw new Error("Could not extract Instagram thumbnail");
}

// ── types ─────────────────────────────────────────────────────────────────────

interface VideoSubmitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function detectPlatform(url: string): string {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("instagram.com")) return "instagram";
  return "other";
}

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === "youtube")
    return <Youtube className="w-4 h-4 text-red-500" />;
  if (platform === "instagram")
    return <Instagram className="w-4 h-4 text-pink-500" />;
  return <Link className="w-4 h-4 text-muted-foreground" />;
}

// ── component ─────────────────────────────────────────────────────────────────

export function VideoSubmitModal({
  open,
  onOpenChange,
}: VideoSubmitModalProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [viewCount, setViewCount] = useState("0");
  const [thumbnailBytes, setThumbnailBytes] =
    useState<Uint8Array<ArrayBuffer> | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isFetchingThumb, setIsFetchingThumb] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submitVideo = useSubmitVideo();
  const platform = detectPlatform(url);

  // ── auto-fetch thumbnail when URL is pasted ──────────────────────────────
  const autoFetchThumbnail = useCallback(async (rawUrl: string) => {
    const p = detectPlatform(rawUrl);
    if (p === "other" || !rawUrl.trim()) return;

    setIsFetchingThumb(true);
    try {
      let result: { bytes: Uint8Array<ArrayBuffer>; previewUrl: string };
      if (p === "youtube") {
        const id = getYouTubeId(rawUrl);
        if (!id) throw new Error("Invalid YouTube URL");
        result = await fetchYouTubeThumbnail(id);
      } else {
        result = await fetchInstagramThumbnail(rawUrl);
      }
      setThumbnailBytes(result.bytes);
      setThumbnailPreview(result.previewUrl);
      toast.success("Thumbnail auto-fetched!");
    } catch {
      // Silent — user can upload manually
      toast.info("Could not auto-fetch thumbnail. Please upload one manually.");
    } finally {
      setIsFetchingThumb(false);
    }
  }, []);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
  };

  const handleUrlBlur = () => {
    if (url.trim() && !thumbnailBytes) {
      void autoFetchThumbnail(url.trim());
    }
  };

  const handleRefetchThumbnail = () => {
    if (url.trim()) {
      void autoFetchThumbnail(url.trim());
    }
  };

  // ── manual file upload ───────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large. Please use an image under 10MB.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setThumbnailPreview(previewUrl);

    if (file.size < 200 * 1024) {
      const buffer = (await file.arrayBuffer()) as ArrayBuffer;
      setThumbnailBytes(new Uint8Array(buffer));
    } else {
      try {
        const compressed = await compressImage(file);
        setThumbnailBytes(compressed);
      } catch {
        const buffer = (await file.arrayBuffer()) as ArrayBuffer;
        setThumbnailBytes(new Uint8Array(buffer));
      }
    }
  };

  // ── submit ───────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
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
      toast.error("Please upload a thumbnail image");
      return;
    }

    submitVideo.mutate(
      {
        title: title.trim(),
        url: url.trim(),
        platform,
        thumbnailBytes,
        viewCount: BigInt(Math.max(0, Number.parseInt(viewCount, 10) || 0)),
        onProgress: setUploadProgress,
      },
      {
        onSuccess: () => {
          toast.success("Video submitted successfully!");
          setUrl("");
          setTitle("");
          setViewCount("0");
          setThumbnailBytes(null);
          setUploadProgress(0);
          if (thumbnailPreview?.startsWith("blob:"))
            URL.revokeObjectURL(thumbnailPreview);
          setThumbnailPreview(null);
          onOpenChange(false);
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : String(err);
          toast.error(msg || "Failed to submit video. Please try again.");
          console.error(err);
        },
      },
    );
  };

  const handleClose = () => {
    if (thumbnailPreview?.startsWith("blob:"))
      URL.revokeObjectURL(thumbnailPreview);
    onOpenChange(false);
  };

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <span data-ocid="submit_modal.open_modal_button" className="hidden" />
      </DialogTrigger>
      <DialogContent
        data-ocid="submit_modal.dialog"
        className="bg-card border-border max-w-md w-full mx-4 p-0 overflow-hidden rounded-sm flex flex-col max-h-[90vh]"
        aria-describedby="submit-dialog-description"
      >
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-0">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-brand-red rounded-full" />
            <DialogTitle className="font-display text-base font-black uppercase tracking-widest">
              Submit a Clip
            </DialogTitle>
          </div>
          <p
            id="submit-dialog-description"
            className="text-xs text-muted-foreground mt-1"
          >
            Share a viral video with the Daily Brief Global community.
          </p>
        </DialogHeader>

        <motion.form
          onSubmit={handleSubmit}
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
                data-ocid="submit_modal.url_input"
                type="url"
                value={url}
                onChange={handleUrlChange}
                onBlur={handleUrlBlur}
                placeholder="https://www.instagram.com/p/..."
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

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Title *
            </Label>
            <Input
              data-ocid="submit_modal.title_input"
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
              data-ocid="submit_modal.views_input"
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
                    data-ocid="submit_modal.refetch_button"
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
                  data-ocid="submit_modal.upload_button"
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
              data-ocid="submit_modal.dropzone"
            >
              {isFetchingThumb ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-red" />
                  <p className="text-xs font-bold uppercase tracking-wider">
                    Fetching thumbnail...
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
          <div className="flex gap-3 pt-2 pb-1 sticky bottom-0 bg-card">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-border font-bold uppercase tracking-wide text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              data-ocid="submit_modal.submit_button"
              type="submit"
              disabled={
                submitVideo.isPending || !url || !title || !thumbnailBytes
              }
              className="flex-1 bg-brand-red hover:bg-brand-red-light text-white font-bold uppercase tracking-wide text-xs h-9 transition-all duration-200 disabled:opacity-40"
            >
              {submitVideo.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Video"
              )}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
