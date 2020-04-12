/* eslint-disable sonarjs/no-duplicate-string */

import { read, join, overwrite, merge } from '../../src/index';
import {
  JSONFileHandlerErrorMessage,
  FilePermission,
} from '../../src/models/enums';
import {
  deleteCreatedFilesAndDirectories,
  createMockFile,
  addDirectoryToDeleteQueue,
} from '../helpers';

import deepMerge from 'deepmerge';
import fs from 'fs';
import path from 'path';
import { JSONFileHandlerError } from '../../src/models/classes';

describe('JSON File Handler', () => {
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

  describe('read', () => {
    it('should read a valid JSON file', async () => {
      const jsonFilePath = path.resolve(__dirname, './mocks/valid.json');

      const readPromise = read(jsonFilePath);

      await expectAsync(readPromise).toBeResolved();
    });

    it('should return the content of a JSON file', async () => {
      const jsonFilePath = path.resolve(__dirname, './mocks/valid.json');
      const expectedJsonContent = {
        resX: 1920,
        resY: 1080,
      };

      const jsonContent = await read(jsonFilePath);

      expect(jsonContent).toEqual(expectedJsonContent);
    });

    it('should read a valid JSON file without .json extension', async () => {
      const jsonFilePath = path.resolve(
        __dirname,
        './mocks/valid.json-not-json'
      );

      const readPromise = read(jsonFilePath);

      await expectAsync(readPromise).toBeResolved();
    });

    it('should throw an error if the file does not exists', async () => {
      const nonExistentFilePath = path.resolve(
        __dirname,
        './mocks/does-not-exist.json'
      );

      const readPromise = read(nonExistentFilePath);

      await expectAsync(readPromise).toBeRejectedWithError();
    });

    it('should throw an error if the file is not a valid JSON file', async () => {
      const invalidJsonFilePath = path.resolve(
        __dirname,
        './mocks/invalid.json'
      );

      const readPromise = read(invalidJsonFilePath);

      await expectAsync(readPromise).toBeRejectedWithError(
        JSONFileHandlerErrorMessage.NOT_A_JSON
      );
    });

    it('should throw an error if the file is empty', async () => {
      const emptyFilePath = path.resolve(__dirname, './mocks/empty.json');

      const readPromise = read(emptyFilePath);

      await expectAsync(readPromise).toBeRejectedWithError(
        JSONFileHandlerErrorMessage.EMPTY_FILE
      );
    });
  });

  describe('join', () => {
    it('should create a new file', async () => {
      const nonExistentFilePath = `${absoluteDistFolderPath}/new-file.json`;
      const jsonContent = {
        name: 'John Doe',
        age: 33,
      };

      await join(nonExistentFilePath, jsonContent);
      createdFiles.push(nonExistentFilePath);

      await expectAsync(read(nonExistentFilePath)).toBeResolved();
    });

    it('should create a new file in a new directory', async () => {
      const nonExistentFilePath = `${absoluteDistFolderPath}/new-folder/new-file.json`;
      const jsonContent = {
        name: 'John Doe',
        age: 33,
      };

      await join(nonExistentFilePath, jsonContent);
      createdFiles.push(nonExistentFilePath);
      addDirectoryToDeleteQueue(
        createdDirectories,
        path.dirname(nonExistentFilePath)
      );

      await expectAsync(read(nonExistentFilePath)).toBeResolved();
    });

    it('should merge an object with the content of an existing file', async () => {
      const jsonFilePath = `${absoluteDistFolderPath}/join.json`;
      const jsonContent = {
        object: {
          a: 12,
          b: {
            deep: {
              c: 33,
            },
          },
        },
        array: ['one', 'two'],
      };
      await join(jsonFilePath, jsonContent);
      createdFiles.push(jsonFilePath);
      const contentToJoin = {
        object: {
          b: {
            deep: {
              c: 43,
              d: 11,
            },
          },
          e: 1,
        },
        array: ['three', 'four'],
      };
      const expectedJsonContent = {
        object: {
          a: 12,
          b: {
            deep: {
              c: 43,
              d: 11,
            },
          },
          e: 1,
        },
        array: ['one', 'two', 'three', 'four'],
      };

      await join(jsonFilePath, contentToJoin);
      const fileContent = await read(jsonFilePath);

      expect(fileContent).toEqual(expectedJsonContent);
    });

    it('should overwrite the content of an existing empty file', async () => {
      const emptyFilePath = `${absoluteDistFolderPath}/join-empty.json`;
      createMockFile(emptyFilePath, '');
      createdFiles.push(emptyFilePath);
      const newJsonContent = {
        name: 'Jane Doe',
        age: 31,
        height: 170,
      };

      await join(emptyFilePath, newJsonContent);
      const fileContent = await read(emptyFilePath);

      expect(fileContent).toEqual(newJsonContent);
    });

    it('should fail to merge the content of an existing invalid JSON file', async () => {
      const invalidJsonFilePath = `${absoluteDistFolderPath}/join-invalid.json`;
      const invalidJsonContent = 'i am not a valid JSON content';
      createMockFile(invalidJsonFilePath, invalidJsonContent);
      createdFiles.push(invalidJsonFilePath);
      const newJsonContent = {
        name: 'Jane Doe',
        age: 31,
        height: 170,
      };

      const joinPromise = join(invalidJsonFilePath, newJsonContent);

      await expectAsync(joinPromise).toBeRejectedWithError(
        JSONFileHandlerErrorMessage.NOT_A_JSON
      );
    });

    // No further testing is done in this field as `isAnObject` util takes care
    // of this and it's already well tested
    it('should fail with an invalid object', async () => {
      const nonExistentFilePath = `${absoluteDistFolderPath}/join-fail.json`;
      const jsonContent = ['black', 'red', 'blue', 'orange'];

      const writePromise = join(nonExistentFilePath, jsonContent);

      await expectAsync(writePromise).toBeRejectedWithError(
        JSONFileHandlerErrorMessage.NOT_A_VALID_OBJECT
      );
    });

    it('should fail to merge the content of an object with the content of a read only file', async () => {
      const readOnlyFilePath = `${absoluteDistFolderPath}/join-read-only.json`;
      const jsonContent = {
        name: 'Jane Doe',
        age: 31,
        height: 170,
      };
      const stringifiedJsonContent = JSON.stringify(jsonContent);
      createMockFile(
        readOnlyFilePath,
        stringifiedJsonContent,
        FilePermission.readOnly
      );
      createdFiles.push(readOnlyFilePath);
      const newJsonContent = {
        name: 'Jane Doe',
        age: 31,
        height: 170,
      };

      const joinPromise = join(readOnlyFilePath, newJsonContent);

      await expectAsync(joinPromise).toBeRejected();
    });
  });

  describe('overwrite', () => {
    it('should create a new file', async () => {
      const nonExistentFilePath = `${absoluteDistFolderPath}/new-file.json`;
      const jsonContent = {
        name: 'John Doe',
        age: 33,
      };

      await overwrite(nonExistentFilePath, jsonContent);
      createdFiles.push(nonExistentFilePath);

      await expectAsync(read(nonExistentFilePath)).toBeResolved();
    });

    it('should create a new file in a new directory', async () => {
      const nonExistentFilePath = `${absoluteDistFolderPath}/new-folder/new-file.json`;
      const jsonContent = {
        name: 'John Doe',
        age: 33,
      };

      await overwrite(nonExistentFilePath, jsonContent);
      createdFiles.push(nonExistentFilePath);
      addDirectoryToDeleteQueue(
        createdDirectories,
        path.dirname(nonExistentFilePath)
      );

      await expectAsync(read(nonExistentFilePath)).toBeResolved();
    });

    it('should overwrite the content of an existing file', async () => {
      const jsonFilePath = `${absoluteDistFolderPath}/overwrite.json`;
      const jsonContent = {
        name: 'John Doe',
        age: 33,
      };
      await overwrite(jsonFilePath, jsonContent);
      createdFiles.push(jsonFilePath);
      const newJsonContent = {
        name: 'Jane Doe',
        age: 31,
        height: 170,
      };

      await overwrite(jsonFilePath, newJsonContent);
      const fileContent = await read(jsonFilePath);

      expect(fileContent).toEqual(newJsonContent);
    });

    it('should overwrite the content of an existing empty file', async () => {
      const emptyFilePath = `${absoluteDistFolderPath}/overwrite-empty.json`;
      createMockFile(emptyFilePath, '');
      createdFiles.push(emptyFilePath);
      const newJsonContent = {
        name: 'Jane Doe',
        age: 31,
        height: 170,
      };

      await overwrite(emptyFilePath, newJsonContent);
      const fileContent = await read(emptyFilePath);

      expect(fileContent).toEqual(newJsonContent);
    });

    it('should overwrite the content of an existing invalid JSON file', async () => {
      const invalidJsonFilePath = `${absoluteDistFolderPath}/overwrite-invalid.json`;
      const invalidJsonContent = 'i am not a valid JSON content';
      createMockFile(invalidJsonFilePath, invalidJsonContent);
      createdFiles.push(invalidJsonFilePath);
      const newJsonContent = {
        name: 'Jane Doe',
        age: 31,
        height: 170,
      };

      await overwrite(invalidJsonFilePath, newJsonContent);
      const fileContent = await read(invalidJsonFilePath);

      expect(fileContent).toEqual(newJsonContent);
    });

    it('should fail with an invalid object', async () => {
      const nonExistentFilePath = `${absoluteDistFolderPath}/overwrite-fail.json`;
      const jsonContent = ['black', 'red', 'blue', 'orange'];

      const writePromise = overwrite(nonExistentFilePath, jsonContent);

      await expectAsync(writePromise).toBeRejectedWithError(
        JSONFileHandlerErrorMessage.NOT_A_VALID_OBJECT
      );
    });

    it('should fail overwrite the content of a read only file', async () => {
      const readOnlyFilePath = `${absoluteDistFolderPath}/overwrite-read-only.json`;
      const jsonContent = {
        name: 'Jane Doe',
        age: 31,
        height: 170,
      };
      const stringifiedJsonContent = JSON.stringify(jsonContent);
      createMockFile(
        readOnlyFilePath,
        stringifiedJsonContent,
        FilePermission.readOnly
      );
      createdFiles.push(readOnlyFilePath);
      const newJsonContent = {
        name: 'Jane Doe',
        age: 31,
        height: 170,
      };

      const overwritePromise = overwrite(readOnlyFilePath, newJsonContent);

      await expectAsync(overwritePromise).toBeRejected();
    });
  });

  describe('merge', () => {
    it('should merge the content of two different files into a third', async () => {
      const firstFilePath = path.resolve(__dirname, './mocks/valid.json');
      const secondFilePath = path.resolve(__dirname, './mocks/valid-2.json');
      const mergedFilePath = `${absoluteDistFolderPath}/merge.json`;
      const firstFileContent = await read(firstFilePath);
      const secondFileContent = await read(secondFilePath);
      const expectedMergeContent = deepMerge<object>(
        firstFileContent,
        secondFileContent
      );

      await merge(firstFilePath, secondFilePath, mergedFilePath);
      createdFiles.push(mergedFilePath);
      const mergedFileContent = await read(mergedFilePath);

      expect(mergedFileContent).toEqual(expectedMergeContent);
    });

    it('should merge the content of two different files into a third in a new directory', async () => {
      const firstFilePath = path.resolve(__dirname, './mocks/valid.json');
      const secondFilePath = path.resolve(__dirname, './mocks/valid-2.json');
      const mergedFilePath = `${absoluteDistFolderPath}/new-folder/merge.json`;
      const firstFileContent = await read(firstFilePath);
      const secondFileContent = await read(secondFilePath);
      const expectedMergeContent = deepMerge<object>(
        firstFileContent,
        secondFileContent
      );

      await merge(firstFilePath, secondFilePath, mergedFilePath);
      createdFiles.push(mergedFilePath);
      addDirectoryToDeleteQueue(
        createdDirectories,
        path.dirname(mergedFilePath)
      );
      const mergedFileContent = await read(mergedFilePath);

      expect(mergedFileContent).toEqual(expectedMergeContent);
    });

    it('should merge the content of two different files into one of the two', async () => {
      const firstFilePath = `${absoluteDistFolderPath}/valid.json`;
      const firstFileContent = {
        resX: 1920,
        resY: 1080,
      };
      createMockFile(firstFilePath, JSON.stringify(firstFileContent));
      createdFiles.push(firstFilePath);
      const secondFilePath = path.resolve(__dirname, './mocks/valid-2.json');
      const secondFileContent = await read(secondFilePath);
      const mergedFilePath = firstFilePath;
      const expectedMergeContent = deepMerge<object>(
        firstFileContent,
        secondFileContent
      );

      await merge(firstFilePath, secondFilePath, mergedFilePath);
      const mergedFileContent = await read(mergedFilePath);

      expect(mergedFileContent).toEqual(expectedMergeContent);
    });

    it('should duplicate the first file if it has content and the second file is empty', async () => {
      const firstFilePath = path.resolve(__dirname, './mocks/valid.json');
      const secondFilePath = path.resolve(__dirname, './mocks/empty.json');
      const duplicatedFilePath = `${absoluteDistFolderPath}/duplicate.json`;
      const firstFileContent = await read(firstFilePath);

      await merge(firstFilePath, secondFilePath, duplicatedFilePath);
      createdFiles.push(duplicatedFilePath);
      const mergedFileContent = await read(duplicatedFilePath);

      expect(mergedFileContent).toEqual(firstFileContent);
    });

    it('should duplicate the second file if it has content and the first file is empty', async () => {
      const firstFilePath = path.resolve(__dirname, './mocks/empty.json');
      const secondFilePath = path.resolve(__dirname, './mocks/valid.json');
      const duplicatedFilePath = `${absoluteDistFolderPath}/duplicate.json`;
      const secondFileContent = await read(secondFilePath);

      await merge(firstFilePath, secondFilePath, duplicatedFilePath);
      createdFiles.push(duplicatedFilePath);
      const mergedFileContent = await read(duplicatedFilePath);

      expect(mergedFileContent).toEqual(secondFileContent);
    });

    it('should duplicate the file if both files are the same', async () => {
      const firstFilePath = path.resolve(__dirname, './mocks/valid.json');
      const secondFilePath = firstFilePath;
      const duplicatedFilePath = `${absoluteDistFolderPath}/duplicate.json`;
      const firstFileContent = await read(firstFilePath);

      await merge(firstFilePath, secondFilePath, duplicatedFilePath);
      createdFiles.push(duplicatedFilePath);
      const mergedFileContent = await read(duplicatedFilePath);

      expect(firstFileContent).toEqual(mergedFileContent);
    });

    it('should fail if both files are empty', async () => {
      const firstFilePath = path.resolve(__dirname, './mocks/empty.json');
      const secondFilePath = firstFilePath;
      const duplicatedFilePath = `${absoluteDistFolderPath}/duplicate.json`;

      const mergePromise = merge(
        firstFilePath,
        secondFilePath,
        duplicatedFilePath
      );

      await expectAsync(mergePromise).toBeRejectedWithError(
        JSONFileHandlerErrorMessage.EMPTY_FILE
      );
    });

    it('should fail with the path of the first file if it was invalid', async () => {
      const firstFilePath = path.resolve(__dirname, './mocks/invalid.json');
      const secondFilePath = path.resolve(__dirname, './mocks/valid.json');
      const mergedFilePath = `${absoluteDistFolderPath}/merge-invalid.json`;
      const expectedError = new JSONFileHandlerError(
        'NOT_A_JSON',
        firstFilePath
      );

      const mergePromise = merge(firstFilePath, secondFilePath, mergedFilePath);

      await expectAsync(mergePromise).toBeRejectedWith(expectedError);
    });

    it('should fail with the path of the second file if it was invalid', async () => {
      const firstFilePath = path.resolve(__dirname, './mocks/valid.json');
      const secondFilePath = path.resolve(__dirname, './mocks/invalid.json');
      const mergedFilePath = `${absoluteDistFolderPath}/merge-invalid.json`;
      const expectedError = new JSONFileHandlerError(
        'NOT_A_JSON',
        secondFilePath
      );

      const mergePromise = merge(firstFilePath, secondFilePath, mergedFilePath);

      await expectAsync(mergePromise).toBeRejectedWith(expectedError);
    });

    it('should fail if one of the files does not exist', async () => {
      const nonExistentFilePath = path.resolve(
        __dirname,
        './mocks/does-not-exist.json'
      );
      const secondFilePath = path.resolve(__dirname, './mocks/valid.json');
      const mergedFilePath = `${absoluteDistFolderPath}/merge-invalid.json`;

      const mergePromise = merge(
        nonExistentFilePath,
        secondFilePath,
        mergedFilePath
      );

      await expectAsync(mergePromise).toBeRejected();
    });

    it('should fail if the merge path is read only', async () => {
      const readOnlyFilePath = `${absoluteDistFolderPath}/merge-read-only.json`;
      const jsonContent = {
        theme: 'light',
        displayMode: 'windowed',
      };
      const stringifiedJsonContent = JSON.stringify(jsonContent);
      createMockFile(
        readOnlyFilePath,
        stringifiedJsonContent,
        FilePermission.readOnly
      );
      createdFiles.push(readOnlyFilePath);
      const firstFilePath = path.resolve(__dirname, './mocks/valid.json');
      const secondFilePath = path.resolve(__dirname, './mocks/valid-2.json');

      const mergePromise = merge(
        firstFilePath,
        secondFilePath,
        readOnlyFilePath
      );

      await expectAsync(mergePromise).toBeRejected();
    });
  });
});
