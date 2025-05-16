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
  const [userId, setUserId] = useState<string | null>(null);
  const [jobStarting, setJobStarting] = useState(false);

  const MAX_RECORDING_TIME = 10;

  // Get user ID on component mount
  useEffect(() => {
    const getUserId = async () => {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        setUserId(storedUserId);
      } else {
        try {
          const response = await APIService.getUser();
          if (response.data) {
            setUserId(response.data);
          } else if (response.error) {
            console.error("Error getting user ID:", response.error);
          }
        } catch (err) {
          console.error("Exception getting user ID:", err);
        }
      }
    };

    getUserId();
  }, []);

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
      <div className="flex flex-col items-center gap-4">
        {userId && (
            <div className="text-xs text-gray-500 mb-1">
              User ID: {userId.substring(0, 8)}...
            </div>
        )}

        {jobStarting ? (
            <div className="flex flex-col items-center py-2">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-600 mt-2">Starting transcription job...</p>
            </div>
        ) : (
            <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-6 py-3 rounded-lg font-semibold ${
                    isRecording
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
                disabled={jobStarting}
            >
              {isRecording
                  ? `Stop Recording (${MAX_RECORDING_TIME - recordingTime}s)`
                  : "Start Recording"}
            </button>
        )}

        {isRecording && (
            <p className="text-sm text-gray-600">
              Recording in progress (Current time: {recordingTime}s)
            </p>
        )}

        {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
        )}
      </div>
  );
};

export default AudioRecorder;