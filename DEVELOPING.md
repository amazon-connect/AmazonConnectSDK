# AmazonConnectSDK

## Getting Started

On the root of the package (do not run in subfolders)

```
bb install
```

## Build Projects

Build all packages

```
bb run --ws build
```

Build specific package

```
bb run core build
bb run app build
bb run agent build
```

(Can also be run with npm instead of bb for a faster build)

## Check Types

Use the command line to check for any type errors.

```
npm run --ws check-types
```

Check types for a single package

```
npm run core check-types
npm run app check-types
npm run agent check-types
```

## Testing

Use the command line to run tests in Jest with Babel. Test does not do any type checking. When testing as part of a build process, always run check-types prior to testing.

```
npm run --ws test
```

Check types for a single package

```
npm run core test
npm run app test
npm run agent test
```

## Publish Packages

Publish all packages

```
bb publish --ws
```

Publish individual package

```
bb publish -w core
bb publish -w app
bb publish -w agent
```

## Using VS Code

The root of this package has a `vscode` folder that contains a [VS Code Workspace](https://code.visualstudio.com/docs/editor/workspaces) called `AmazonConnectSDK.code-workspace`. The workspace opens all folders in the project. 

To open the workspace, do a file open in VS code or on the command line use:

```
code .vscode/AmazonConnectSDK.code-workspace
```

At the surface, this may appear similar to opening a folder or going to `vscode .` in the root folder. However, the workspace is configured to support running jest tests (including debugging) directly in the IDE. This requires the [Jest Extension](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest) to be installed in VS Code.

From there, there are several ways to run tests in the IDE. One way to do this is to right click in a test file and the context menu will offer multiple options about running tests (including debug mode). Breakpoints can also be set right in the browser.

Running with this workspace today currently only allows the single project to be run, but in the future we will look to setup a workspace in other packages that use the SDK that includes the SDK to accomplish the same this and creating the feel of a monorepo across multiple Brazil projects.

## Setup local development with Agent Workspace and Test App

### Create brazil workspace

```
% brazil ws --create --name amazon-connect-sdk --version-set HudsonTestApplications/development
% cd amazon-connect-sdk
```

### Check out packages
```
% brazil ws --use --package AmazonConnectSDK
% brazil ws --use --package AgentAppUI
% brazil ws --use --package HudsonTestApplications
```

### Build packages

Start with AmazonConnectSDK since the other packages depend on it.

```
% cd src/AmazonConnectSDK
% brazil-build
% cd ../HudsonTestApplications
% brazil-build
% cd ../AgentAppUI
% brazil-build
```

or if you want to do it all in one command use

```
% brazil-recursive-cmd --allPackages brazil-build
```

### Run test app

Cd in to HudsonTestApplications package directory and start the app.

```
brazil-build start
```

This will start the app server running on port `8081` by default. You can load it directly in your browser by going to
`http://localhost:8081`.

This needs to be kept running, so open a new console window / tab or run this in the background.

### Run agent app ui

Cd into AgentAppUI package directory.

Create a `.env.development.local` file with the following in it...

```
CONNECT_URL=<insert connect url for test instance>
CLIENT_MODE=MOCK
REMOTE_WIDGETS=true
ENABLE_AGENT_APP_3P=true
HOST=localhost
```

This requires that you have a test connect instance so it can load other apps like CCP, Customer Profiles, Cases, and Wisdom. Make sure you have:

1. Logged in to your test instance before using your local version
2. Add your local origin to the approved origins in the AWS console. It will be `https://localhost:5000`

Then, run the agent app server ...

```
% brazil-build start
```

This should automatically open in your browser. You may need to tell chrome that you are ok loading the UI over https with a non-verified cert.

### Load 3p test app in agent workspace

You need to launch the test app via the app launcher in the agent workspace.
