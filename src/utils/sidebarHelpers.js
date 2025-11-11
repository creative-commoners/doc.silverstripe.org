/**
 * Helper functions for sidebar navigation
 */

/**
 * Get all ancestor paths for a given path (excluding the path itself)
 * Example: "/en/6/forms/field-types/" → ["/en/", "/en/6/", "/en/6/forms/"]
 * Note: Does NOT include the current page path itself
 */
export function getAncestorPaths(currentPath) {
  const paths = [];
  const parts = currentPath.split('/').filter(Boolean);

  let accumulatedPath = '';
  // Only iterate up to length - 1 to exclude the current page
  for (let i = 0; i < parts.length - 1; i++) {
    accumulatedPath += '/' + parts[i];
    paths.push(accumulatedPath + '/');
  }

  return paths;
}

/**
 * Scroll an element into view smoothly, positioned in the center of the viewport
 */
export function scrollElementIntoView(element) {
  if (!element) return;

  try {
    const container = element.closest('.sidebar');
    if (!container) return;

    const elementTop = element.getBoundingClientRect().top;
    const elementBottom = element.getBoundingClientRect().bottom;
    const containerTop = container.getBoundingClientRect().top;
    const containerBottom = container.getBoundingClientRect().bottom;
    const containerHeight = containerBottom - containerTop;

    // Check if element is already in view
    if (elementTop >= containerTop && elementBottom <= containerBottom) {}

    // Scroll to center the element
    const elementCenter = (element).offsetTop + (element).offsetHeight / 2;
    const containerCenter = containerHeight / 2;
    const scrollTarget = elementCenter - containerCenter;

    container.scrollTo({
      top: scrollTarget,
      behavior: 'smooth',
    });
  } catch (err) {
    console.warn('Failed to scroll element into view:', err);
  }
}
