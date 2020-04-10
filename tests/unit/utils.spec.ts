/* eslint-disable sonarjs/no-duplicate-string */

import { isAnObject, isAValidJsonString } from '../../src/utils';

describe('JSON Handler Utils', () => {
  describe('isAnObject', () => {
    it('should succeed with an object', () => {
      const object = {
        x: 0,
        y: 0,
      };

      const result = isAnObject(object);

      expect(result).toBeTrue();
    });

    it('should succeed with a custom object', () => {
      const customObject = new Error('Some error');

      const result = isAnObject(customObject);

      expect(result).toBeTrue();
    });

    it('should fail with an array', () => {
      const mockArray = [1, 2, 3];

      const result = isAnObject(mockArray);

      expect(result).toBeFalse();
    });

    it('should fail with a function', () => {
      const square = (number: number): number => number * number;

      const result = isAnObject(square);

      expect(result).toBeFalse();
    });

    it('should fail with null', () => {
      // eslint-disable-next-line @typescript-eslint/no-inferrable-types
      const nullValue: null = null;

      const result = isAnObject(nullValue);

      expect(result).toBeFalse();
    });

    it('should fail with undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-inferrable-types
      const undefinedValue: undefined = undefined;

      const result = isAnObject(undefinedValue);

      expect(result).toBeFalse();
    });
  });

  describe('isAValidJsonString', () => {
    it('should succeed with a valid JSON string', () => {
      const validJsonString = `{
        "resX": 1920,
        "resY": 1080
      }`;

      const validationResult = isAValidJsonString(validJsonString);

      expect(validationResult).toBeTrue();
    });

    it('should fail with an invalid JSON string', () => {
      const invalidJsonString = 'true';

      const validationResult = isAValidJsonString(invalidJsonString);

      expect(validationResult).toBeFalse();
    });

    it('should fail with an empty string', () => {
      const emptyString = '';

      const validationResult = isAValidJsonString(emptyString);

      expect(validationResult).toBeFalse();
    });

    it('should fail with null', () => {
      // eslint-disable-next-line @typescript-eslint/no-inferrable-types
      const nullValue: null = null;

      const validationResult = isAValidJsonString(nullValue);

      expect(validationResult).toBeFalse();
    });

    it('should fail with undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-inferrable-types
      const undefinedValue: undefined = undefined;

      const validationResult = isAValidJsonString(undefinedValue);

      expect(validationResult).toBeFalse();
    });
  });
});
