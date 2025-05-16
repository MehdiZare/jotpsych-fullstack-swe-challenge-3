// src/components/JobsList.tsx
import React, { useState, useEffect } from 'react';
import APIService from '../services/APIService';
import { ActiveJob } from '../types/api';

interface JobsListProps {
    onSelectTranscription: (text: string, jobId: string) => void;
}

const JobsList: React.FC<JobsListProps> = ({ onSelectTranscription }) => {
    const [jobs, setJobs] = useState<Map<string, ActiveJob>>(new Map());
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Register for job updates
        APIService.registerJobUpdateHandler((updatedJobs) => {
            console.log("Job update received, jobs count:", updatedJobs.size);
            setJobs(new Map(updatedJobs));
        });

        // Initial check for existing jobs
        const existingJobs = APIService.getActiveJobs();
        if (existingJobs.size > 0) {
            console.log("Found existing jobs:", existingJobs.size);
            setJobs(new Map(existingJobs));
        }

        // On component mount, fetch any existing jobs from the server
        const fetchJobs = async () => {
            setLoading(true);
            try {
                const response = await APIService.getUserJobs();

                if (response.error) {
                    console.error("Error fetching jobs:", response.error);
                    setError(`Failed to load jobs: ${response.error}`);
                    return;
                }

                if (response.data && response.data.length > 0) {
                    console.log("Fetched jobs from server:", response.data.length);
                    const jobsMap = new Map<string, ActiveJob>();

                    response.data.forEach(job => {
                        console.log("Processing job:", job.job_id, "Category:", job.category);
                        jobsMap.set(job.job_id, {
                            jobId: job.job_id,
                            status: job.status,
                            progress: job.progress,
                            transcription: job.transcription,
                            category: job.category,
                            error: job.error,
                            createdAt: new Date() // No timestamp in API, use current time
                        });
                    });

                    setJobs(jobsMap);
                } else {
                    console.log("No jobs found on server");
                }
            } catch (err) {
                console.error("Exception fetching jobs:", err);
                setError(`Failed to load jobs: ${err}`);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();

        // Cleanup function
        return () => {
            // No cleanup needed
        };
    }, []);

    // Helper function to format job creation time
    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    // Helper function to get appropriate status badge
    const getStatusBadge = (status: string): JSX.Element => {
        let badgeClass = "";

        switch (status) {
            case 'queued':
                badgeClass = "badge-warning";
                break;
            case 'processing':
                badgeClass = "badge-primary";
                break;
            case 'completed':
                badgeClass = "badge-success";
                break;
            case 'error':
                badgeClass = "badge-error";
                break;
            default:
                badgeClass = "bg-gray-100 text-gray-600";
        }

        return (
            <span className={`badge ${badgeClass}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
        );
    };

    // Helper function to get sentiment badge
    const getSentimentBadge = (sentiment: string): JSX.Element => {
        let badgeClass = "";

        switch (sentiment) {
            case 'positive':
                badgeClass = "badge-success";
                break;
            case 'negative':
                badgeClass = "badge-error";
                break;
            default:
                badgeClass = "badge-primary";
        }

        return (
            <span className={`badge ${badgeClass}`}>
        {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
      </span>
        );
    };

    // Convert jobs Map to array and sort by creation time (newest first)
    const sortedJobs = Array.from(jobs.values())
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (loading) {
        return (
            <div className="card animate-pulse">
                <h2 className="card-title">Transcription Jobs</h2>
                <div className="space-y-3 mt-4">
                    {[1, 2].map(i => (
                        <div key={i} className="bg-gray-100 h-20 rounded-lg animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card border-red-100">
                <h2 className="card-title text-red-600">Error Loading Jobs</h2>
                <p className="text-gray-600 mt-2">{error}</p>
                <button
                    className="mt-4 btn btn-primary"
                    onClick={() => window.location.reload()}
                >
                    Retry
                </button>
            </div>
        );
    }

    if (sortedJobs.length === 0) {
        return (
            <div className="card">
                <h2 className="card-title">Transcription Jobs</h2>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center mt-4">
                    <p className="text-gray-600 font-medium">No transcription jobs yet</p>
                    <p className="text-sm mt-2 text-gray-500">Record some audio to get started</p>
                </div>
            </div>
        );
    }

    // Determine LLM provider
    const getLlmProvider = (jobId: string): string => {
        // In a real app, we'd have this info from the backend
        // Here we're using a simple heuristic based on job ID
        return jobId.charCodeAt(0) % 2 === 0 ? "OpenAI" : "Anthropic";
    };

    return (
        <div className="card overflow-auto" style={{ maxHeight: '550px' }}>
            <h2 className="card-title sticky top-0 bg-white z-10 pb-2">Transcription Jobs</h2>
            <div className="space-y-3 mt-3">
                {sortedJobs.map((job) => (
                    <div
                        key={job.jobId}
                        className={`border rounded-lg p-3 hover:shadow-sm transition-all ${
                            job.status === 'completed' ? 'border-green-200 bg-green-50' :
                                job.status === 'error' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                        }`}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-600">
                    {job.jobId.split('-')[0]}
                  </span>
                                    {getStatusBadge(job.status)}
                                </div>
                                <span className="text-xs mt-1 text-gray-500">
                  Started at {formatTime(job.createdAt)}
                </span>
                            </div>
                        </div>

                        {/* Progress bar */}
                        {job.status !== 'completed' && job.status !== 'error' && (
                            <div className="mt-2">
                                <div className="progress-bar">
                                    <div
                                        className="progress-bar-fill"
                                        style={{ width: `${job.progress * 100}%` }}
                                    ></div>
                                </div>
                                <span className="text-xs text-gray-500 mt-0.5 inline-block">
                  {Math.round(job.progress * 100)}% complete
                </span>
                            </div>
                        )}

                        {/* Error message */}
                        {job.error && (
                            <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
                                Error: {job.error}
                            </div>
                        )}

                        {/* Completed transcription */}
                        {job.status === 'completed' && job.transcription && (
                            <>
                                <div className="mt-2">
                                    <p className="text-xs text-gray-700 truncate bg-white p-1.5 rounded border border-gray-200">
                                        {job.transcription.substring(0, 40)}
                                        {job.transcription.length > 40 ? '...' : ''}
                                    </p>
                                    {job.category && (
                                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                                            <span className="text-xs text-gray-500">Model:</span>
                                            <span className={`px-1 py-0.5 rounded text-xs ${
                                                getLlmProvider(job.jobId) === 'OpenAI'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-indigo-100 text-indigo-800'
                                            }`}>
                        {getLlmProvider(job.jobId)}
                      </span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-2">
                                    <button
                                        onClick={() => onSelectTranscription(job.transcription!, job.jobId)}
                                        className="w-full btn bg-indigo-100 hover:bg-indigo-200 text-indigo-700 py-1 text-xs"
                                    >
                                        View Result
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default JobsList;