import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalBlob } from "../backend";
import { Variant_other_instagram_youtube } from "../backend.d";
import type { Comment, Video } from "../backend.d";
import { useActor } from "./useActor";

import thumbCarChase from "/assets/generated/thumb-car-chase.dim_400x225.jpg";
import thumbClubBrawl from "/assets/generated/thumb-club-brawl.dim_400x225.jpg";
import thumbEpicFail from "/assets/generated/thumb-epic-fail.dim_400x225.jpg";
import thumbRoadRage from "/assets/generated/thumb-road-rage.dim_400x225.jpg";
import thumbSkate from "/assets/generated/thumb-skate.dim_400x225.jpg";
// Import mock thumbnails so the build pipeline bundles them correctly
import thumbStreetFight from "/assets/generated/thumb-street-fight.dim_400x225.jpg";

// ── Mock data for empty state ──────────────────────────────
export interface MockVideo {
  id: bigint;
  url: string;
  title: string;
  likeCount: bigint;
  thumbnailUrl: string;
  submittedAt: bigint;
  platform: string;
  viewCount: bigint;
  isMock: true;
}

export const MOCK_VIDEOS: MockVideo[] = [
  {
    id: -1n,
    url: "https://www.instagram.com/p/C0example1/",
    title: "CRAZY Street Fight Caught on Camera",
    likeCount: 4500n,
    thumbnailUrl: thumbStreetFight,
    submittedAt: BigInt(Date.now()),
    platform: "instagram",
    viewCount: 1200000n,
    isMock: true,
  },
  {
    id: -2n,
    url: "https://www.instagram.com/p/C0example2/",
    title: "Unbelievable Car Chase Gone Wrong",
    likeCount: 3200n,
    thumbnailUrl: thumbCarChase,
    submittedAt: BigInt(Date.now()),
    platform: "instagram",
    viewCount: 890000n,
    isMock: true,
  },
  {
    id: -3n,
    url: "https://www.instagram.com/p/C0example3/",
    title: "Wild Brawl Outside Club",
    likeCount: 2100n,
    thumbnailUrl: thumbClubBrawl,
    submittedAt: BigInt(Date.now()),
    platform: "instagram",
    viewCount: 650000n,
    isMock: true,
  },
  {
    id: -4n,
    url: "https://www.instagram.com/p/C0example4/",
    title: "Insane Skateboard Trick Goes Viral",
    likeCount: 1800n,
    thumbnailUrl: thumbSkate,
    submittedAt: BigInt(Date.now()),
    platform: "instagram",
    viewCount: 420000n,
    isMock: true,
  },
  {
    id: -5n,
    url: "https://www.instagram.com/p/C0example5/",
    title: "Shocking Road Rage Incident",
    likeCount: 980n,
    thumbnailUrl: thumbRoadRage,
    submittedAt: BigInt(Date.now()),
    platform: "instagram",
    viewCount: 320000n,
    isMock: true,
  },
  {
    id: -6n,
    url: "https://www.instagram.com/p/C0example6/",
    title: "Epic Fail Compilation 2026",
    likeCount: 750n,
    thumbnailUrl: thumbEpicFail,
    submittedAt: BigInt(Date.now()),
    platform: "instagram",
    viewCount: 200000n,
    isMock: true,
  },
];

// Unified video type used by the UI
export type UIVideo =
  | (Video & { thumbnailUrl: string; isMock?: false })
  | MockVideo;

export function getThumbnailUrl(video: Video): string {
  try {
    return video.thumbnail.getDirectURL();
  } catch {
    return `https://picsum.photos/seed/${String(video.id)}/400/225`;
  }
}

export function toUIVideo(video: Video): UIVideo {
  return {
    ...video,
    thumbnailUrl: getThumbnailUrl(video),
    isMock: false,
  };
}

// ── Queries ───────────────────────────────────────────────
export function useVideos() {
  const { actor, isFetching } = useActor();
  return useQuery<UIVideo[]>({
    queryKey: ["videos"],
    queryFn: async () => {
      if (!actor) return MOCK_VIDEOS;
      const videos = await actor.getVideos();
      if (videos.length === 0) return MOCK_VIDEOS;
      return videos.map(toUIVideo);
    },
    enabled: !isFetching,
    staleTime: 30_000,
  });
}

export function useFeaturedVideo() {
  const { actor, isFetching } = useActor();
  return useQuery<UIVideo | null>({
    queryKey: ["featured_video"],
    queryFn: async () => {
      if (!actor) return MOCK_VIDEOS[0];
      const video = await actor.getFeaturedVideo();
      if (!video) return MOCK_VIDEOS[0];
      return toUIVideo(video);
    },
    enabled: !isFetching,
    staleTime: 30_000,
  });
}

