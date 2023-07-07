#!/usr/bin/env bash

# Fail script on errors
set -euo pipefail

# all peru npm build-systems should call peru-npm configure-npm to ensure npm
# uses the correct registry.
peru-npm configure-npm

# remove resolved key from package-lock
trap 'peru-npm clean-package-lock' EXIT

# Case brazil-build was launched either with `brazil-build` or `brazil-build release`
if [ "${1:-release}" == "release" ]; then
  # update any workspace or version set packages that may have changed.
  # this also installs dependencies.
  peru-npm update-built-from-source-packages

  echo "Node version: $(node --version)"

  npm run --ws clean
  npm run --ws build
  npm run --ws check-types
  npm run --ws test
  npm publish --ws
# Case where brazil-build was launched with `brazil-build X`
else
  # Otherwise, call npm with `brazil-build` arguments.
  npm "$@"
fi