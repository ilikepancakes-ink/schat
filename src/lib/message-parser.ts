/**
 * Message content parser for handling text and link embeds
 */

import { detectUrls, DetectedUrl } from './url-utils';

export interface TextSegment {
  type: 'text';
  content: string;
}

export interface LinkSegment {
  type: 'link';
  url: string;
  domain: string;
}

export type MessageSegment = TextSegment | LinkSegment;

export interface ParsedMessage {
  segments: MessageSegment[];
  hasLinks: boolean;
  linkCount: number;
}

/**
 * Parse message content into segments of text and links
 */
export function parseMessageContent(content: string): ParsedMessage {
  const urls = detectUrls(content);
  
  if (urls.length === 0) {
    return {
      segments: [{ type: 'text', content }],
      hasLinks: false,
      linkCount: 0
    };
  }

  const segments: MessageSegment[] = [];
  let lastIndex = 0;

  // Sort URLs by their position in the text
  const sortedUrls = urls.sort((a, b) => a.startIndex - b.startIndex);

  for (const url of sortedUrls) {
    // Add text before the URL
    if (url.startIndex > lastIndex) {
      const textContent = content.slice(lastIndex, url.startIndex);
      if (textContent.trim()) {
        segments.push({
          type: 'text',
          content: textContent
        });
      }
    }

    // Add the URL as a link segment
    segments.push({
      type: 'link',
      url: url.url,
      domain: url.domain
    });

    lastIndex = url.endIndex;
  }

  // Add remaining text after the last URL
  if (lastIndex < content.length) {
    const textContent = content.slice(lastIndex);
    if (textContent.trim()) {
      segments.push({
        type: 'text',
        content: textContent
      });
    }
  }

  return {
    segments,
    hasLinks: true,
    linkCount: urls.length
  };
}

/**
 * Extract all URLs from message content
 */
export function extractUrlsFromMessage(content: string): string[] {
  const urls = detectUrls(content);
  return urls.map(url => url.url);
}

/**
 * Check if message contains only URLs (no other text)
 */
export function isUrlOnlyMessage(content: string): boolean {
  const parsed = parseMessageContent(content);
  
  if (!parsed.hasLinks) {
    return false;
  }

  // Check if all segments are links or empty text
  return parsed.segments.every(segment => 
    segment.type === 'link' || 
    (segment.type === 'text' && !segment.content.trim())
  );
}

/**
 * Get text content without URLs
 */
export function getTextWithoutUrls(content: string): string {
  const parsed = parseMessageContent(content);
  
  return parsed.segments
    .filter(segment => segment.type === 'text')
    .map(segment => segment.content)
    .join('')
    .trim();
}

/**
 * Replace URLs in text with placeholders
 */
export function replaceUrlsWithPlaceholder(content: string, placeholder: string = '[LINK]'): string {
  const urls = detectUrls(content);
  
  if (urls.length === 0) {
    return content;
  }

  let result = content;
  
  // Replace URLs from end to start to maintain correct indices
  for (let i = urls.length - 1; i >= 0; i--) {
    const url = urls[i];
    result = result.slice(0, url.startIndex) + placeholder + result.slice(url.endIndex);
  }

  return result;
}
