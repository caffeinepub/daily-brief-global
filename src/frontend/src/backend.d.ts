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
    status: VideoStatus;
    title: string;
    likeCount: bigint;
    thumbnail: ExternalBlob;
    submittedAt: Time;
    platform: Variant_other_instagram_youtube;
    viewCount: bigint;
}
export type Time = bigint;
export interface Comment {
    id: bigint;
    text: string;
    timestamp: bigint;
    videoId: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_other_instagram_youtube {
    other = "other",
    instagram = "instagram",
    youtube = "youtube"
}
export enum VideoStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export interface backendInterface {
    addComment(videoId: bigint, text: string): Promise<Comment | null>;
    approveVideo(id: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    claimAdminWithToken(_userSecret: string): Promise<void>;
    getCallerUserRole(): Promise<UserRole>;
    getComments(videoId: bigint): Promise<Array<Comment>>;
    getFeaturedVideo(): Promise<Video | null>;
    getPendingVideos(): Promise<Array<Video>>;
    getVideos(): Promise<Array<Video>>;
    incrementViewCount(videoId: bigint): Promise<Video | null>;
    isCallerAdmin(): Promise<boolean>;
    likeVideo(videoId: bigint): Promise<Video | null>;
    rejectVideo(id: bigint): Promise<void>;
    submitVideo(title: string, url: string, platform: Variant_other_instagram_youtube, thumbnail: ExternalBlob, viewCount: bigint): Promise<Video>;
}
