#!/bin/sh
set -eu

packagesDir="$(cd "$(dirname "$0")/../../packages" && pwd)"

for packageDir in "$packagesDir"/*; do
  packageName="$(node -p "require(process.argv[1]).name" "$packageDir/package.json")"
  targetDir="node_modules/$packageName"
  [ "$packageDir" -ef "$targetDir" ] && continue
  mkdir -p "$targetDir"
  for sourcePath in "$packageDir"/*; do
    entryName="$(basename "$sourcePath")"
    [ "$entryName" != node_modules ] || continue
    rm -rf "$targetDir/$entryName"
    cp -R "$sourcePath" "$targetDir/$entryName"
  done
done
