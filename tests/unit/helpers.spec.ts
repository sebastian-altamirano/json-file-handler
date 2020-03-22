/**
 * Only cases for which these helpers are used are tested, so these functions
 * may fail under other conditions.
 *
 * @packageDocumentation
 */

import {
  addDirectoryToDeleteQueue,
  createMockFile,
  deleteCreatedFilesAndDirectories,
} from '../helpers';

import fs from 'fs';
import path from 'path';

describe('helpers', () => {
  // This function does not check if the directory path to be added exists and
  // is in fact a directory, so a file path, or a non existent directory path
  // could be added
  describe('addDirectoryToDeleteQueue', () => {
    it('should add directory to delete queue', () => {
      const deleteQueue: string[] = [];
      const directoryPath = '/home/sebastian/';
      const expectedDeleteQueue = [directoryPath];

      addDirectoryToDeleteQueue(deleteQueue, directoryPath);

      expect(deleteQueue).toEqual(expectedDeleteQueue);
    });

    it('should add nested directory at the beginning of the delete queue', () => {
      const directoryPath = '/home/sebastian/';
      const deleteQueue = [directoryPath];
      const nestedDirectoryPath = '/home/sebastian/playground';
      const expectedDeleteQueue = [nestedDirectoryPath, directoryPath];

      addDirectoryToDeleteQueue(deleteQueue, nestedDirectoryPath);

      expect(deleteQueue).toEqual(expectedDeleteQueue);
    });

    it('should not add a directory already part of the delete queue', () => {
      const directoryPath = '/home/sebastian/';
      const deleteQueue = [directoryPath];
      const expectedDeleteQueue = [directoryPath];

      addDirectoryToDeleteQueue(deleteQueue, directoryPath);

      expect(deleteQueue).toEqual(expectedDeleteQueue);
    });
  });

  describe('createMockFile', () => {
    const createdFiles: string[] = [];
    const createdDirectories: string[] = [];

    afterAll(() =>
      deleteCreatedFilesAndDirectories(createdFiles, createdDirectories)
    );

    it('should create an empty file', () => {
      const filePath = './dist/empty-file.json';
      const absoluteFilePath = path.resolve(__dirname, filePath);
      const fileContent = '';

      createMockFile(absoluteFilePath, fileContent);
      createdFiles.push(absoluteFilePath);
      const createdFileContent: Buffer = fs.readFileSync(absoluteFilePath);
      const stringifiedCreatedFileContent = String(createdFileContent);

      expect(stringifiedCreatedFileContent).toBe(fileContent);
    });

    it('should create a file with some content', () => {
      const filePath = './dist/non-empty-file.txt';
      const absoluteFilePath = path.resolve(__dirname, filePath);
      const fileContent = 'I am not empty';

      createMockFile(absoluteFilePath, fileContent);
      createdFiles.push(absoluteFilePath);
      const createdFileContent: Buffer = fs.readFileSync(absoluteFilePath);
      const stringifiedCreatedFileContent = String(createdFileContent);

      expect(stringifiedCreatedFileContent).toBe(fileContent);
    });

    it('should create a file in a non existent directory', () => {
      const filePath = './dist/new-folder/new-file.txt';
      const absoluteFilePath = path.resolve(__dirname, filePath);
      const fileContent = '';

      const absoluteDirectoryPath = createMockFile(
        absoluteFilePath,
        fileContent
      );
      createdFiles.push(absoluteFilePath);
      addDirectoryToDeleteQueue(createdDirectories, absoluteDirectoryPath);
      const read = (): Buffer => fs.readFileSync(absoluteFilePath);

      expect(read).not.toThrow();
    });

    it('should return the directory name of the created file', () => {
      const filePath = './dist/file.txt';
      const absoluteFilePath = path.resolve(__dirname, filePath);
      const fileContent = '';

      const absoluteDirectoryPath = createMockFile(
        absoluteFilePath,
        fileContent
      );
      createdFiles.push(absoluteFilePath);
      const expectedAbsoluteDirectoryPath = path.dirname(absoluteFilePath);

      expect(absoluteDirectoryPath).toBe(expectedAbsoluteDirectoryPath);
    });
  });

  // This function will fail, or may not work as expected, if any paths are not
  // absolute
  describe('deleteCreatedFilesAndDirectories', () => {
    it('should delete the specified files and directories', () => {
      const createdFiles: string[] = [];
      const createdDirectories: string[] = [];
      const filePaths = [
        './dist/new-folder/new-file.txt',
        './dist/new-folder-2/new-file-2.txt',
      ];
      filePaths.forEach((filePath) => {
        const absoluteFilePath = path.resolve(__dirname, filePath);
        const absoluteDirectoryPath = createMockFile(absoluteFilePath, '');
        createdFiles.push(absoluteFilePath);
        addDirectoryToDeleteQueue(createdDirectories, absoluteDirectoryPath);
      });

      deleteCreatedFilesAndDirectories(createdFiles, createdDirectories);
      const areFilesAndDirectoriesDeleted = ((): boolean => {
        const areFilesDeleted = !createdFiles.find((filePath) => {
          const fileExists = fs.existsSync(filePath);
          return fileExists;
        });
        const areDirectoriesDeleted = !createdDirectories.find(
          (directoryPath) => {
            const directoryExists = fs.existsSync(directoryPath);
            return directoryExists;
          }
        );
        return areFilesDeleted && areDirectoriesDeleted;
      })();

      expect(areFilesAndDirectoriesDeleted).toBeTrue();
    });
  });
});
