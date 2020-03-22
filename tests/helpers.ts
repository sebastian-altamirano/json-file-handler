/**
 * A few helper functions to be used in the unit tests.
 *
 * @packageDocumentation
 */

import { FilePermission } from '../src/models/enums';

import fs from 'fs';
import path from 'path';

/**
 * Given the reference of a queue of directory paths and a directory path, adds
 * the path to the queue only if it's not already part of it, then sorts the
 * queue by the most nested.
 *
 * @param deleteQueue - The reference to the queue
 * @param directoryPath - The directory path to be added
 *
 * @internal
 */
export function addDirectoryToDeleteQueue(
  deleteQueue: string[],
  directoryPath: string
): void {
  if (!deleteQueue.includes(directoryPath)) {
    deleteQueue.push(directoryPath);
    deleteQueue.sort(
      (firstDirectoryPath: string, secondDirectoryPath: string) => {
        return secondDirectoryPath.length - firstDirectoryPath.length;
      }
    );
  }
}

/**
 * Creates a file in a specified path with a given content and permissions.
 *
 * @param absoluteFilePath - The path where the file will be created
 * @param fileContent - The content of the file
 * @param permissions - The permissions of the file
 * (see https://nodejs.org/api/fs.html#fs_file_modes)
 *
 * @returns The directory name of the created file
 *
 * @internal
 */
export function createMockFile(
  absoluteFilePath: string,
  fileContent: string,
  permissions = FilePermission.readAndWrite
): string {
  const absoluteDirectoryPath = path.dirname(absoluteFilePath);
  // Writing will fail if the directory where the file will be located doesn't
  // exist, so the directory needs to be created in that case
  fs.mkdirSync(absoluteDirectoryPath, { recursive: true });
  fs.writeFileSync(absoluteFilePath, fileContent, { mode: permissions });
  return absoluteDirectoryPath;
}

/**
 * Deletes a set of files and directories given their paths.
 *
 * @param files - The paths of the files to be deleted
 * @param directories - The paths of the directories to be deleted
 *
 * @internal
 */
export function deleteCreatedFilesAndDirectories(
  files: string[],
  directories: string[]
): void {
  files.forEach((filePath) => fs.unlinkSync(filePath));
  directories.forEach((directoryPath) => fs.rmdirSync(directoryPath));
}

module.exports = {
  addDirectoryToDeleteQueue,
  createMockFile,
  deleteCreatedFilesAndDirectories,
};
