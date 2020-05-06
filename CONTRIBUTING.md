# How to Contribute

First of, thanks for the taking the time to contribute!

You can contribute by [creating an issue](#creating-an-issue) or [making a pull request](#sending-a-pull-request).

## Creating an Issue

Before opening an issue please check if a similar issue exists by [searching existing issues](https://github.com/sebastian-altamirano/json-file-handler/issues).

If you want to report more than one bug, create one issue per bug.

If possible, provide code that demonstrates the issue.

## Sending a Pull Request

If you are unsure where to begin contributing, take a look at issues labeled [`good-first-issue`](https://github.com/sebastian-altamirano/json-file-handler/labels/good%20first%20issue) and [`help-wanted`](https://github.com/sebastian-altamirano/json-file-handler/labels/help%20wanted).

If you decide to fix an issue, please be sure to check the comment thread in case somebody is already working on a fix. If nobody is working on it at the moment, please leave a comment stating that you intend to work on it so other people don’t accidentally duplicate your effort.

If there isn't an issue created for what you want to solve, create one before you start working on it. This is helpful in case your solution is not accepted or the issue recurs, since the issue can be tracked.

Now that you're ready to start, follow the next steps:

1. Fork the repository
2. Create a branch
3. Install the dependencies
4. Code your thing! Document your code using TSDoc, and don't forget to test what you add
5. Update the README if it was necessary
6. Push the changes to your branch
7. Open the pull request against `master` branch

### Style Guide

You don't have to worry about style conventions as git hooks are used to ensure that your code complies with the style conventions that the repository uses.

When it's time to commit, use `git-cz` or `npm run cm` to commit using [Commitizen CLI](https://commitizen.github.io/cz-cli/), that way, your commits will respect the commit convention that the repository uses. If you don't want to use Commitizen that's fine, [Commitlint](https://github.com/conventional-changelog/commitlint) is also used to ensure that all commits comply with the same set of rules that Commitizen uses.

#### Making a Commit (`pre-commit` hook)

When you are about to commit, a set of actions are performed to ensure that your code:

- Is formatted using Prettier
- Doesn't have lint errors
- Doesn't break the tests
- Builds

#### Linting the Commit Message (`commit-msg` hook)

As it was already said, even if you use Commitizen CLI, Commitlint will be used to lint your commit messages after you have written them.

### Continuous Integration

The same steps described above are also executed at the CI level when you submit a pull request.

### Continuous Delivery

After a pull request is merged, if it triggers a release (includes a breaking change, a new feature, a bugfix, a refactor, a style change or a README update), the following things will happen:

- A new version will be released to GitHub and NPM
- `CHANGELOG.md` and docs will be updated
- `package.json` and `package-lock.json` version will be upped
- Code coverage will be updated
