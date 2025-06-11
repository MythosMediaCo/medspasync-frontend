import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext.jsx';
import { useThemeMode } from '../hooks/useThemeMode.js';

const TopNav = () => {
  const navigate = useNavigate();
  const { isAuthenticated, firstName, logout } = useAuth();

  const { darkMode, toggleDarkMode } = useThemeMode();

  const [menuOpen, setMenuOpen] = useState(false);


  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="h-9 w-9 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow">
            <span className="text-white font-bold text-md">M</span>
          </div>
          <span className="ml-3 text-lg font-semibold tracking-tight">MedSpaSync Pro</span>
        </div>
        <div className="relative flex items-center space-x-4">
          <button
            onClick={toggleDarkMode}
            className="text-sm px-3 py-1 border rounded-lg border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="bg-indigo-600 text-white px-3 py-1 rounded-lg flex items-center"
              >
                {firstName ? `Hi, ${firstName}` : 'Account'}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50">
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/profile'); }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="text-gray-700 dark:text-gray-200 hover:text-indigo-600 transition font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg shadow transition"
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;
