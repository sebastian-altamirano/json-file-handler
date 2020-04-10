/**
 * Only cases for which these helpers are used are tested, so these functions
 * may fail under other conditions.
 *
 * @packageDocumentation
 */

/* eslint-disable sonarjs/no-duplicate-string */

import {
  addDirectoryToDeleteQueue,
  createMockFile,
  deleteCreatedFilesAndDirectories,
} from '../helpers';

import fs from 'fs';
import path from 'path';

describe('helpers', () => {
  const absoluteDistFolderPath = path.resolve(__dirname, 'dist');
  let createdFiles: string[] = [];
  let createdDirectories: string[] = [];

  beforeAll(() => fs.mkdirSync(absoluteDistFolderPath));

  afterEach(() => {
    deleteCreatedFilesAndDirectories(createdFiles, createdDirectories);
    createdFiles = [];
    createdDirectories = [];
  });

  afterAll(() => fs.rmdirSync(absoluteDistFolderPath));

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
    it('should create an empty file', () => {
      const emptyFilePath = `${absoluteDistFolderPath}/empty-file.json`;
      const fileContent = '';

      createMockFile(emptyFilePath, fileContent);
      createdFiles.push(emptyFilePath);
      const createdFileContent: Buffer = fs.readFileSync(emptyFilePath);
      const stringifiedCreatedFileContent = String(createdFileContent);

      expect(stringifiedCreatedFileContent).toBe(fileContent);
    });

    it('should create a file with some content', () => {
      const nonEmptyFilePath = `${absoluteDistFolderPath}/non-empty-file.txt`;
      const fileContent = 'I am not empty';

      createMockFile(nonEmptyFilePath, fileContent);
      createdFiles.push(nonEmptyFilePath);
      const createdFileContent: Buffer = fs.readFileSync(nonEmptyFilePath);
      const stringifiedCreatedFileContent = String(createdFileContent);

      expect(stringifiedCreatedFileContent).toBe(fileContent);
    });

    it('should create a file in a non existent directory', () => {
      const emptyFilePath = `${absoluteDistFolderPath}/new-folder/new-file.txt`;
      const fileContent = '';

      const absoluteDirectoryPath = createMockFile(emptyFilePath, fileContent);
      createdFiles.push(emptyFilePath);
      addDirectoryToDeleteQueue(createdDirectories, absoluteDirectoryPath);
      const read = (): Buffer => fs.readFileSync(emptyFilePath);

      expect(read).not.toThrow();
    });

    it('should return the directory name of the created file', () => {
      const emptyFilePath = `${absoluteDistFolderPath}/file.txt`;
      const fileContent = '';

      const absoluteDirectoryPath = createMockFile(emptyFilePath, fileContent);
      createdFiles.push(emptyFilePath);
      const expectedAbsoluteDirectoryPath = path.dirname(emptyFilePath);

      expect(absoluteDirectoryPath).toBe(expectedAbsoluteDirectoryPath);
    });
  });

  // This function will fail, or may not work as expected, if any paths are not
  // absolute
  describe('deleteCreatedFilesAndDirectories', () => {
    it('should delete the specified files and directories', () => {
      const createdFiles: string[] = [];
      const createdDirectories: string[] = [];
      const absoluteFilePaths = [
        `${absoluteDistFolderPath}/new-folder/new-file.txt`,
        `${absoluteDistFolderPath}/new-folder-2/new-file-2.txt`,
      ];
      absoluteFilePaths.forEach((absoluteFilePath: string) => {
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
