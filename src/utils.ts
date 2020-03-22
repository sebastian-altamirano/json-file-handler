/**
 * A few utility functions to be used in the source code.
 *
 * @packageDocumentation
 */

/**
 * Determines if a given object is in fact an object (and not an array or a
 * function for example).
 *
 * @param object - An object to check if it's a true object or not
 */
export function isAnObject(object: object): boolean {
  return (
    object !== null && typeof object === 'object' && !Array.isArray(object)
  );
}

/**
 * Determines if a given string is a valid JSON or not.
 *
 * @param string - A string to check if it's a valid JSON or not
 */
export function isAValidJsonString(jsonString: string): boolean {
  try {
    // Will throw given a string that can not be parsed into an object
    const parsedJson = JSON.parse(jsonString);
    // But will not throw given a number, a boolean, null, undefined or the
    // stringification of any of these
    if (parsedJson.constructor !== Object) {
      throw new Error('String is not a valid JSON string');
    }
  } catch {
    return false;
  }

  return true;
}

module.exports = {
  isAnObject,
  isAValidJsonString,
};
