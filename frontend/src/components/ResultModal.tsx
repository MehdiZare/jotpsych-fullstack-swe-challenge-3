// src/components/ResultModal.tsx
import React, { useEffect, useRef } from 'react';
import { TranscriptCategory } from '../types/api';
import CategoryDisplay from './CategoryDisplay';

interface ResultModalProps {
    transcription: string;
    category: TranscriptCategory | null;
    onClose: () => void;
}

const ResultModal: React.FC<ResultModalProps> = ({ transcription, category, onClose }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        // Add escape key listener
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscKey);

        // Prevent body scrolling when modal is open
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscKey);
            document.body.style.overflow = 'auto';
        };
    }, [onClose]);

    return (
        <div className="modal-overlay">
            <div
                ref={modalRef}
                className="modal-container"
                style={{ maxWidth: '800px' }}
            >
                <div className="modal-header">
                    <h2 className="text-lg font-bold text-gray-800">Transcription Result</h2>
                    <button
                        onClick={onClose}
                        className="close-button"
                        aria-label="Close modal"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    <div className="mb-4">
                        <h3 className="text-md font-semibold text-gray-800 mb-2">Transcription</h3>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 whitespace-pre-wrap text-gray-700 text-sm">
                            {transcription}
                        </div>
                    </div>

                    {category ? (
                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                            <h3 className="text-md font-semibold text-indigo-800 mb-2">Analysis</h3>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                    <p className="text-xs font-medium text-indigo-500 mb-1">Primary Topic</p>
                                    <p className="font-medium text-sm">{category.primary_topic}</p>
                                </div>

                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                    <p className="text-xs font-medium text-indigo-500 mb-1">Sentiment</p>
                                    <p className={`font-medium text-sm ${
                                        category.sentiment === 'positive'
                                            ? 'text-green-600'
                                            : category.sentiment === 'negative'
                                                ? 'text-red-600'
                                                : 'text-blue-600'
                                    }`}>
                                        {category.sentiment.charAt(0).toUpperCase() + category.sentiment.slice(1)}
                                    </p>
                                </div>

                                <div className="col-span-2 bg-white p-2 rounded-lg shadow-sm">
                                    <p className="text-xs font-medium text-indigo-500 mb-1">Keywords</p>
                                    <div className="flex flex-wrap gap-1">
                                        {Array.isArray(category.keywords) && category.keywords.map((keyword, index) => (
                                            <span
                                                key={index}
                                                className="bg-indigo-100 text-indigo-800 text-xs px-1.5 py-0.5 rounded-full"
                                            >
                        {keyword}
                      </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="col-span-2 bg-white p-2 rounded-lg shadow-sm">
                                    <p className="text-xs font-medium text-indigo-500 mb-1">Summary</p>
                                    <p className="text-gray-700 text-sm">{category.summary}</p>
                                </div>

                                <div className="col-span-2 bg-white p-2 rounded-lg shadow-sm">
                                    <p className="text-xs font-medium text-indigo-500 mb-1">Confidence</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-2 rounded-full ${
                                                    category.confidence >= 0.8
                                                        ? 'bg-green-500'
                                                        : category.confidence >= 0.5
                                                            ? 'bg-yellow-500'
                                                            : 'bg-red-500'
                                                }`}
                                                style={{ width: `${category.confidence * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs font-medium">
                      {Math.round(category.confidence * 100)}%
                    </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            <p className="text-yellow-700 text-sm">No categorization data available for this transcription.</p>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button
                        onClick={onClose}
                        className="btn btn-primary"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResultModal;