/**
 * URL detection and processing utilities for link embeds
 */

export interface DetectedUrl {
  url: string;
  startIndex: number;
  endIndex: number;
  domain: string;
}

export interface LinkMetadata {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  domain: string;
  siteName?: string;
  type?: string;
}

/**
 * Regular expression to detect URLs in text
 * Matches http:// and https:// URLs
 */
const URL_REGEX = /https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?/gi;

/**
 * Detect URLs in a text string
 */
export function detectUrls(text: string): DetectedUrl[] {
  const urls: DetectedUrl[] = [];
  let match;
  
  // Reset regex lastIndex to ensure we start from the beginning
  URL_REGEX.lastIndex = 0;
  
  while ((match = URL_REGEX.exec(text)) !== null) {
    const url = match[0];
    
    try {
      const urlObj = new URL(url);
      urls.push({
        url: url,
        startIndex: match.index,
        endIndex: match.index + url.length,
        domain: urlObj.hostname
      });
    } catch (error) {
      // Skip invalid URLs
      console.warn('Invalid URL detected:', url, error);
    }
  }
  
  return urls;
}

/**
 * Check if a URL is safe to fetch (prevent SSRF attacks)
 */
export function isSafeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Block localhost and private IP ranges
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.16.') ||
        hostname.startsWith('172.17.') ||
        hostname.startsWith('172.18.') ||
        hostname.startsWith('172.19.') ||
        hostname.startsWith('172.20.') ||
        hostname.startsWith('172.21.') ||
        hostname.startsWith('172.22.') ||
        hostname.startsWith('172.23.') ||
        hostname.startsWith('172.24.') ||
        hostname.startsWith('172.25.') ||
        hostname.startsWith('172.26.') ||
        hostname.startsWith('172.27.') ||
        hostname.startsWith('172.28.') ||
        hostname.startsWith('172.29.') ||
        hostname.startsWith('172.30.') ||
        hostname.startsWith('172.31.') ||
        hostname.startsWith('169.254.') || // Link-local
        hostname.startsWith('0.') ||
        hostname === '::1' ||
        hostname.startsWith('fc00:') ||
        hostname.startsWith('fd00:') ||
        hostname.startsWith('fe80:')) {
      return false;
    }
    
    // Only allow http and https protocols
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Extract domain from URL for display
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    return url;
  }
}

/**
 * Validate and normalize URL
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.toString();
  } catch (error) {
    // If URL is invalid, return as-is
    return url;
  }
}
