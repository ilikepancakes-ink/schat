/**
 * Tests for URL detection and processing utilities
 */

import { detectUrls, isSafeUrl, extractDomain, normalizeUrl } from '../url-utils';

describe('URL Utils', () => {
  describe('detectUrls', () => {
    it('should detect single HTTP URL', () => {
      const text = 'Check out this site: http://example.com';
      const urls = detectUrls(text);
      
      expect(urls).toHaveLength(1);
      expect(urls[0]).toEqual({
        url: 'http://example.com',
        startIndex: 22,
        endIndex: 40,
        domain: 'example.com'
      });
    });

    it('should detect single HTTPS URL', () => {
      const text = 'Visit https://secure.example.com for more info';
      const urls = detectUrls(text);
      
      expect(urls).toHaveLength(1);
      expect(urls[0]).toEqual({
        url: 'https://secure.example.com',
        startIndex: 6,
        endIndex: 33,
        domain: 'secure.example.com'
      });
    });

    it('should detect multiple URLs', () => {
      const text = 'Check http://example.com and https://test.org';
      const urls = detectUrls(text);
      
      expect(urls).toHaveLength(2);
      expect(urls[0].url).toBe('http://example.com');
      expect(urls[1].url).toBe('https://test.org');
    });

    it('should detect URLs with paths and query parameters', () => {
      const text = 'Visit https://example.com/path/to/page?param=value&other=123#section';
      const urls = detectUrls(text);
      
      expect(urls).toHaveLength(1);
      expect(urls[0].url).toBe('https://example.com/path/to/page?param=value&other=123#section');
    });

    it('should not detect invalid URLs', () => {
      const text = 'This is not a URL: ftp://example.com or mailto:test@example.com';
      const urls = detectUrls(text);
      
      expect(urls).toHaveLength(0);
    });

    it('should handle empty string', () => {
      const urls = detectUrls('');
      expect(urls).toHaveLength(0);
    });

    it('should handle text without URLs', () => {
      const text = 'This is just regular text without any links.';
      const urls = detectUrls(text);
      expect(urls).toHaveLength(0);
    });
  });

  describe('isSafeUrl', () => {
    it('should allow safe HTTPS URLs', () => {
      expect(isSafeUrl('https://example.com')).toBe(true);
      expect(isSafeUrl('https://github.com/user/repo')).toBe(true);
    });

    it('should allow safe HTTP URLs', () => {
      expect(isSafeUrl('http://example.com')).toBe(true);
    });

    it('should block localhost URLs', () => {
      expect(isSafeUrl('http://localhost:3000')).toBe(false);
      expect(isSafeUrl('https://localhost')).toBe(false);
    });

    it('should block private IP addresses', () => {
      expect(isSafeUrl('http://192.168.1.1')).toBe(false);
      expect(isSafeUrl('http://10.0.0.1')).toBe(false);
      expect(isSafeUrl('http://172.16.0.1')).toBe(false);
      expect(isSafeUrl('http://127.0.0.1')).toBe(false);
    });

    it('should block non-HTTP protocols', () => {
      expect(isSafeUrl('ftp://example.com')).toBe(false);
      expect(isSafeUrl('file:///etc/passwd')).toBe(false);
      expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    });

    it('should handle invalid URLs', () => {
      expect(isSafeUrl('not-a-url')).toBe(false);
      expect(isSafeUrl('')).toBe(false);
    });
  });

  describe('extractDomain', () => {
    it('should extract domain from HTTPS URL', () => {
      expect(extractDomain('https://example.com/path')).toBe('example.com');
    });

    it('should extract domain from HTTP URL', () => {
      expect(extractDomain('http://test.org')).toBe('test.org');
    });

    it('should extract domain with subdomain', () => {
      expect(extractDomain('https://api.github.com/users')).toBe('api.github.com');
    });

    it('should handle URLs with ports', () => {
      expect(extractDomain('http://example.com:8080')).toBe('example.com');
    });

    it('should return original string for invalid URLs', () => {
      expect(extractDomain('not-a-url')).toBe('not-a-url');
    });
  });

  describe('normalizeUrl', () => {
    it('should normalize valid URLs', () => {
      expect(normalizeUrl('https://example.com')).toBe('https://example.com/');
    });

    it('should return original string for invalid URLs', () => {
      expect(normalizeUrl('not-a-url')).toBe('not-a-url');
    });

    it('should handle URLs with paths', () => {
      const url = 'https://example.com/path/to/page';
      expect(normalizeUrl(url)).toBe(url);
    });
  });
});
