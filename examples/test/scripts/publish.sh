#!/bin/bash

if [[ -n "`git status --porcelain`" ||  -n "`git diff master origin/master --name-only`" ]];
then
  echo "repo is not clean or not sync with remote yet, please commit&push first"
  exit 2
fi

PROJECT_NAME=`node -p "require('./package.json').name"`

NEW_VERSION=$(npm version patch --no-git-tag-version -m "[release] $PROJECT_NAME ")

echo "$PROJECT_NAME release $NEW_VERSION 版本"

git add .

git commit -m "release $NEW_VERSION"

git push

npm config set registry=https://npm.intra.xiaojukeji.com

npm publish

exit 0
