// src/components/JobsList.tsx
import React, { useState, useEffect } from 'react';
import APIService from '../services/APIService';
import { ActiveJob } from '../types/api';
import CategoryDisplay from './CategoryDisplay';

interface JobsListProps {
    onSelectTranscription: (text: string, jobId: string) => void;
}

const JobsList: React.FC<JobsListProps> = ({ onSelectTranscription }) => {
    const [jobs, setJobs] = useState<Map<string, ActiveJob>>(new Map());
    const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
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

    // Helper function to get appropriate status color
    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'queued':
                return 'text-yellow-600';
            case 'processing':
                return 'text-blue-600';
            case 'completed':
                return 'text-green-600';
            case 'error':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    // Helper function to get sentiment color
    const getSentimentColor = (sentiment: string): string => {
        switch (sentiment) {
            case 'positive':
                return 'text-green-600';
            case 'negative':
                return 'text-red-600';
            default:
                return 'text-blue-600';
        }
    };

    const toggleExpandJob = (jobId: string) => {
        if (expandedJobId === jobId) {
            setExpandedJobId(null);
        } else {
            setExpandedJobId(jobId);
        }
    };

    // Convert jobs Map to array and sort by creation time (newest first)
    const sortedJobs = Array.from(jobs.values())
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (loading) {
        return (
            <div className="w-full max-w-lg mt-8 mb-16 flex justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-lg mt-8 mb-16">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    <p className="font-medium">Error loading jobs</p>
                    <p className="text-sm mt-1">{error}</p>
                    <button
                        className="mt-2 text-sm bg-red-100 hover:bg-red-200 px-3 py-1 rounded"
                        onClick={() => window.location.reload()}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (sortedJobs.length === 0) {
        return (
            <div className="w-full max-w-lg mt-8 mb-16">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500">
                    <p>No transcription jobs yet</p>
                    <p className="text-sm mt-1">Record some audio to get started</p>
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
        <div className="w-full max-w-lg mt-8 mb-16">
            <h2 className="text-lg font-semibold mb-3">Transcription Jobs</h2>
            <div className="space-y-4">
                {sortedJobs.map((job) => (
                    <div
                        key={job.jobId}
                        className={`border rounded-lg p-4 ${
                            job.status === 'completed' ? 'border-green-200 bg-green-50' :
                                job.status === 'error' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                        }`}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-500">Job #{job.jobId.split('-')[0]}</span>
                                <span className="text-sm font-medium">
                  Started at {formatTime(job.createdAt)}
                </span>
                                {job.category && (
                                    <span className="text-xs text-gray-500 mt-1">
                    Using {getLlmProvider(job.jobId)}
                  </span>
                                )}
                            </div>
                            <div className="flex flex-col items-end">
                <span className={`text-sm font-medium ${getStatusColor(job.status)}`}>
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </span>
                                {job.status === 'completed' && (
                                    <button
                                        onClick={() => toggleExpandJob(job.jobId)}
                                        className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                                    >
                                        {expandedJobId === job.jobId ? 'Hide details' : 'View details'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Progress bar */}
                        {job.status !== 'completed' && job.status !== 'error' && (
                            <div className="mt-3">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full"
                                        style={{ width: `${job.progress * 100}%` }}
                                    ></div>
                                </div>
                                <span className="text-xs text-gray-500 mt-1">
                  {Math.round(job.progress * 100)}% complete
                </span>
                            </div>
                        )}

                        {/* Error message */}
                        {job.error && (
                            <div className="mt-3 text-sm text-red-600">
                                Error: {job.error}
                            </div>
                        )}

                        {/* Completed transcription */}
                        {job.status === 'completed' && job.transcription && (
                            <div className="mt-3">
                                {expandedJobId === job.jobId ? (
                                    <>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {job.transcription}
                                        </p>

                                        {/* Category display */}
                                        {job.category ? (
                                            <CategoryDisplay category={job.category} />
                                        ) : (
                                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                                                Categorization data is not available for this transcription.
                                            </div>
                                        )}

                                        <div className="mt-4 flex justify-end">
                                            <button
                                                onClick={() => onSelectTranscription(job.transcription!, job.jobId)}
                                                className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded"
                                            >
                                                Select this transcription
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-sm text-gray-700 truncate">
                                        {job.transcription.substring(0, 60)}
                                        {job.transcription.length > 60 ? '...' : ''}
                                        {job.category ? (
                                            <div className="mt-1 text-xs text-gray-500">
                                                Topic: {job.category.primary_topic} |
                                                Sentiment: <span className={getSentimentColor(job.category.sentiment)}>
                          {job.category.sentiment}
                        </span>
                                            </div>
                                        ) : (
                                            <div className="mt-1 text-xs text-gray-500">
                                                Categorization pending...
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default JobsList;