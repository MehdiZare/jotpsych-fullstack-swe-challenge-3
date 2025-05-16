// src/components/VersionAlert.tsx
import React, { useState, useEffect } from 'react';

interface VersionMismatchDetail {
    backendVersion: string;
    frontendVersion: string;
}

const VersionAlert: React.FC = () => {
    const [showAlert, setShowAlert] = useState(false);
    const [versionDetail, setVersionDetail] = useState<VersionMismatchDetail | null>(null);

    useEffect(() => {
        // Listen for version mismatch events
        const handleVersionMismatch = (event: CustomEvent<VersionMismatchDetail>) => {
            setVersionDetail(event.detail);
            setShowAlert(true);
        };

        // Add event listener (with type assertion for CustomEvent)
        window.addEventListener('versionMismatch',
            handleVersionMismatch as EventListener);

        // Cleanup listener on component unmount
        return () => {
            window.removeEventListener('versionMismatch',
                handleVersionMismatch as EventListener);
        };
    }, []);

    if (!showAlert) {
        return null;
    }

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-red-600">
                        Application Update Required
                    </h3>
                </div>
                <div className="mt-4">
                    <p className="text-gray-700">
                        The application has been updated. Please refresh your browser to ensure
                        everything works correctly.
                    </p>
                    {versionDetail && (
                        <div className="mt-2 text-sm text-gray-500">
                            <p>Current version: {versionDetail.frontendVersion}</p>
                            <p>Latest version: {versionDetail.backendVersion}</p>
                        </div>
                    )}
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleRefresh}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium"
                    >
                        Refresh Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VersionAlert;