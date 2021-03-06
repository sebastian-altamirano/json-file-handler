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
 * but Node doesn't exposes the class so it can't be checked using the
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

import deepMerge from 'deepmerge';

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
 * Joins a given content to the content of a JSON file, or creates a new one
 * if it doesn't exists.
 *
 * @param filePath - The absolute path where the file is or will be located
 * @param jsonContent - The object to be merged or written to the JSON file
 * @param indentationLevel - How much space to use for indentation when
 * formatting
 *
 * @returns A promise that joins the content or creates the file when resolved
 */
export const join = async (
  filePath: string,
  jsonContent: object,
  indentationLevel = 2
): Promise<void> => {
  if (isAnObject(jsonContent)) {
    try {
      const currentJsonContent: object = await read(filePath);
      const newJsonContent = deepMerge<object>(currentJsonContent, jsonContent);
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

/**
 * Duplicates a JSON file.
 *
 * @param filePath - The absolute path of the file to be duplicated
 * @param duplicatedFilePath - The absolute path where the file will be
 * duplicated
 * @param indentationLevel - How much space to use for indentation when
 * formatting
 *
 * @returns A promise that duplicates the file when resolved
 */
const duplicate = async (
  filePath: string,
  duplicatedFilePath: string,
  indentationLevel: number
): Promise<void> => {
  try {
    const fileContent: object = await read(filePath);
    return await write(duplicatedFilePath, fileContent, indentationLevel);
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * Merges the content of two JSON files into a third file, or duplicates one of
 * the files if the other one is empty.
 *
 * @param firstFilePath - The absolute path of the first file
 * @param secondFilePath - The absolute path of the second file
 * @param mergedFilePath - The absolute path where the file is or will be
 * located
 * @param indentationLevel - How much space to use for indentation when
 * formatting
 *
 * @returns A promise that merges the files, or duplicates one of them, when
 * resolved
 */
export const merge = async (
  firstFilePath: string,
  secondFilePath: string,
  mergedFilePath: string,
  indentationLevel = 2
): Promise<void> => {
  let firstFileContent: object;
  try {
    firstFileContent = await read(firstFilePath);
    const secondFileContent: object = await read(secondFilePath);
    const mergedContent: object = deepMerge<object>(
      firstFileContent,
      secondFileContent
    );
    return await write(mergedFilePath, mergedContent, indentationLevel);
  } catch (error) {
    if (error.code === 'EMPTY_FILE' && firstFilePath !== secondFilePath) {
      if (error.path === secondFilePath) {
        // If the the second file is empty, then the first file has content, so
        // it's duplicated at `mergedFilePath` using `indentationLevel`
        return write(mergedFilePath, firstFileContent, indentationLevel);
      } else {
        // But if the first file is empty, it's not guaranteed that the second
        // file will have content, `duplicate` takes care of that condition
        return duplicate(secondFilePath, mergedFilePath, indentationLevel);
      }
    } else {
      return Promise.reject(error);
    }
  }
};

module.exports = {
  read,
  overwrite,
  join,
  merge,
};
