# How to Contribute

First of, thanks for the taking the time to contribute!

You can contribute by:

- Creating an issue if you have found a bug or want to suggest an enhancement. If that's the case, check if it was already created first
- Making a pull request to fix a bug or submit an enhancement. Always make sure there's an issue created for what you want to solve, if not, create one

## Creating an Issue

Whether you want to report a bug or suggest an enhancement, please do so using the respecting [issue template](https://github.com/sebastian-altamirano/json-file-handler/issues/new/choose).

If you want to report more than one bug, create one issue per bug.

And don't forget to check if an issue already existed for whatever you want to report or suggest!

## Sending a Pull Request

Before starting to code, always make sure there's an issue created for what you want to solve, if not, create one.

Now that you're ready to start, follow the next steps:

1. Fork the repository
2. Create a branch
3. Install the dependencies
4. Code your thing! Document your code using TSDoc, and don't forget to test what you add
5. Update the README if it was necessary
6. Push the changes to your branch
7. Open the pull request against `master` branch

### Style Guide

You don't have to worry about style conventions as a pre-commit hook is used to ensure that all commits respects a set of guidelines. Every time you commit your code will be:

- Formatted using [Prettier](https://github.com/prettier/prettier)
- Linted using [ESLint](https://github.com/eslint/eslint)
- Tests will be executed
- Source code will be compiled

If any of those steps fail, your commit will be cancelled.

#### Commit Message

You neither have to worry about commit message conventions as [Commitizen](https://github.com/commitizen/cz-cli) is used for that purpose.

When you run `git commit`, pre-commit hook will be executed, and if it succeeds, Commitizen CLI will guide you through the commit message creation.
