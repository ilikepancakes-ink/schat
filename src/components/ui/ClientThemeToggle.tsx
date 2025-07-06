'use client';

import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface ClientThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ClientThemeToggle({ className = '', showLabel = false }: ClientThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Only render after hydration to avoid SSR mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder during SSR that matches the expected structure
    return (
      <button
        className={`
          flex items-center gap-2 p-2 rounded-lg transition-all duration-200
          bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700
          text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100
          border border-gray-200 dark:border-gray-700
          ${className}
        `}
        disabled
        aria-label="Theme toggle loading"
      >
        <Sun className="w-4 h-4" />
        {showLabel && (
          <span className="text-sm font-medium">
            Theme
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        flex items-center gap-2 p-2 rounded-lg transition-all duration-200
        bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700
        text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100
        border border-gray-200 dark:border-gray-700
        ${className}
      `}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="w-4 h-4" />
      ) : (
        <Sun className="w-4 h-4" />
      )}
      {showLabel && (
        <span className="text-sm font-medium">
          {theme === 'light' ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}
