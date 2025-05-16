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
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 font-medium">Error: Invalid category data</p>
            </div>
        );
    }

    // Validate required fields
    if (!category.primary_topic || !category.sentiment || !category.keywords || !category.summary) {
        console.error("Missing required fields in category:", category);
        return (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700 font-medium">
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
        if (confidence >= 0.8) return 'bg-green-500';
        if (confidence >= 0.5) return 'bg-yellow-500';
        return 'bg-red-500';
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
        <div className="mt-5 border border-indigo-100 rounded-lg p-5 bg-indigo-50">
            <h3 className="font-semibold text-indigo-800 mb-4">AI Analysis</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                    <p className="text-xs font-medium text-indigo-500 uppercase tracking-wide mb-1">Primary Topic</p>
                    <p className="font-medium text-gray-800">{category.primary_topic}</p>
                </div>

                <div className="bg-white p-3 rounded-lg shadow-sm">
                    <p className="text-xs font-medium text-indigo-500 uppercase tracking-wide mb-1">Sentiment</p>
                    <p className={`font-medium ${getSentimentColor(category.sentiment)}`}>
                        {category.sentiment.charAt(0).toUpperCase() + category.sentiment.slice(1)}
                    </p>
                </div>

                <div className="md:col-span-2 bg-white p-3 rounded-lg shadow-sm">
                    <p className="text-xs font-medium text-indigo-500 uppercase tracking-wide mb-2">Keywords</p>
                    <div className="flex flex-wrap gap-2">
                        {keywords.map((keyword, index) => (
                            <span
                                key={index}
                                className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-1 rounded-full"
                            >
                {keyword}
              </span>
                        ))}
                    </div>
                </div>

                <div className="md:col-span-2 bg-white p-3 rounded-lg shadow-sm">
                    <p className="text-xs font-medium text-indigo-500 uppercase tracking-wide mb-1">Summary</p>
                    <p className="text-gray-700">{category.summary}</p>
                </div>

                <div className="md:col-span-2 bg-white p-3 rounded-lg shadow-sm">
                    <p className="text-xs font-medium text-indigo-500 uppercase tracking-wide mb-2">Confidence</p>
                    <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div
                                className={`h-2.5 rounded-full ${getConfidenceColor(category.confidence)}`}
                                style={{ width: `${category.confidence * 100}%` }}
                            ></div>
                        </div>
                        <span className="text-sm font-medium">
              {formatConfidence(category.confidence)}
            </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryDisplay;