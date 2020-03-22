export enum JSONFileHandlerErrorMessage {
  EMPTY_FILE = 'File is empty',
  NOT_A_JSON = 'File contains invalid JSON content',
  NOT_A_VALID_OBJECT = 'Object is not a valid JSON content',
}

export const enum FilePermission {
  readOnly = 0o444,
  readAndWrite = 0o666,
}
