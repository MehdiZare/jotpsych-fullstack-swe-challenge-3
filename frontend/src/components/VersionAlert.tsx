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
        <div className="modal-overlay animate-fade-in">
            <div className="modal-container max-w-md">
                <div className="modal-header">
                    <h3 className="text-lg font-semibold text-red-600">
                        Application Update Required
                    </h3>
                    <button
                        onClick={() => setShowAlert(false)}
                        className="close-button"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
                <div className="modal-body">
                    <div className="flex justify-center mb-4 text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="text-gray-700 mb-4">
                        The application has been updated. Please refresh your browser to ensure
                        everything works correctly.
                    </p>
                    {versionDetail && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-4">
                            <p className="text-sm text-gray-500">Current version: <span className="font-medium">{versionDetail.frontendVersion}</span></p>
                            <p className="text-sm text-gray-500">Latest version: <span className="font-medium text-indigo-600">{versionDetail.backendVersion}</span></p>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button
                        onClick={handleRefresh}
                        className="btn btn-primary"
                    >
                        Refresh Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VersionAlert;