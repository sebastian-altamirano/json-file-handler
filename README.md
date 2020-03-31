# JSON File Handler

![CI/CD workflow status](https://github.com/sebastian-altamirano/json-file-handler/workflows/CI/CD%20Workflow/badge.svg)
[![codecov](https://codecov.io/gh/sebastian-altamirano/json-file-handler/branch/master/graph/badge.svg)](https://codecov.io/gh/sebastian-altamirano/json-file-handler)
[![npm version](https://badge.fury.io/js/json-file-handler.svg)](https://badge.fury.io/js/json-file-handler)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

Create or manipulate JSON files with asynchronous `read`, `write` and `join` (using an object) operations.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Things to know](#things-to-know)
  - [Error Handling](#error-handling)
- [Examples](#examples)
  - [Reading](#reading)
  - [Joining and Overwriting](#joining-and-overwriting)
- [API Documentation](#api-documentation)
- [FAQ](#faq)

## Installation

```shell
npm install --save json-file-handler
```

## Usage

Import the functions that you need to use, you can do so using `require`:

```js
const JSONFileHandler = require('json-file-handler');
const path = require('path');

const settingsFilePath = path.resolve(__dirname, '../config/settings.json');
JSONFileHandler.read(settingsFilePath)
  .then((settings) => {
    // settings processing...
  })
  .catch((error) => {
    // error handling...
  });
```

or ES6 `import` (if you are using TypeScript, you need to compile your project with `--esModuleInterop` flag for it to work):

```js
import { join as joinJSON } from 'json-file-handler';
const path = require('path');

const updateSettingsFile = async (settingsFilePath, newSettings) => {
  try {
    const absoluteSettingsFilePath = path.resolve(__dirname, settingsFilePath);
    const fileIndentation = 4;
    await joinJSON(absoluteSettingsFilePath, newSettings, fileIndentation);
  } catch (error) {
    // error handling...
  }
};
```

### Things to know

All the functions that this library makes available expect an absolute file path. You can use a relative file path, but it will be relative to the current working directory of the NodeJS process (`process.cwd()`).
Instead, you need to create an absolute file path from a relative path using `path.resolve()` like this:

```js
const path = require('path');

const relativeFilePath = '../config/settings.json';
const absoluteFilePath = path.resolve(__dirname, relativeFilePath);
```

Writing functions (`overwrite` and `join`) asks for a third and optional `indentationLevel` parameter, whose value determines how much space is used for indentation when the file is formatted.
`JSON.stringify` is responsible for the formatting, so a value less than 1 indicates that no formatting is applied, and a value greater than 10 is ignored.

### Error Handling

When the functions fails they return a rejected promise with an error that can either be an instance of `JSONFileHandlerError`, if the error was caused by a misuse of the library, or of `Error` (actually is of [`SystemError`](https://nodejs.org/api/errors.html#errors_class_systemerror), but Node does not exposes the class so it can not be checked using `instanceof` operator), if it was caused by violating an operating system constraint, like reading a file that does not exist, or trying to write to a read-only file.

Both types of errors contains a `code` property that can be used to handle them.
Bellow are the error codes that should be checked for each function, classified by kind:

- `read`
  - `JSONFileHandlerError`
    - `'EMPTY_FILE'`
    - `'NOT_A_JSON'`
  - `SystemError`
    - `'ENOENT'`
    - `'EPERM'`
    - `'EMFILE'`
    - `'EISDIR'`
- `join` and `overwrite`
  - `JSONFileHandlerError`
    - `'NOT_A_VALID_OBJECT'`
  - `SystemError`
    - `'EPERM'`
    - `'EMFILE'`
    - `'EISDIR'`

The error codes of `JSONFileHandlerError` are self explanatory, a more detailed explanation of `SystemError` error codes can be found inside [Node documentation](https://nodejs.org/api/errors.html#errors_common_system_errors). Also in the [examples section](#Examples).

## Examples

Functions can be executed using async/await or promises. `read` example uses promises while `join` example uses async/await.

### Reading

```js
import { read as readJSON } from 'json-file-handler';

const path = require('path');

const settingsFilePath = path.resolve(__dirname, '../config/settings.json');
readJSON(settingsFilePath)
  .then((settings) => {
    // settings processing...
  })
  .catch((error) => {
    switch (error.code) {
      case 'EMPTY_FILE':
        // The file is empty
        break;
      case 'NOT_A_JSON':
        // The content of the file can not be read as JSON
        break;
      case 'ENOENT':
        // The file you are trying to read doesn't exist
        break;
      case 'EPERM':
        // The file requires elevated privileges to be read
        break;
      case 'EMFILE':
        // There are too many open file descriptors, so the file cannot be read
        // at this time
        break;
      case 'EISDIR':
        // The given path is the path of an existing directory
        break;
    }
  });
```

### Joining and Overwriting

```js
import { join as joinJSON } from 'json-file-handler';

const path = require('path');

const updateSettingsFile = async (settingsFilePath, newSettings) => {
  try {
    const absoluteSettingsFilePath = path.resolve(__dirname, settingsFilePath);
    const fileIndentation = 4;
    await joinJSON(absoluteSettingsFilePath, newSettings, fileIndentation);
  } catch (error) {
    switch (error.code) {
      case 'NOT_A_VALID_OBJECT':
        // The object to be joined is not an object (it's a function, an array,
        // null or undefined)
        break;
      case 'EPERM':
        // The file requires elevated privileges to be written
        break;
      case 'EMFILE':
        // There are too many open file descriptors, so the file can not be
        // written at this time
        break;
      case 'EISDIR':
        // The given path is the path of an existing directory
        break;
    }
  }
};

const settingsFilePath = '../config/settings.json';
const newSettings = {
  resX: 1920,
  rexY: 1080,
  theme: 'light',
  preferredView: 'list',
};
updateSettingsFile(settingsFilePath, newSettings);
```

## API Documentation

API documentation can be read at [https://sebastian-altamirano.github.io/json-file-handler/](https://sebastian-altamirano.github.io/json-file-handler/).

## FAQ

- Why can i create and read files with a extension other than `.json`?

Some configuration files support JSON format without the `.json` extension, like `.prettierrc` and `.eslintrc`, which supports both YAML and JSON format.
