# How to Contribute

First of, thanks for the taking the time to contribute!

You can contribute by:

- Creating an issue if you have found a bug or want to suggest an enhancement. If that's the case, check if it was already created first
- Making a pull request to fix a bug or submit an enhancement. Always make sure there's an issue created for what you want to solve, if not, create one

## Creating an Issue

Whether you want to report a bug or suggest an enhancement, please do so using the respecting [issue template](https://github.com/sebastian-altamirano/json-file-handler/issues/new/choose).

If you want to report more than one bug, create one issue per bug.

And don't forget to check if an issue already exists for whatever you want to report or suggest!

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

You don't have to worry about style conventions as multiple git hooks are set up to run at specific events.

### Making a Commit (`pre-commit` hook)

When you are about to commit, a set of actions are performed to ensure that your code:

- Is formatted using Prettier
- Doesn't have lint errors
- Doesn't break the tests
- Builds

### Writting the Commit Message (`prepare-commit-msg` hook)

If your code pass those steps then [Commitizen CLI](https://github.com/commitizen/cz-cli) is executed to guide you through the commit message creation. That way all the commits made to the repository will follow the same guidelines.

### Linting the Commit Message (`commit-msg` hook)

If you don't want to use Commitizen that's fine, [Commitlint](https://github.com/conventional-changelog/commitlint) is also used to ensure that all commits comply with the same set of rules that Commitizen would use.

### Continuous Integration

The same steps described above are also executed at the CI level. After a pull request is merged, if it triggers a release (is a breaking change, a feature, a bugfix, a refactor, a style change or a README update), the following things will happen:

- A new version will be released to GitHub and NPM
- `CHANGELOG.md` and docs will be updated
- `package.json` and `package-lock.json` version will be upped
