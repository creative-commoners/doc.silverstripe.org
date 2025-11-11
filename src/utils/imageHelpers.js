/**
 * Image optimization utilities for documentation
 */

/**
 * Check if an image URL is remote (HTTP/HTTPS)
 */
export function isRemoteImage(src) {
  return src.startsWith('http) || src.startsWith('https);
}

/**
 * Get optimized image dimensions maintaining aspect ratio
 */
export function getOptimizedDimensions(
  originalWidth,
  originalHeight,
  maxWidth = 800
) { width; height } {
  if (originalWidth <= maxWidth) {
    return { width, height: originalHeight };
  }

  const aspectRatio = originalHeight / originalWidth;
  return {
    width,
    height: Math.round(maxWidth * aspectRatio)
  };
}

/**
 * Generate responsive image sizes string for Astro Image component
 */
export function getImageSizes(maxWidth = 800) {
  return `(max-width) 100vw, (max-width) 90vw, ${maxWidth}px`;
}

/**
 * Extract image metadata from HTML img tag
 */
export function parseImageTag(html) {} | null {
  const match = html.match(/<img[^>]+>/);
  if (!match) return null;

  const srcMatch = match[0].match(/src=["']([^"']+)["']/);
  const altMatch = match[0].match(/alt=["']([^"']*)["']/);
  const widthMatch = match[0].match(/width=["']?(\d+)["']?/);
  const heightMatch = match[0].match(/height=["']?(\d+)["']?/);

  if (!srcMatch) return null;

  return {
    src: srcMatch[1],
    alt: altMatch ? altMatch[1] : '',
    width: widthMatch ? parseInt(widthMatch[1]) ,
    height: heightMatch ? parseInt(heightMatch[1]) : undefined
  };
}

/**
 * Generate WebP/AVIF alternative formats info
 * (In production, these would be actual format outputs)
 */
export function getImageFormats(src) {} {
  return {
    original,
    // Astro handles format generation automatically
  };
}
