/**
 * Tests for message content parser
 */

import { 
  parseMessageContent, 
  extractUrlsFromMessage, 
  isUrlOnlyMessage, 
  getTextWithoutUrls,
  replaceUrlsWithPlaceholder 
} from '../message-parser';

describe('Message Parser', () => {
  describe('parseMessageContent', () => {
    it('should parse text without URLs', () => {
      const content = 'This is just regular text.';
      const result = parseMessageContent(content);
      
      expect(result.hasLinks).toBe(false);
      expect(result.linkCount).toBe(0);
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0]).toEqual({
        type: 'text',
        content: 'This is just regular text.'
      });
    });

    it('should parse text with single URL', () => {
      const content = 'Check out https://example.com for more info';
      const result = parseMessageContent(content);
      
      expect(result.hasLinks).toBe(true);
      expect(result.linkCount).toBe(1);
      expect(result.segments).toHaveLength(3);
      
      expect(result.segments[0]).toEqual({
        type: 'text',
        content: 'Check out '
      });
      
      expect(result.segments[1]).toEqual({
        type: 'link',
        url: 'https://example.com',
        domain: 'example.com'
      });
      
      expect(result.segments[2]).toEqual({
        type: 'text',
        content: ' for more info'
      });
    });

    it('should parse text with multiple URLs', () => {
      const content = 'Visit https://example.com and http://test.org';
      const result = parseMessageContent(content);
      
      expect(result.hasLinks).toBe(true);
      expect(result.linkCount).toBe(2);
      expect(result.segments).toHaveLength(4);
      
      expect(result.segments[1].type).toBe('link');
      expect(result.segments[3].type).toBe('link');
    });

    it('should handle URL at the beginning', () => {
      const content = 'https://example.com is a great site';
      const result = parseMessageContent(content);
      
      expect(result.segments[0]).toEqual({
        type: 'link',
        url: 'https://example.com',
        domain: 'example.com'
      });
    });

    it('should handle URL at the end', () => {
      const content = 'Check out https://example.com';
      const result = parseMessageContent(content);
      
      expect(result.segments[1]).toEqual({
        type: 'link',
        url: 'https://example.com',
        domain: 'example.com'
      });
    });

    it('should handle only URLs', () => {
      const content = 'https://example.com';
      const result = parseMessageContent(content);
      
      expect(result.hasLinks).toBe(true);
      expect(result.linkCount).toBe(1);
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].type).toBe('link');
    });
  });

  describe('extractUrlsFromMessage', () => {
    it('should extract all URLs from message', () => {
      const content = 'Visit https://example.com and http://test.org for info';
      const urls = extractUrlsFromMessage(content);
      
      expect(urls).toEqual(['https://example.com', 'http://test.org']);
    });

    it('should return empty array for text without URLs', () => {
      const content = 'This is just text';
      const urls = extractUrlsFromMessage(content);
      
      expect(urls).toEqual([]);
    });
  });

  describe('isUrlOnlyMessage', () => {
    it('should return true for URL-only message', () => {
      expect(isUrlOnlyMessage('https://example.com')).toBe(true);
      expect(isUrlOnlyMessage(' https://example.com ')).toBe(true);
    });

    it('should return false for message with text and URL', () => {
      expect(isUrlOnlyMessage('Check out https://example.com')).toBe(false);
    });

    it('should return false for text without URLs', () => {
      expect(isUrlOnlyMessage('Just some text')).toBe(false);
    });

    it('should return true for multiple URLs without text', () => {
      expect(isUrlOnlyMessage('https://example.com http://test.org')).toBe(true);
    });
  });

  describe('getTextWithoutUrls', () => {
    it('should return text without URLs', () => {
      const content = 'Check out https://example.com for more info';
      const result = getTextWithoutUrls(content);
      
      expect(result).toBe('Check out  for more info');
    });

    it('should return original text if no URLs', () => {
      const content = 'Just some text';
      const result = getTextWithoutUrls(content);
      
      expect(result).toBe('Just some text');
    });

    it('should return empty string for URL-only message', () => {
      const content = 'https://example.com';
      const result = getTextWithoutUrls(content);
      
      expect(result).toBe('');
    });
  });

  describe('replaceUrlsWithPlaceholder', () => {
    it('should replace URLs with default placeholder', () => {
      const content = 'Check out https://example.com for info';
      const result = replaceUrlsWithPlaceholder(content);
      
      expect(result).toBe('Check out [LINK] for info');
    });

    it('should replace URLs with custom placeholder', () => {
      const content = 'Visit https://example.com and http://test.org';
      const result = replaceUrlsWithPlaceholder(content, '[URL]');
      
      expect(result).toBe('Visit [URL] and [URL]');
    });

    it('should return original text if no URLs', () => {
      const content = 'Just some text';
      const result = replaceUrlsWithPlaceholder(content);
      
      expect(result).toBe('Just some text');
    });
  });
});
