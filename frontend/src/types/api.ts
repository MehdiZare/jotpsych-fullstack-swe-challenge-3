// src/types/api.ts
export interface TranscriptCategory {
    primary_topic: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    keywords: string[];
    confidence: number;
    summary: string;
}

export interface APIResponse<T> {
    data?: T;
    error?: string;
    version?: string;
    stale?: boolean;
}

export interface VersionResponse {
    version: string;
}

export interface UserResponse {
    user_id: string;
}

export interface TranscriptionJobResponse {
    job_id: string;
    status: string;
}

export interface TranscriptionStatusResponse {
    job_id: string;
    status: string;
    progress: number;
    transcription?: string;
    category?: TranscriptCategory;
    error?: string;
}

// Store of active jobs that can be accessed application-wide
export interface ActiveJob {
    jobId: string;
    status: string;
    progress: number;
    transcription?: string;
    category?: TranscriptCategory;
    error?: string;
    createdAt: Date;
}