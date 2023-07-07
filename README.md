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
