/* eslint-disable sonarjs/no-duplicate-string */

import { read, join, overwrite } from '../../src/index';
import {
  JSONFileHandlerErrorMessage,
  FilePermission,
} from '../../src/models/enums';
import {
  deleteCreatedFilesAndDirectories,
  createMockFile,
  addDirectoryToDeleteQueue,
} from '../helpers';

import path from 'path';

describe('JSON File Handler', () => {
  describe('read', () => {
    it('should read a valid JSON file', async () => {
      const validJsonPath = path.resolve(__dirname, './mocks/valid.json');

      const readPromise = read(validJsonPath);

      await expectAsync(readPromise).toBeResolved();
    });

    it('should return the content of a JSON file', async () => {
      const validJsonPath = path.resolve(__dirname, './mocks/valid.json');
      const expectedJsonContent = {
        resX: 1920,
        resY: 1080,
      };

      const jsonContent = await read(validJsonPath);

      expect(jsonContent).toEqual(expectedJsonContent);
    });

    it('should read a valid JSON file without .json extension', async () => {
      const validJsonPath = path.resolve(
        __dirname,
        './mocks/valid.json-not-json'
      );

      const readPromise = read(validJsonPath);

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
      const invalidJsonPath = path.resolve(__dirname, './mocks/invalid.json');

      const readPromise = read(invalidJsonPath);

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
    const createdFiles: string[] = [];
    const createdDirectories: string[] = [];

    afterAll(() =>
      deleteCreatedFilesAndDirectories(createdFiles, createdDirectories)
    );

    it('should create a new file', async () => {
      const nonExistentFilePath = path.resolve(
        __dirname,
        './dist/new-file.json'
      );
      const jsonContent = {
        name: 'John Doe',
        age: 33,
      };

      await join(nonExistentFilePath, jsonContent);
      createdFiles.push(nonExistentFilePath);

      await expectAsync(read(nonExistentFilePath)).toBeResolved();
    });

    it('should create a new file in a new directory', async () => {
      const nonExistentFilePath = path.resolve(
        __dirname,
        './dist/new-folder/new-file.json'
      );
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
      const nonExistentFilePath = path.resolve(__dirname, './dist/join.json');
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
      await join(nonExistentFilePath, jsonContent);
      createdFiles.push(nonExistentFilePath);
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

      await join(nonExistentFilePath, contentToJoin);
      const fileContent = await read(nonExistentFilePath);

      expect(fileContent).toEqual(expectedJsonContent);
    });

    it('should overwrite the content of an existing empty file', async () => {
      const newEmptyFilePath = path.resolve(
        __dirname,
        './dist/join-empty.json'
      );
      createMockFile(newEmptyFilePath, '');
      createdFiles.push(newEmptyFilePath);
      const newJsonContent = {
        name: 'Jane Doe',
        age: 31,
        height: 170,
      };

      await join(newEmptyFilePath, newJsonContent);
      const fileContent = await read(newEmptyFilePath);

      expect(fileContent).toEqual(newJsonContent);
    });

    it('should fail to merge the content of an existing invalid JSON file', async () => {
      const newInvalidJsonFilePath = path.resolve(
        __dirname,
        './dist/join-invalid.json'
      );
      const invalidJsonContent = 'i am not a valid JSON content';
      createMockFile(newInvalidJsonFilePath, invalidJsonContent);
      createdFiles.push(newInvalidJsonFilePath);
      const newJsonContent = {
        name: 'Jane Doe',
        age: 31,
        height: 170,
      };

      const joinPromise = join(newInvalidJsonFilePath, newJsonContent);

      await expectAsync(joinPromise).toBeRejectedWithError(
        JSONFileHandlerErrorMessage.NOT_A_JSON
      );
    });

    // No further testing is done in this field as `isAnObject` util takes care
    // of this and it's already well tested
    it('should fail with an invalid object', async () => {
      const nonExistentFilePath = path.resolve(
        __dirname,
        './dist/join-fail.json'
      );
      const jsonContent = ['black', 'red', 'blue', 'orange'];

      const writePromise = join(nonExistentFilePath, jsonContent);

      await expectAsync(writePromise).toBeRejectedWithError(
        JSONFileHandlerErrorMessage.NOT_A_VALID_OBJECT
      );
    });

    it('should fail to merge the content of an object with the content of a read only file', async () => {
      const newReadOnlyFilePath = path.resolve(
        __dirname,
        './dist/join-read-only.json'
      );
      const jsonContent = {
        name: 'Jane Doe',
        age: 31,
        height: 170,
      };
      const stringifiedJsonContent = JSON.stringify(jsonContent);
      createMockFile(
        newReadOnlyFilePath,
        stringifiedJsonContent,
        FilePermission.readOnly
      );
      createdFiles.push(newReadOnlyFilePath);
      const newJsonContent = {
        name: 'Jane Doe',
        age: 31,
        height: 170,
      };

      const joinPromise = join(newReadOnlyFilePath, newJsonContent);

      await expectAsync(joinPromise).toBeRejected();
    });
  });

  describe('overwrite', () => {
    const createdFiles: string[] = [];
    const createdDirectories: string[] = [];

    afterAll(() =>
      deleteCreatedFilesAndDirectories(createdFiles, createdDirectories)
    );

    it('should create a new file', async () => {
      const nonExistentFilePath = path.resolve(
        __dirname,
        './dist/new-file.json'
      );
      const jsonContent = {
        name: 'John Doe',
        age: 33,
      };

      await overwrite(nonExistentFilePath, jsonContent);
      createdFiles.push(nonExistentFilePath);

      await expectAsync(read(nonExistentFilePath)).toBeResolved();
    });

    it('should create a new file in a new directory', async () => {
      const nonExistentFilePath = path.resolve(
        __dirname,
        './dist/new-folder/new-file.json'
      );
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
      const nonExistentFilePath = path.resolve(
        __dirname,
        './dist/overwrite.json'
      );
      const jsonContent = {
        name: 'John Doe',
        age: 33,
      };
      await overwrite(nonExistentFilePath, jsonContent);
      createdFiles.push(nonExistentFilePath);
      const newJsonContent = {
        name: 'Jane Doe',
        age: 31,
        height: 170,
      };

      await overwrite(nonExistentFilePath, newJsonContent);
      const fileContent = await read(nonExistentFilePath);

      expect(fileContent).toEqual(newJsonContent);
    });

    it('should overwrite the content of an existing empty file', async () => {
      const newEmptyFilePath = path.resolve(
        __dirname,
        './dist/join-empty.json'
      );
      createMockFile(newEmptyFilePath, '');
      createdFiles.push(newEmptyFilePath);
      const newJsonContent = {
        name: 'Jane Doe',
        age: 31,
        height: 170,
      };

      await overwrite(newEmptyFilePath, newJsonContent);
      const fileContent = await read(newEmptyFilePath);

      expect(fileContent).toEqual(newJsonContent);
    });

    it('should overwrite the content of an existing invalid JSON file', async () => {
      const newInvalidJsonFilePath = path.resolve(
        __dirname,
        './dist/join-invalid.json'
      );
      const invalidJsonContent = 'i am not a valid JSON content';
      createMockFile(newInvalidJsonFilePath, invalidJsonContent);
      createdFiles.push(newInvalidJsonFilePath);
      const newJsonContent = {
        name: 'Jane Doe',
        age: 31,
        height: 170,
      };

      await overwrite(newInvalidJsonFilePath, newJsonContent);
      const fileContent = await read(newInvalidJsonFilePath);

      expect(fileContent).toEqual(newJsonContent);
    });

    it('should fail with an invalid object', async () => {
      const nonExistentFilePath = path.resolve(
        __dirname,
        './dist/overwrite-fail.json'
      );
      const jsonContent = ['black', 'red', 'blue', 'orange'];

      const writePromise = overwrite(nonExistentFilePath, jsonContent);

      await expectAsync(writePromise).toBeRejectedWithError(
        JSONFileHandlerErrorMessage.NOT_A_VALID_OBJECT
      );
    });

    it('should fail overwrite the content of a read only file', async () => {
      const newReadOnlyFilePath = path.resolve(
        __dirname,
        './dist/join-read-only.json'
      );
      const jsonContent = {
        name: 'Jane Doe',
        age: 31,
        height: 170,
      };
      const stringifiedJsonContent = JSON.stringify(jsonContent);
      createMockFile(
        newReadOnlyFilePath,
        stringifiedJsonContent,
        FilePermission.readOnly
      );
      createdFiles.push(newReadOnlyFilePath);
      const newJsonContent = {
        name: 'Jane Doe',
        age: 31,
        height: 170,
      };

      const overwritePromise = overwrite(newReadOnlyFilePath, newJsonContent);

      await expectAsync(overwritePromise).toBeRejected();
    });
  });
});
