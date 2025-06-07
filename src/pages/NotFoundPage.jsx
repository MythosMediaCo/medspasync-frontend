import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext.js';

const NotFoundPage = React.memo(() => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const handleGoHome = useCallback(() => {
        navigate(isAuthenticated ? '/dashboard' : '/');
    }, [isAuthenticated, navigate]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <span className="text-3xl" role="img" aria-label="Magnifying glass">🔍</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
                <p className="text-gray-600 mb-6">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <div className="space-y-3">
                    <button
                        onClick={handleGoHome}
                        className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                        {isAuthenticated ? 'Go to Dashboard' : 'Go Home'}
                    </button>
                </div>
            </div>
        </div>
    );
});

export default NotFoundPage;