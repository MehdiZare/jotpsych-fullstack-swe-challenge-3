// src/App.tsx
import React, { useState, useEffect } from "react";
import AudioRecorder from "./components/AudioRecorder";
import JobsList from "./components/JobsList";
import CategoryDisplay from "./components/CategoryDisplay";
import VersionAlert from "./components/VersionAlert";
import APIService from "./services/APIService";
import { TranscriptCategory } from "./types/api";

function App() {
    const [transcription, setTranscription] = useState<string>("");
    const [category, setCategory] = useState<TranscriptCategory | null>(null);
    const [initialized, setInitialized] = useState(false);
    const [initError, setInitError] = useState<string | null>(null);
    const [jobsUpdated, setJobsUpdated] = useState(0); // Counter to trigger re-renders

    // Check version and initialize on component mount
    useEffect(() => {
        const initialize = async () => {
            try {
                console.log("Initializing application...");
                // Check backend version
                const versionResponse = await APIService.getBackendVersion();
                if (versionResponse.error) {
                    console.error("Error checking backend version:", versionResponse.error);
                    setInitError("Could not connect to the server. Please try again later.");
                    setInitialized(true);
                    return;
                }

                // Initialize user ID if not already set
                if (!localStorage.getItem('userId')) {
                    console.log("No user ID found, requesting new one...");
                    const userResponse = await APIService.getUser();
                    if (userResponse.error) {
                        console.error("Error getting user ID:", userResponse.error);
                        setInitError("Failed to initialize user. Please refresh and try again.");
                        setInitialized(true);
                        return;
                    }

                    if (userResponse.data) {
                        localStorage.setItem('userId', userResponse.data);
                        console.log("New user ID set:", userResponse.data);
                    }
                } else {
                    console.log("Using existing user ID:", localStorage.getItem('userId'));
                }

                setInitialized(true);
            } catch (error) {
                console.error("Exception during initialization:", error);
                setInitError("An unexpected error occurred. Please refresh and try again.");
                setInitialized(true);
            }
        };

        initialize();
    }, []);

    const handleTranscriptionSelect = (text: string, jobId: string) => {
        console.log(`Selected transcription from job ${jobId}`);
        setTranscription(text);

        // Find the job with this ID to get its category
        const jobs = APIService.getActiveJobs();
        const job = jobs.get(jobId);

        if (job && job.category) {
            console.log("Found category for selected job:", job.category);
            setCategory(job.category);
        } else {
            console.log("No category found for job:", jobId);
            setCategory(null);
        }

        // Scroll to the top to show the selected transcription
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleJobStarted = () => {
        // Increment the counter to trigger re-render
        setJobsUpdated(prev => prev + 1);
    };

    if (!initialized) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (initError) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full text-center">
                    <div className="text-red-600 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-red-700 mb-2">Connection Error</h2>
                    <p className="text-gray-700 mb-4">{initError}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg w-full"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center p-4 pb-16 bg-gray-50">
            {/* Version alert will appear when needed */}
            <VersionAlert />

            <h1 className="text-2xl font-bold mb-8 mt-4">Audio Transcription Demo</h1>

            <div className="w-full max-w-lg mb-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Record Audio</h2>
                    <AudioRecorder onJobStarted={handleJobStarted} />
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                            User ID: {localStorage.getItem('userId')?.substring(0, 8)}...
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Your audio will be transcribed and categorized using your preferred LLM provider.
                        </p>
                    </div>
                </div>
            </div>

            {transcription && (
                <div className="w-full max-w-lg mb-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-lg font-semibold mb-3">Selected Transcription:</h2>
                        <p className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-3 rounded border border-gray-200">
                            {transcription}
                        </p>

                        {category ? (
                            <CategoryDisplay category={category} />
                        ) : (
                            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                                <p className="text-sm text-gray-600">No categorization data available for this transcription.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* JobsList will only render if there are jobs */}
            <JobsList
                onSelectTranscription={handleTranscriptionSelect}
                key={`jobs-list-${jobsUpdated}`}
            />

            <div className="mt-auto pt-8 text-sm text-center">
                <p className="text-gray-500">Intelligent Audio Transcription Demo</p>
                <p className="text-xs mt-1 text-gray-400">With LLM-powered categorization</p>
            </div>
        </div>
    );
}

export default App;