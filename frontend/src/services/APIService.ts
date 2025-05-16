// src/services/APIService.ts
import {
  APIResponse,
  VersionResponse,
  UserResponse,
  TranscriptionJobResponse,
  TranscriptionStatusResponse,
  ActiveJob
} from '../types/api';

class APIService {
  private baseUrl: string = "http://localhost:8000";
  private currentVersion: string = "1.0.0";
  private userId: string | null = null;
  private isStale: boolean = false;
  private activeJobs: Map<string, ActiveJob> = new Map();

  // Allow external components to register job update handlers
  private jobUpdateHandlers: Array<(jobs: Map<string, ActiveJob>) => void> = [];

  constructor() {
    // Initialize user ID from local storage
    this.initializeUserId();

    // Check version compatibility when service initializes
    this.checkVersionCompatibility();

    // Set up interval to periodically check version (every 5 minutes)
    setInterval(() => this.checkVersionCompatibility(), 5 * 60 * 1000);

    // Set up interval to poll for job updates (every 2 seconds)
    setInterval(() => this.pollActiveJobs(), 2000);
  }

  // Register a handler for job updates
  registerJobUpdateHandler(handler: (jobs: Map<string, ActiveJob>) => void) {
    this.jobUpdateHandlers.push(handler);
  }

  // Notify all registered handlers of job updates
  private notifyJobUpdateHandlers() {
    this.jobUpdateHandlers.forEach(handler => handler(this.activeJobs));
  }

  // Get all active jobs
  getActiveJobs(): Map<string, ActiveJob> {
    return this.activeJobs;
  }

  // Initialize user ID from local storage or get a new one
  private async initializeUserId(): Promise<void> {
    // Check local storage for existing user ID
    const storedUserId = localStorage.getItem('userId');

    if (storedUserId) {
      this.userId = storedUserId;
      console.log(`Using existing user ID: ${this.userId}`);
    } else {
      // Request a new user ID from the backend
      try {
        const response = await this.getUser();
        if (response.data) {
          this.userId = response.data;
          // Store in local storage
          localStorage.setItem('userId', this.userId);
          console.log(`Created new user ID: ${this.userId}`);
        }
      } catch (error) {
        console.error("Failed to initialize user ID:", error);
      }
    }
  }

