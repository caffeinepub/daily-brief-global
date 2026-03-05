import { Footer } from "@/components/app/Footer";
import { Header } from "@/components/app/Header";
import { HeroSection } from "@/components/app/HeroSection";
import { VideoFeed } from "@/components/app/VideoFeed";
import { VideoPlayer } from "@/components/app/VideoPlayer";
import { Toaster } from "@/components/ui/sonner";
import type { UIVideo } from "@/hooks/useQueries";
import { useState } from "react";

export default function App() {
  const [selectedVideo, setSelectedVideo] = useState<UIVideo | null>(null);

  const handleVideoSelect = (video: UIVideo) => {
    setSelectedVideo(video);
    // Scroll to top when player opens (mobile UX)
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClosePlayer = () => {
    setSelectedVideo(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Sticky header */}
      <Header />

      {/* Main content */}
      <main>
        {/* Hero section — featured video */}
        <HeroSection onVideoSelect={handleVideoSelect} />

        {/* Ticker bar */}
        <div className="bg-brand-red text-white py-1.5 overflow-hidden border-b border-brand-red-dark">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3">
              <span className="bg-white text-brand-red text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm shrink-0">
                TRENDING
              </span>
              <div className="overflow-hidden">
                <p className="text-xs font-bold uppercase tracking-wider animate-scroll">
                  STREET FIGHT GOES VIRAL &bull; CAR CHASE ENDS BADLY &bull;
                  INSANE SKATEBOARD TRICK &bull; ROAD RAGE CAUGHT ON CAMERA
                  &bull; WILD BRAWL OUTSIDE CLUB &bull; EPIC FAIL COMPILATION
                  &bull;&nbsp; STREET FIGHT GOES VIRAL &bull; CAR CHASE ENDS
                  BADLY &bull; INSANE SKATEBOARD TRICK &bull; ROAD RAGE CAUGHT
                  ON CAMERA &bull; WILD BRAWL OUTSIDE CLUB &bull; EPIC FAIL
                  COMPILATION
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Video feed */}
        <div className="container mx-auto max-w-7xl">
          <VideoFeed onVideoSelect={handleVideoSelect} />
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Video player overlay */}
      <VideoPlayer video={selectedVideo} onClose={handleClosePlayer} />

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className:
            "bg-card border-border text-foreground font-bold text-xs uppercase tracking-wider",
          style: { borderRadius: "2px" },
        }}
      />
    </div>
  );
}
