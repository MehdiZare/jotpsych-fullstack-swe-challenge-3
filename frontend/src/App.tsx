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
    const [jobsUpdated, setJobsUpdated] = useState(0); // Counter to trigger re-renders

    // Check version and initialize on component mount
    useEffect(() => {
        const initialize = async () => {
            try {
                // Check backend version
                await APIService.getBackendVersion();

                // Initialize user ID if not already set
                if (!localStorage.getItem('userId')) {
                    const userResponse = await APIService.getUser();
                    if (userResponse.data) {
                        localStorage.setItem('userId', userResponse.data);
                    }
                }

                setInitialized(true);
            } catch (error) {
                console.error("Failed to initialize:", error);
                setInitialized(true); // Still set to true so the app can function
            }
        };

        initialize();
    }, []);

    const handleTranscriptionSelect = (text: string) => {
        setTranscription(text);

        // Find the job with this transcription to get its category
        const jobs = APIService.getActiveJobs();
        for (const job of jobs.values()) {
            if (job.transcription === text && job.category) {
                setCategory(job.category);
                break;
            } else {
                setCategory(null);
            }
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
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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

                        {category && <CategoryDisplay category={category} />}
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