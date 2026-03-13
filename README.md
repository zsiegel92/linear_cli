# Linear CLI

There are other Linear CLI tools, but this is the only one that wraps `fzf`. If you like `fzf`, this is the one for you.

- View issues sorted by modified date
- Open issue in browser
- Copy issue URL
- Copy branch name



https://github.com/user-attachments/assets/8eac928f-0bd2-47e0-8137-6838afd7c7fd



## Install

```bash
npm install -g linear-select-issue-cli
```

Note: `fzf` must be installed. Install it with `brew install fzf`.

## Usage

Run the command and follow the OAuth prompt to log in:
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
