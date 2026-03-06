import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitVideo } from "@/hooks/useQueries";
import { Loader2, Upload, Video } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

// ── helpers ───────────────────────────────────────────────────────────────────

/** Extract a thumbnail frame from an mp4 File using a hidden <video> element. */
async function extractVideoThumbnail(
  file: File,
): Promise<Uint8Array<ArrayBuffer>> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(file);

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.src = "";
    };

    const captureFrame = () => {
      try {
        const W = 800;
        const H = 450;
        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d")!;

        // Draw a dark background first
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, W, H);

        // Draw the video frame, letterboxed
        const vw = video.videoWidth || W;
        const vh = video.videoHeight || H;
        const scale = Math.min(W / vw, H / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        const dx = (W - dw) / 2;
        const dy = (H - dh) / 2;
        ctx.drawImage(video, dx, dy, dw, dh);

        canvas.toBlob(
          (blob) => {
            cleanup();
            if (!blob) return reject(new Error("canvas toBlob returned null"));
            blob
              .arrayBuffer()
              .then((buf) =>
                resolve(new Uint8Array(buf) as Uint8Array<ArrayBuffer>),
              )
              .catch(reject);
          },
          "image/jpeg",
          0.85,
        );
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    video.addEventListener("seeked", captureFrame, { once: true });

    video.addEventListener(
      "loadedmetadata",
      () => {
        // Seek to 1s or 10% of duration, whichever is smaller
        const seekTo = Math.min(1, (video.duration || 0) * 0.1);
        video.currentTime = seekTo > 0 ? seekTo : 0;
      },
      { once: true },
    );

    video.addEventListener(
      "error",
      () => {
        cleanup();
        // Fall back to a solid-color placeholder that is large enough for the backend
        makeFallbackThumb().then(resolve).catch(reject);
      },
      { once: true },
    );

    video.src = objectUrl;
  });
}

/** Fallback: a solid dark 800x450 JPEG (never 1x1, so blob-storage accepts it). */
async function makeFallbackThumb(): Promise<Uint8Array<ArrayBuffer>> {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 450;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, 800, 450);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("no blob"));
        blob
          .arrayBuffer()
          .then((buf) =>
            resolve(new Uint8Array(buf) as Uint8Array<ArrayBuffer>),
          )
          .catch(reject);
      },
      "image/jpeg",
      0.85,
    );
  });
}

// ── types ─────────────────────────────────────────────────────────────────────

interface VideoSubmitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── component ─────────────────────────────────────────────────────────────────

export function VideoSubmitModal({
  open,
  onOpenChange,
}: VideoSubmitModalProps) {
  const [mp4File, setMp4File] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitVideo = useSubmitVideo();

  // ── submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mp4File) {
      toast.error("Please select an .mp4 video file");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    try {
      const thumbnailBytes = await extractVideoThumbnail(mp4File);

      await new Promise<void>((resolve, reject) => {
        submitVideo.mutate(
          {
            title: description.trim().slice(0, 100),
            url: "",
            platform: "other",
            thumbnailBytes,
            viewCount: 0n,
            onProgress: undefined,
          },
          {
            onSuccess: () => {
              toast.success(
                "Submitted for review! Your clip will appear once approved.",
              );
              setMp4File(null);
              setDescription("");
              onOpenChange(false);
              resolve();
            },
            onError: (err) => {
              const msg = err instanceof Error ? err.message : String(err);
              toast.error(msg || "Failed to submit video. Please try again.");
              console.error("Submit error:", err);
              reject(err);
            },
          },
        );
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || "Failed to submit video. Please try again.");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (
      !file.name.toLowerCase().endsWith(".mp4") &&
      file.type !== "video/mp4"
    ) {
      toast.error("Only .mp4 files are accepted");
      return;
    }

    setMp4File(file);
  };

  const isSubmitDisabled =
    submitVideo.isPending || !mp4File || !description.trim();

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleClose}>
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
            Upload an .mp4 clip with a description. Your submission will be
            reviewed before it goes live.
          </p>
        </DialogHeader>

        <motion.form
          onSubmit={handleSubmit}
          className="px-5 py-4 space-y-4 overflow-y-auto flex-1 min-h-0"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* MP4 File Upload */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Video File (.mp4) *
            </Label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".mp4,video/mp4"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Upload MP4 video file"
            />

            <button
              type="button"
              data-ocid="submit_modal.upload_button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full border-2 border-dashed border-border rounded-sm overflow-hidden cursor-pointer group text-left hover:border-brand-red transition-colors"
            >
              {mp4File ? (
                <div className="flex items-center gap-3 px-4 py-5">
                  <div className="w-9 h-9 rounded-sm bg-brand-red/10 flex items-center justify-center flex-shrink-0">
                    <Video className="w-5 h-5 text-brand-red" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {mp4File.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(mp4File.size / (1024 * 1024)).toFixed(1)} MB · .mp4
                    </p>
                  </div>
                  <p className="ml-auto text-[10px] font-bold uppercase tracking-wider text-brand-red opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    Change
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                  <Upload className="w-7 h-7 opacity-40" />
                  <p className="text-xs font-bold uppercase tracking-wider">
                    Click to select .mp4 file
                  </p>
                  <p className="text-xs opacity-50">MP4 format only</p>
                </div>
              )}
            </button>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Description *
            </Label>
            <Textarea
              data-ocid="submit_modal.textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happens in the video..."
              maxLength={500}
              rows={4}
              className="bg-secondary border-border text-sm focus-visible:ring-brand-red focus-visible:border-brand-red resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length} / 500
            </p>
          </div>

          {/* Actions — sticky at bottom */}
          <div className="flex gap-3 pt-2 pb-1 sticky bottom-0 bg-card z-10">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              data-ocid="submit_modal.cancel_button"
              className="flex-1 border-border font-bold uppercase tracking-wide text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              data-ocid="submit_modal.submit_button"
              type="submit"
              disabled={isSubmitDisabled}
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
