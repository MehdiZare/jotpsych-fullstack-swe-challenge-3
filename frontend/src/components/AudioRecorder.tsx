// src/components/AudioRecorder.tsx
import React, { useState, useEffect } from "react";
import APIService from "../services/APIService";

interface AudioRecorderProps {
  onJobStarted: () => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onJobStarted }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [jobStarting, setJobStarting] = useState(false);

  const MAX_RECORDING_TIME = 10;

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prevTime => {
          const newTime = prevTime + 1;
          if (newTime >= MAX_RECORDING_TIME) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return newTime;
        });
      }, 1000);
    } else {
      setRecordingTime(0); // Reset recording time when not recording
    }

    return () => {
      clearInterval(interval);
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      // Reset states
      setRecordingTime(0);
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunks, { type: "audio/wav" });

          // Indicate that we're starting to process
          setJobStarting(true);

          const response = await APIService.transcribeAudio(audioBlob);

          if (response.data) {
            console.log("Job started successfully:", response.data);
            // Notify parent that a new job has been started
            onJobStarted();
          } else if (response.error) {
            // Check if it's a version mismatch error
            if (response.stale) {
              // Let the VersionAlert component handle the UI
              console.error("Version mismatch:", response.error);
            } else {
              // Show other errors in the UI
              setError(response.error);
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          setError(`Error sending audio: ${errorMessage}`);
          console.error("Error sending audio:", error);
        } finally {
          setJobStarting(false);
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`Error accessing microphone: ${errorMessage}`);
      console.error("Error accessing microphone:", error);
    }
  };

  return (
      <div className="flex flex-col items-center">
        {/* Icon/Logo */}
        <div className="w-24 h-24 mb-4">
          {isRecording ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-red-500 animate-pulse flex items-center justify-center">
                  <div className="w-8 h-8 bg-white rounded-full"></div>
                </div>
              </div>
          ) : jobStarting ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
          ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              </div>
          )}
        </div>

        {/* Recording timer */}
        {isRecording && (
            <div className="mb-4 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
              Recording: {recordingTime}s / {MAX_RECORDING_TIME}s
            </div>
        )}

        {/* Status text */}
        <div className="mb-3 text-gray-600 text-center text-sm">
          {isRecording
              ? "Recording in progress..."
              : jobStarting
                  ? "Processing audio..."
                  : "Ready to record"}
        </div>

        {/* Record button - SMALLER SIZE */}
        <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={jobStarting}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                isRecording
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isRecording
              ? "Stop Recording"
              : "Start Recording"}
        </button>

        {/* Error message */}
        {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm w-full">
              {error}
            </div>
        )}
      </div>
  );
};

export default AudioRecorder;