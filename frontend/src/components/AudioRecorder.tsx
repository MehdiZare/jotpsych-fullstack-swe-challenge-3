// src/components/AudioRecorder.tsx
import React, { useState, useEffect } from "react";
import APIService from "../services/APIService";

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
                                                       onTranscriptionComplete
                                                     }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [finalRecordingTime, setFinalRecordingTime] = useState(0);

  const MAX_RECORDING_TIME = 10;

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setFinalRecordingTime(recordingTime);
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
    }

    return () => {
      clearInterval(interval);
    };
  }, [isRecording, recordingTime]);

  const startRecording = async () => {
    try {
      setRecordingTime(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });

        // Set transcribing state to true
        setIsTranscribing(true);

        try {
          // Use APIService instead of direct fetch
          const response = await APIService.transcribeAudio(audioBlob);

          if (response.data) {
            onTranscriptionComplete(response.data);
          } else if (response.error) {
            console.error("Transcription error:", response.error);
          }
        } catch (error) {
          console.error("Error sending audio:", error);
        } finally {
          // Set transcribing state to false when done
          setIsTranscribing(false);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  return (
      <div className="flex flex-col items-center gap-4">
        {finalRecordingTime > 0 && !isTranscribing && (
            <p className="text-sm text-gray-600">
              Final recording time: {finalRecordingTime}s
            </p>
        )}

        {!isTranscribing ? (
            <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-6 py-3 rounded-lg font-semibold ${
                    isRecording
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
                disabled={isTranscribing}
            >
              {isRecording
                  ? `Stop Recording (${MAX_RECORDING_TIME - recordingTime}s)`
                  : "Start Recording"}
            </button>
        ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-600">Transcribing your audio...</p>
            </div>
        )}

        {isRecording && (
            <p className="text-sm text-gray-600">
              Recording in progress (Current time: {recordingTime}s)
            </p>
        )}
      </div>
  );
};

export default AudioRecorder;