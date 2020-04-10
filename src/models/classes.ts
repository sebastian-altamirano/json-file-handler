import { JSONFileHandlerErrorMessage } from './enums';

/** Extends `Error` by adding the `code` and `path` properties that are present
 * in `SystemError`.
 */
export class JSONFileHandlerError extends Error {
  code: string;
  /** The file that caused the error (useful when multiple files are
   * manipulated) */
  path: string;

  constructor(
    code: keyof typeof JSONFileHandlerErrorMessage,
    filePath: string
  ) {
    const message = JSONFileHandlerErrorMessage[code];
    super(message);
    this.code = code;
    this.path = filePath;
  }
}
