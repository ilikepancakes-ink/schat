import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { isSafeUrl, extractDomain, LinkMetadata } from '@/lib/url-utils';

export const runtime = 'nodejs';

// Cache for link metadata to avoid repeated requests
const metadataCache = new Map<string, { data: LinkMetadata; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

/**
 * Extract metadata from HTML content
 */
function extractMetadataFromHtml(html: string, url: string): LinkMetadata {
  const domain = extractDomain(url);
  
  // Basic regex patterns for meta tags
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  const twitterTitleMatch = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i);
  
  const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const ogDescriptionMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  const twitterDescriptionMatch = html.match(/<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i);
  
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
  
  const ogSiteNameMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
  const ogTypeMatch = html.match(/<meta[^>]*property=["']og:type["'][^>]*content=["']([^"']+)["']/i);
  
  // Prefer Open Graph tags, then Twitter, then fallback to basic HTML
  const title = ogTitleMatch?.[1] || twitterTitleMatch?.[1] || titleMatch?.[1];
  const description = ogDescriptionMatch?.[1] || twitterDescriptionMatch?.[1] || descriptionMatch?.[1];
  const image = ogImageMatch?.[1] || twitterImageMatch?.[1];
  
  // Resolve relative image URLs
  let resolvedImage = image;
  if (image && !image.startsWith('http')) {
    try {
      const baseUrl = new URL(url);
      resolvedImage = new URL(image, baseUrl.origin).toString();
    } catch (error) {
      resolvedImage = undefined;
    }
  }
  
  return {
    url,
    title: title?.trim(),
    description: description?.trim(),
    image: resolvedImage,
    domain,
    siteName: ogSiteNameMatch?.[1]?.trim(),
    type: ogTypeMatch?.[1]?.trim()
  };
}

/**
 * Fetch link metadata with security checks
 */
async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
  // Check cache first
  const cached = metadataCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  // Security check
  if (!isSafeUrl(url)) {
    throw new Error('URL is not safe to fetch');
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'SchoolChat-LinkBot/1.0 (+https://chat.ilikepancakes.ink)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: controller.signal,
      redirect: 'follow',
      // Limit response size to prevent abuse
      size: 1024 * 1024 // 1MB limit
    } as any);
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      // For non-HTML content, return basic metadata
      const metadata: LinkMetadata = {
        url,
        domain: extractDomain(url),
        title: extractDomain(url),
        type: contentType.split('/')[0] || 'unknown'
      };
      
      // Cache the result
      metadataCache.set(url, { data: metadata, timestamp: Date.now() });
      return metadata;
    }
    
    const html = await response.text();
    const metadata = extractMetadataFromHtml(html, url);
    
    // Cache the result
    metadataCache.set(url, { data: metadata, timestamp: Date.now() });
    
    return metadata;
    
  } catch (error) {
    console.error('Error fetching link metadata:', error);
    
    // Return basic metadata on error
    const fallbackMetadata: LinkMetadata = {
      url,
      domain: extractDomain(url),
      title: extractDomain(url)
    };
    
    return fallbackMetadata;
  }
}

// POST /api/link-metadata - Fetch metadata for a URL
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    const authResult = await validateSession(token);
    if (!authResult.valid || !authResult.user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid session',
      }, { status: 401 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'URL is required',
      }, { status: 400 });
    }

    const metadata = await fetchLinkMetadata(url);

    return NextResponse.json({
      success: true,
      metadata
    });

  } catch (error) {
    console.error('Link metadata API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch link metadata',
    }, { status: 500 });
  }
}
