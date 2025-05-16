// src/App.tsx
import React, { useState, useEffect } from "react";
import AudioRecorder from "./components/AudioRecorder";
import JobsList from "./components/JobsList";
import CategoryDisplay from "./components/CategoryDisplay";
import VersionAlert from "./components/VersionAlert";
import StatsDisplay from "./components/StatsDisplay";
import ResultModal from "./components/ResultModal";
import APIService from "./services/APIService";
import { TranscriptCategory } from "./types/api";

function App() {
    const [transcription, setTranscription] = useState<string>("");
    const [category, setCategory] = useState<TranscriptCategory | null>(null);
    const [initialized, setInitialized] = useState(false);
    const [initError, setInitError] = useState<string | null>(null);
    const [jobsUpdated, setJobsUpdated] = useState(0); // Counter to trigger re-renders
    const [showStats, setShowStats] = useState(false);
    const [showModal, setShowModal] = useState(false);

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

        // Show the modal with results
        setShowModal(true);
    };

    const handleJobStarted = () => {
        // Increment the counter to trigger re-render
        setJobsUpdated(prev => prev + 1);
    };

    const toggleStats = () => {
        setShowStats(!showStats);
    };

    const closeModal = () => {
        setShowModal(false);
    };

    if (!initialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-indigo-600 font-medium animate-pulse">Initializing application...</p>
                </div>
            </div>
        );
    }

    if (initError) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-white">
                <div className="bg-white border border-red-100 rounded-xl p-8 max-w-md w-full text-center shadow-lg animate-slide-up">
                    <div className="text-red-500 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">Connection Error</h2>
                    <p className="text-gray-600 mb-6">{initError}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn btn-primary w-full"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
            <div className="app-container w-full max-w-[1200px] h-[800px] bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
                {/* Version alert will appear when needed */}
                <VersionAlert />

                <header className="bg-white shadow-sm border-b border-indigo-100 px-6 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-indigo-700">
                            <span className="text-indigo-500">Audio</span>Transcriber
                        </h1>
                        <div className="flex gap-2">
                            <button
                                onClick={toggleStats}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
                            >
                                {showStats ? "Hide Stats" : "Show Stats"}
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6">
                    {showStats && <StatsDisplay />}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="card animate-fade-in">
                            <h2 className="card-title">Record Audio</h2>
                            <AudioRecorder onJobStarted={handleJobStarted} />
                            <div className="mt-5 pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-500">
                                    User ID: <span className="font-mono bg-gray-100 rounded px-1.5 py-0.5">{localStorage.getItem('userId')?.substring(0, 8)}...</span>
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Your audio will be transcribed and categorized using your preferred LLM provider.
                                </p>
                            </div>
                        </div>

                        <div>
                            {/* JobsList will only render if there are jobs */}
                            <JobsList
                                onSelectTranscription={handleTranscriptionSelect}
                                key={`jobs-list-${jobsUpdated}`}
                            />
                        </div>
                    </div>
                </main>

                <footer className="bg-white border-t border-indigo-100 px-6 py-3 text-center">
                    <p className="text-gray-500 font-medium text-sm">Intelligent Audio Transcription Demo</p>
                    <p className="text-xs mt-1 text-gray-400">With LLM-powered categorization & in-memory caching</p>
                </footer>
            </div>

            {/* Result Modal */}
            {showModal && (
                <ResultModal
                    transcription={transcription}
                    category={category}
                    onClose={closeModal}
                />
            )}
        </div>
    );
}

export default App;