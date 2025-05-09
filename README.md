# Linear CLI

There are other Linear CLI tools, but this is the only one that wraps `fzf`. If you like `fzf`, this is the one for you.

## Install

```bash
npm install -g linear-select-issue-cli
```

Note: `fzf` must be installed. Install it with `brew install fzf`.

## Usage

1. Create an API key at https://linear.app/current-ai/settings/account/security
2. Set the `LINEAR_API_KEY` environment variable by adding the following to your `.zshrc` file:
```bash
export LINEAR_API_KEY='<your-api-key>'
```
3. Run the command
```bash
linear-cli
# OR
npx linear-select-issue-cli
```

## Features

1. View Linear issues
2. Select an issue and take an action:
   - Copy the branch name to the clipboard
   - Open the issue in the browser
   - Copy the issue URL to the clipboard

## Development

```bash
npm run dev
```

- NPM package: https://www.npmjs.com/package/linear-select-issue-cli
- Repository: https://github.com/zsiegel92/linear_cli
- Created by [Zach Siegel](https://github.com/zsiegel92)