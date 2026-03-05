import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Video {
    id: bigint;
    url: string;
    title: string;
    likeCount: bigint;
    thumbnail: ExternalBlob;
    submittedAt: bigint;
    platform: string;
    viewCount: bigint;
}
export interface Comment {
    id: bigint;
    text: string;
    timestamp: bigint;
    videoId: bigint;
}
export interface backendInterface {
    addComment(videoId: bigint, text: string): Promise<Comment | null>;
    getComments(videoId: bigint): Promise<Array<Comment>>;
    getFeaturedVideo(): Promise<Video | null>;
    getVideos(): Promise<Array<Video>>;
    incrementViewCount(videoId: bigint): Promise<Video | null>;
    likeVideo(videoId: bigint): Promise<Video | null>;
    submitVideo(title: string, url: string, platform: string, thumbnail: ExternalBlob, viewCount: bigint): Promise<Video>;
}