  // Method to check if frontend version is compatible with backend
  private async checkVersionCompatibility(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/version`);
      const data: VersionResponse = await response.json();

      if (data.version !== this.currentVersion) {
        this.isStale = true;
        // Trigger event for UI to prompt user to refresh
        window.dispatchEvent(new CustomEvent('versionMismatch', {
          detail: {
            backendVersion: data.version,
            frontendVersion: this.currentVersion
          }
        }));
      } else {
        this.isStale = false;
      }
    } catch (error) {
      console.error("Failed to check version compatibility:", error);
    }
  }

  // Poll for updates to active jobs
  private async pollActiveJobs(): Promise<void> {
    if (this.activeJobs.size === 0) {
      return; // No jobs to poll
    }

    try {
      // Create array of promises to check status of each job
      const statusPromises = Array.from(this.activeJobs.keys()).map(jobId =>
          this.getJobStatus(jobId)
      );

      // Wait for all promises to settle (not necessarily resolve)
      const results = await Promise.allSettled(statusPromises);

      let updated = false;

      // Process results and update job status
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.data) {
          const jobStatus = result.value.data;
          const jobId = jobStatus.job_id;

          const currentJob = this.activeJobs.get(jobId);
          if (currentJob) {
            // Update job status if it's changed
            if (
                currentJob.status !== jobStatus.status ||
                currentJob.progress !== jobStatus.progress ||
                currentJob.transcription !== jobStatus.transcription ||
                currentJob.category !== jobStatus.category ||
                currentJob.error !== jobStatus.error
            ) {
              this.activeJobs.set(jobId, {
                ...currentJob,
                status: jobStatus.status,
                progress: jobStatus.progress,
                transcription: jobStatus.transcription,
                category: jobStatus.category,
                error: jobStatus.error
              });
              updated = true;
            }

            // If job is completed or errored, we can stop polling it after a while
            if ((jobStatus.status === 'completed' || jobStatus.status === 'error') &&
                Date.now() - currentJob.createdAt.getTime() > 30000) { // 30 seconds
              // could remove job from active jobs here, but we'll keep it for history
            }
          }
        }
      });

      // If any jobs were updated, notify handlers
      if (updated) {
        this.notifyJobUpdateHandlers();
      }
    } catch (error) {
      console.error("Failed to poll job status:", error);
    }
  }

  // Generic request handler with version checking and user ID
  private async makeRequest<T>(
      endpoint: string,
      method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
      body?: FormData | object
  ): Promise<APIResponse<T>> {
    // Ensure user ID is initialized
    if (!this.userId) {
      await this.initializeUserId();
    }

    // If already known to be stale, reject immediately
    if (this.isStale) {
      return {
        error: "Application version mismatch. Please refresh the page.",
        stale: true
      };
    }

    try {
      const headers: HeadersInit = {
        "X-API-Version": this.currentVersion
      };

      // Add user ID header if available
      if (this.userId) {
        headers["X-User-ID"] = this.userId;
      }

      // Add Content-Type header if body is a plain object (not FormData)
      if (body && !(body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }

      const requestOptions: RequestInit = {
        method,
        headers,
        body: body instanceof FormData ? body : JSON.stringify(body),
      };

      const response = await fetch(
          `${this.baseUrl}${endpoint}`,
          requestOptions
      );

      // Check for version mismatch in response headers
      const backendVersion = response.headers.get("X-API-Version");
      if (backendVersion && backendVersion !== this.currentVersion) {
        this.isStale = true;
        window.dispatchEvent(new CustomEvent('versionMismatch', {
          detail: {
            backendVersion,
            frontendVersion: this.currentVersion
          }
        }));
        return {
          error: "Application version mismatch. Please refresh the page.",
          stale: true
        };
      }

      // Check if response is not OK (HTTP error)
      if (!response.ok) {
        const errorData = await response.json();
        return {
          error: errorData.detail || `Request failed with status ${response.status}`,
          version: backendVersion
        };
      }

      const data = await response.json();
      return {
        data: data,
        version: backendVersion
      };
    } catch (error) {
      return { error: `Request failed: ${error}` };
    }
  }

  // Get current backend version
  async getBackendVersion(): Promise<APIResponse<string>> {
    try {
      const response = await fetch(`${this.baseUrl}/version`);
      const data = await response.json();
      return { data: data.version };
    } catch (error) {
      return { error: `Failed to get backend version: ${error}` };
    }
  }

  // Get or create user ID
  async getUser(): Promise<APIResponse<string>> {
    try {
      const response = await this.makeRequest<UserResponse>("/user", "GET");
      return {
        data: response.data?.user_id,
        error: response.error
      };
    } catch (error) {
      return { error: `Failed to get user: ${error}` };
    }
  }

  // Start a new transcription job
  async transcribeAudio(audioBlob: Blob): Promise<APIResponse<string>> {
    const formData = new FormData();
    formData.append("audio", audioBlob);

    try {
      const response = await this.makeRequest<TranscriptionJobResponse>("/transcribe", "POST", formData);

      if (response.data) {
        const jobId = response.data.job_id;

        // Add to active jobs
        this.activeJobs.set(jobId, {
          jobId,
          status: response.data.status,
          progress: 0,
          createdAt: new Date()
        });

        // Notify handlers of new job
        this.notifyJobUpdateHandlers();

        return { data: jobId };
      }

      return { error: response.error };
    } catch (error) {
      return { error: `Failed to start transcription: ${error}` };
    }
  }

  // Get the status of a specific job
  async getJobStatus(jobId: string): Promise<APIResponse<TranscriptionStatusResponse>> {
    return this.makeRequest<TranscriptionStatusResponse>(`/jobs/${jobId}`, "GET");
  }

  // Get all jobs for the current user
  async getUserJobs(): Promise<APIResponse<TranscriptionStatusResponse[]>> {
    return this.makeRequest<TranscriptionStatusResponse[]>(`/jobs`, "GET");
  }
}

// Create and export a singleton instance
export default new APIService();