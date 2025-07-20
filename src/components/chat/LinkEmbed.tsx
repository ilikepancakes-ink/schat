'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, Globe, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { LinkMetadata } from '@/lib/url-utils';
import { apiClient } from '@/lib/api-client';

interface LinkEmbedProps {
  url: string;
  className?: string;
}

interface EmbedState {
  loading: boolean;
  metadata: LinkMetadata | null;
  error: string | null;
  imageError: boolean;
}

export default function LinkEmbed({ url, className = '' }: LinkEmbedProps) {
  const [state, setState] = useState<EmbedState>({
    loading: true,
    metadata: null,
    error: null,
    imageError: false
  });

  useEffect(() => {
    let isMounted = true;

    const fetchMetadata = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        const response = await apiClient.post('/api/link-metadata', {
          url
        }, {
          credentials: 'include'
        });

        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setState(prev => ({
              ...prev,
              loading: false,
              metadata: data.metadata
            }));
          } else {
            setState(prev => ({
              ...prev,
              loading: false,
              error: data.error || 'Failed to load link preview'
            }));
          }
        } else {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to load link preview'
          }));
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching link metadata:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load link preview'
        }));
      }
    };

    fetchMetadata();

    return () => {
      isMounted = false;
    };
  }, [url]);

  const handleImageError = () => {
    setState(prev => ({ ...prev, imageError: true }));
  };

  const handleLinkClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (state.loading) {
    return (
      <div className={`border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-800 animate-pulse ${className}`}>
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="w-24 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
        <div className="w-3/4 h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
        <div className="w-full h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    );
  }

  if (state.error || !state.metadata) {
    return (
      <div className={`border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-800 ${className}`}>
        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
          <AlertCircle size={16} />
          <span className="text-sm">Unable to load link preview</span>
        </div>
        <button
          onClick={handleLinkClick}
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm mt-1 flex items-center space-x-1"
        >
          <ExternalLink size={12} />
          <span className="truncate">{url}</span>
        </button>
      </div>
    );
  }

  const { metadata } = state;

  return (
    <div className={`border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer ${className}`}>
      <button
        onClick={handleLinkClick}
        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
      >
        {/* Image */}
        {metadata.image && !state.imageError && (
          <div className="aspect-video w-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <img
              src={metadata.image}
              alt={metadata.title || 'Link preview'}
              className="w-full h-full object-cover"
              onError={handleImageError}
              loading="lazy"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-3">
          {/* Domain */}
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 text-xs mb-2">
            <Globe size={12} />
            <span className="truncate">{metadata.siteName || metadata.domain}</span>
            <ExternalLink size={10} />
          </div>

          {/* Title */}
          {metadata.title && (
            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1 overflow-hidden" style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              {metadata.title}
            </h3>
          )}

          {/* Description */}
          {metadata.description && (
            <p className="text-gray-600 dark:text-gray-300 text-xs overflow-hidden" style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              {metadata.description}
            </p>
          )}

          {/* URL fallback if no title */}
          {!metadata.title && (
            <p className="text-blue-600 dark:text-blue-400 text-sm truncate">
              {url}
            </p>
          )}
        </div>
      </button>
    </div>
  );
}
