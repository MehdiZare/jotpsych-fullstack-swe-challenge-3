// src/components/CategoryDisplay.tsx
import React from 'react';
import { TranscriptCategory } from '../types/api';

interface CategoryDisplayProps {
    category: TranscriptCategory;
}

const CategoryDisplay: React.FC<CategoryDisplayProps> = ({ category }) => {
    // Validation check to ensure we don't render with invalid data
    if (!category || typeof category !== 'object') {
        console.error("Invalid category data:", category);
        return (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">Error: Invalid category data</p>
            </div>
        );
    }

    // Validate required fields
    if (!category.primary_topic || !category.sentiment || !category.keywords || !category.summary) {
        console.error("Missing required fields in category:", category);
        return (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                    Warning: Incomplete category data received from the server
                </p>
            </div>
        );
    }

    // Get sentiment color
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

    // Get confidence color
    const getConfidenceColor = (confidence: number): string => {
        if (confidence >= 0.8) return 'text-green-600';
        if (confidence >= 0.5) return 'text-yellow-600';
        return 'text-red-600';
    };

    // Format confidence as percentage
    const formatConfidence = (confidence: number): string => {
        return `${Math.round(confidence * 100)}%`;
    };

    // Ensure keywords is an array
    const keywords = Array.isArray(category.keywords)
        ? category.keywords
        : typeof category.keywords === 'string'
            ? [category.keywords]
            : [];

    return (
        <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="font-medium text-lg mb-2">Transcription Analysis</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <p className="text-sm text-gray-500">Primary Topic</p>
                    <p className="font-medium">{category.primary_topic}</p>
                </div>

                <div>
                    <p className="text-sm text-gray-500">Sentiment</p>
                    <p className={`font-medium ${getSentimentColor(category.sentiment)}`}>
                        {category.sentiment.charAt(0).toUpperCase() + category.sentiment.slice(1)}
                    </p>
                </div>

                <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Keywords</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {keywords.map((keyword, index) => (
                            <span
                                key={index}
                                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                            >
                {keyword}
              </span>
                        ))}
                    </div>
                </div>

                <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Summary</p>
                    <p className="text-sm">{category.summary}</p>
                </div>

                <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Confidence</p>
                    <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${category.confidence * 100}%` }}
                            ></div>
                        </div>
                        <span className={`text-xs font-medium ${getConfidenceColor(category.confidence)}`}>
              {formatConfidence(category.confidence)}
            </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryDisplay;