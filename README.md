# A modified/updated version of https://www.npmjs.com/package/download-git-repo with TypeScript support

Download a repository (GitHub, GitLab, Bitbucket) from node.js into a directory!

## Install:

Yarn: `yarn add @bracketed/gitdownloader`
NPM: `npm install @bracketed/gitdownloader`

## Usage:

```ts
import gitDownload from '@bracketed/gitdownloader';

const repo = await gitDownload('https://github.com/bracketed/download-repository', 'Desktop');

// Returns true or false when ran
```

Happy coding!
