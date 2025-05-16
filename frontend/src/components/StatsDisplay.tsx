// src/components/StatsDisplay.tsx
import React, { useState, useEffect } from 'react';

interface CacheStats {
    name: string;
    entries: number;
    hits: number;
    misses: number;
    hit_rate: string;
}

interface Stats {
    transcription_cache: CacheStats;
    category_cache: CacheStats;
    user_preference_cache: CacheStats;
    active_jobs: number;
    users: number;
}

const StatsDisplay: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/stats');
            if (!response.ok) {
                throw new Error(`Failed to fetch stats: ${response.status}`);
            }
            const data = await response.json();
            setStats(data);
            setError(null);
        } catch (err) {
            console.error("Error fetching stats:", err);
            setError("Failed to load cache statistics");
        } finally {
            setLoading(false);
        }
    };

    const clearCache = async () => {
        try {
            const response = await fetch('http://localhost:8000/clear-cache', {
                method: 'POST'
            });
            if (!response.ok) {
                throw new Error(`Failed to clear cache: ${response.status}`);
            }
            // Refetch stats after clearing
            fetchStats();
        } catch (err) {
            console.error("Error clearing cache:", err);
            setError("Failed to clear cache");
        }
    };

    useEffect(() => {
        fetchStats();

        // Set up interval to refresh stats every 5 seconds
        const interval = setInterval(() => {
            fetchStats();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    if (loading && !stats) {
        return (
            <div className="card p-5 mb-6 animate-pulse">
                <h2 className="card-title">Cache Statistics</h2>
                <div className="flex justify-center py-6">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card p-5 mb-6 border-red-100">
                <h2 className="card-title text-red-600">Error Loading Statistics</h2>
                <p className="text-gray-600">{error}</p>
                <button
                    onClick={fetchStats}
                    className="mt-3 text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!stats) return null;

    const renderCacheStats = (cache: CacheStats) => {
        const hitRateNum = parseFloat(cache.hit_rate.replace('%', ''));
        let hitRateColor = "text-red-600";

        if (hitRateNum >= 80) hitRateColor = "text-green-600";
        else if (hitRateNum >= 50) hitRateColor = "text-yellow-600";

        return (
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <h3 className="font-medium text-gray-800 capitalize">{cache.name} Cache</h3>
                <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                        <p className="text-xs text-gray-500">Entries</p>
                        <p className="font-semibold">{cache.entries}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Hit Rate</p>
                        <p className={`font-semibold ${hitRateColor}`}>{cache.hit_rate}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Hits</p>
                        <p className="font-semibold text-green-600">{cache.hits}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Misses</p>
                        <p className="font-semibold text-red-600">{cache.misses}</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="card mb-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <h2 className="card-title m-0">Cache Statistics</h2>
                <button
                    onClick={clearCache}
                    className="text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg transition"
                >
                    Clear Cache
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {renderCacheStats(stats.transcription_cache)}
                {renderCacheStats(stats.category_cache)}
                {renderCacheStats(stats.user_preference_cache)}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
                <div>
                    <span className="text-gray-500">Active Jobs:</span>
                    <span className="font-medium ml-1">{stats.active_jobs}</span>
                </div>
                <div>
                    <span className="text-gray-500">Users:</span>
                    <span className="font-medium ml-1">{stats.users}</span>
                </div>
                <button
                    onClick={fetchStats}
                    className="text-indigo-500 hover:text-indigo-700"
                >
                    Refresh
                </button>
            </div>
        </div>
    );
};

export default StatsDisplay;