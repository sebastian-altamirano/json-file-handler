/**
 * Contains functions for manipulating JSON files asynchronously using the File
 * System module from NodeJS.
 *
 * Only the main functions are exported. Functions not exported are abstractions
 * of steps from the main functions.
 *
 * Functions must be passed an absolute file path to behave as expected.
 *
 * Functions that requires an optional intentation level parameter don't check
 * its value. It's used by `JSON.stringify` and therefore, if the value is less
 * than 1 no formatting is done, and if it's greater than 10, the indentation is
 * just 10.
 *
 * When a function fails it returns a rejected Promise with:
 * - An intance of [[JSONFileHandlerError]] if it was caused by a misuse of the
 * function, for example, when trying to write something that is not an object
 * to a JSON file, or when trying to read a file that doesn't exists
 * - An instance of `Error` (actually is of
 * [`SystemError`](https://nodejs.org/api/errors.html#errors_class_systemerror),
 * but Node does not exposes the class so it can not be checked using the
 * `instanceof` operator) if it was caused by violating an operating system
 * constraint, like:
 *   - Trying to modify a read-only file
 *   - Trying to create or modify a file inside a read-only directory
 *   - Trying to modify a file that requires elevated privileges
 *   - Trying to work with many files at once
 *   - Trying to modify a file and running out of space in the process
 *
 * @packageDocumentation
 */

import { isAnObject, isAValidJsonString } from './utils';
import { JSONFileHandlerError } from './models/classes';

import fs from 'fs';
import path from 'path';

import merge from 'deepmerge';

/**
 * Checks if the directory where the file is or will be located exists.
 *
 * @param directoryName - The absolute path of the directory where the file is
 * or will be located
 *
 * @returns A promise that returns whether the directory exists or not when
 * resolved
 *
 * @internal
 */
const checkIfDirectoryExistsForFile = async (
  directoryName: string
): Promise<boolean> => {
  try {
    await fs.promises.access(directoryName);
    return await Promise.resolve(true);
  } catch (error) {
    const oneOrMoreDirectoriesDoNotExist = error.code === 'ENOENT';
    return oneOrMoreDirectoriesDoNotExist
      ? Promise.resolve(false)
      : Promise.reject(error);
  }
};

/**
 * Creates or overwrites the JSON file with a given content.
 *
 * @param filePath - The absolute path where the file is or will be located
 * @param jsonContent - The object to be written
 * @param indentationLevel - How much space to use for indentation when
 * formatting
 *
 * @returns A promise that creates or overwrites the JSON file with the given
 * content when resolved
 *
 * @internal
 */
const writeJson = async (
  filePath: string,
  jsonContent: object,
  indentationLevel: number
): Promise<void> => {
  const jsonString = JSON.stringify(jsonContent, null, indentationLevel);
  return fs.promises.writeFile(filePath, jsonString);
};

/**
 * Creates the necessary directories to create the JSON file and then creates it
 * with a given content.
 *
 * @param directoryName - The absolute path of the directory where the file will
 * be located
 * @param filePath - The absolute path where the file will be located
 * @param jsonContent - The object to be written
 * @param indentationLevel - How much space to use for indentation when
 * formatting
 *
 * @returns A promise that creates the directories and writes the JSON file when
 * resolved
 *
 * @internal
 */
const createDirectoriesAnWriteJson = async (
  directoryName: string,
  filePath: string,
  jsonContent: object,
  indentationLevel: number
): Promise<void> => {
  await fs.promises.mkdir(directoryName, { recursive: true });
  return writeJson(filePath, jsonContent, indentationLevel);
};

/**
 * Creates or overwrites the JSON file with a given content, checking that the
 * directories neccesary for its creation exists beforehand if the file needs
 * to be created.
 *
 * @param filePath - The absolute path where the file is or will be located
 * @param jsonContent - The object to be written
 * @param indentationLevel - How much space to use for indentation when
 * formatting
 *
 * @returns A promise that creates or overwrites the JSON file with the given
 * content when resolved
 *
 * @internal
 */
const write = async (
  filePath: string,
  jsonContent: object,
  indentationLevel: number
): Promise<void> => {
  const directoryName = path.dirname(filePath);
  const directoryExists = await checkIfDirectoryExistsForFile(directoryName);
  return directoryExists
    ? writeJson(filePath, jsonContent, indentationLevel)
    : createDirectoriesAnWriteJson(
        directoryName,
        filePath,
        jsonContent,
        indentationLevel
      );
};

/**
 * Overwrites the content of an existing JSON file, or creates a new one if it
 * doesn't exist.
 *
 * @param filePath - The absolute path where the file is or will be located
 * @param jsonContent - The object to be written to the JSON file
 * @param indentationLevel - How much space to use for indentation when
 * formatting
 *
 * @returns A promise that overwrites or creates the file when resolved
 */
export const overwrite = async (
  filePath: string,
  jsonContent: object,
  indentationLevel = 2
): Promise<void> => {
  if (isAnObject(jsonContent)) {
    return write(filePath, jsonContent, indentationLevel);
  }

  const notAValidObjectError = new JSONFileHandlerError(
    'NOT_A_VALID_OBJECT',
    filePath
  );
  return Promise.reject(notAValidObjectError);
};

/**
 * Returns the content of a JSON file.
 *
 * @param filePath - The absolute path where the file is located
 *
 * @returns A promise resolved with the content
 */
export const read = async (filePath: string): Promise<object> => {
  const binaryJsonContent: Buffer = await fs.promises.readFile(filePath);
  const stringifiedJsonContent = String(binaryJsonContent);
  if (isAValidJsonString(stringifiedJsonContent)) {
    const jsonContent = JSON.parse(stringifiedJsonContent);
    return jsonContent;
  }

  if (stringifiedJsonContent.length === 0) {
    const emptyFileError = new JSONFileHandlerError('EMPTY_FILE', filePath);
    return Promise.reject(emptyFileError);
  }

  const notAJsonError = new JSONFileHandlerError('NOT_A_JSON', filePath);
  return Promise.reject(notAJsonError);
};

/**
 * Merges a given content with the content of a JSON file, or creates a new one
 * if it does not exists.
 *
 * @param filePath - The absolute path where the file is or will be located
 * @param jsonContent - The object to be merged or written to the JSON file
 * @param indentationLevel - How much space to use for indentation when
 * formatting
 *
 * @returns A promise that joins or creates the file when resolved
 */
export const join = async (
  filePath: string,
  jsonContent: object,
  indentationLevel = 2
): Promise<void> => {
  if (isAnObject(jsonContent)) {
    try {
      const currentJsonContent: object = await read(filePath);
      const newJsonContent = merge<object>(currentJsonContent, jsonContent);
      return await write(filePath, newJsonContent, indentationLevel);
    } catch (error) {
      const fileIsEmpty = error.code === 'EMPTY_FILE';
      const fileDoesNotExist = error.code === 'ENOENT';
      if (fileIsEmpty || fileDoesNotExist) {
        return write(filePath, jsonContent, indentationLevel);
      }

      return Promise.reject(error);
    }
  }

  const notAValidObjectError = new JSONFileHandlerError(
    'NOT_A_VALID_OBJECT',
    filePath
  );
  return Promise.reject(notAValidObjectError);
};

module.exports = {
  read,
  overwrite,
  join,
};
