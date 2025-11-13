/**
 * Utility functions for managing [CHILDREN] block markers
 * Serializes and deserializes metadata to/from HTML comment markers
 */

/**
 * Serialize metadata to JSON string for HTML comment
 * @param {Object} attributes - Metadata to serialize
 * @returns {string} JSON string representation
 */
export function serializeChildrenData(attributes) {
  return JSON.stringify(attributes);
}

/**
 * Deserialize metadata from HTML comment
 * @param {string} commentText - The inner text of the HTML comment
 * @returns {Object|null} Parsed metadata object or null if invalid
 */
export function deserializeChildrenData(commentText) {
  const match = commentText.match(/CHILDREN_BLOCK:(.+)/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch (e) {
    return null;
  }
}

/**
 * Create a marker comment text
 * @param {Object} attributes - Metadata to encode
 * @returns {string} HTML comment with encoded metadata
 */
export function createChildrenMarker(attributes) {
  return `<!-- CHILDREN_BLOCK:${serializeChildrenData(attributes)} -->`;
}

/**
 * Validate marker format
 * @param {string} commentText - The inner text of the HTML comment
 * @returns {boolean} True if this is a valid CHILDREN marker
 */
export function isChildrenMarker(commentText) {
  return /^CHILDREN_BLOCK:/.test(commentText);
}