export function useComments(videoId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Comment[]>({
    queryKey: ["comments", String(videoId)],
    queryFn: async () => {
      if (!actor || videoId === null) return [];
      if (videoId < 0n) return []; // mock video
      return actor.getComments(videoId);
    },
    enabled: !!actor && !isFetching && videoId !== null,
    staleTime: 10_000,
  });
}

// ── Mutations ─────────────────────────────────────────────
export function useLikeVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (videoId: bigint) => {
      if (!actor || videoId < 0n) throw new Error("Cannot like mock video");
      return actor.likeVideo(videoId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["videos"] });
      void queryClient.invalidateQueries({ queryKey: ["featured_video"] });
    },
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      videoId,
      text,
    }: {
      videoId: bigint;
      text: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      if (videoId < 0n) throw new Error("Cannot comment on mock video");
      return actor.addComment(videoId, text);
    },
    onSuccess: (_data, { videoId }) => {
      void queryClient.invalidateQueries({
        queryKey: ["comments", String(videoId)],
      });
    },
  });
}

export function useIncrementViewCount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (videoId: bigint) => {
      if (!actor || videoId < 0n) return null;
      return actor.incrementViewCount(videoId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}

function toPlatformEnum(platform: string): Variant_other_instagram_youtube {
  if (platform === "youtube") return Variant_other_instagram_youtube.youtube;
  if (platform === "instagram")
    return Variant_other_instagram_youtube.instagram;
  return Variant_other_instagram_youtube.other;
}

export function useSubmitVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      url,
      platform,
      thumbnailBytes,
      viewCount,
      onProgress,
    }: {
      title: string;
      url: string;
      platform: string;
      thumbnailBytes: Uint8Array<ArrayBufferLike>;
      viewCount: bigint;
      onProgress?: (pct: number) => void;
    }) => {
      if (!actor)
        throw new Error("Backend not available. Please refresh and try again.");

      const safeBytes = thumbnailBytes as Uint8Array<ArrayBuffer>;
      let thumbnail: ExternalBlob;
      try {
        thumbnail = ExternalBlob.fromBytes(safeBytes);
        if (onProgress) {
          thumbnail = thumbnail.withUploadProgress(onProgress);
        }
      } catch {
        throw new Error("Failed to prepare thumbnail for upload.");
      }

      return await actor.submitVideo(
        title,
        url,
        toPlatformEnum(platform),
        thumbnail,
        viewCount,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["videos"] });
      void queryClient.invalidateQueries({ queryKey: ["featured_video"] });
    },
    onError: (err) => {
      console.error("useSubmitVideo error:", err);
    },
  });
}

// ── Admin hooks ───────────────────────────────────────────
export function useInitializeAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (secret: string) => {
      if (!actor) throw new Error("Not connected");
      await actor._initializeAccessControlWithSecret(secret);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["is_admin"] });
    },
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["is_admin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useGetPendingVideos() {
  const { actor, isFetching } = useActor();
  return useQuery<UIVideo[]>({
    queryKey: ["pending_videos"],
    queryFn: async () => {
      if (!actor) return [];
      const videos = await actor.getPendingVideos();
      return videos.map(toUIVideo);
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

export function useApproveVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.approveVideo(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pending_videos"] });
      void queryClient.invalidateQueries({ queryKey: ["videos"] });
      void queryClient.invalidateQueries({ queryKey: ["featured_video"] });
    },
  });
}

export function useRejectVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.rejectVideo(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pending_videos"] });
    },
  });
}

// Admin direct publish: submit + approve in one step
export function usePublishVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      url,
      platform,
      thumbnailBytes,
      viewCount,
      onProgress,
    }: {
      title: string;
      url: string;
      platform: string;
      thumbnailBytes: Uint8Array<ArrayBufferLike>;
      viewCount: bigint;
      onProgress?: (pct: number) => void;
    }) => {
      if (!actor)
        throw new Error("Backend not available. Please refresh and try again.");

      const safeBytes = thumbnailBytes as Uint8Array<ArrayBuffer>;
      let thumbnail: ExternalBlob;
      try {
        thumbnail = ExternalBlob.fromBytes(safeBytes);
        if (onProgress) {
          thumbnail = thumbnail.withUploadProgress(onProgress);
        }
      } catch {
        throw new Error("Failed to prepare thumbnail for upload.");
      }

      const video = await actor.submitVideo(
        title,
        url,
        toPlatformEnum(platform),
        thumbnail,
        viewCount,
      );

      await actor.approveVideo(video.id);
      return video;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["videos"] });
      void queryClient.invalidateQueries({ queryKey: ["featured_video"] });
      void queryClient.invalidateQueries({ queryKey: ["pending_videos"] });
    },
    onError: (err) => {
      console.error("usePublishVideo error:", err);
    },
  });
}
