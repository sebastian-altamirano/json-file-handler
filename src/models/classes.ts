import { JSONFileHandlerErrorMessage } from './enums';

/** Extends `Error` by adding a `code` property for ease of debugging, as
 * `SystemError` also contains that property.
 */
export class JSONFileHandlerError extends Error {
  code: string;

  constructor(code: keyof typeof JSONFileHandlerErrorMessage) {
    const message = JSONFileHandlerErrorMessage[code];
    super(message);
    this.code = code;
  }
}
