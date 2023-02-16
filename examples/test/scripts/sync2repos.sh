#!/usr/bin/env sh

# 新建分支名以projectname-time命名

REPO_URL=git@git.xiaojukeji.com:biz-fe/driver/activity/driver-activity-repos.git
RELEASE_TYPE=driverActivityBiz

set -e
function log() {
  now=`date '+%Y-%m-%d %H:%M:%S'`
  echo "[$now] ================= $REPO_URL ================="
}
log "env"
log "node version `node -v`"
log "npm version `npm -v`"

if [[ -n "`git status --porcelain`" ||  -n "`git diff master origin/master --name-only`" ]]; then
  echo "repo is not clean or not sync with remote yet, please commit&push first"
  exit 1
fi

CDATE=`date +'%Y%m%d%H%M%S'`

# 保存在本地的repos名，因端上同学仓库也叫 driver-repos，通过加前缀区分
REPO_NAME=$RELEASE_TYPE-driver-repos

# 得到项目名称
PROJECT_NAME=`node -p "require('./package.json').bizProjectName"`
BRANCH_NAME=$PROJECT_NAME-$CDATE
GIT_PATH=`git remote -v | awk '$3=="(push)" {print $2}'`

cd ../

echo

if [ ! -d $REPO_NAME ]
  then
    log "cloning driver-repos"
    git clone --progress $REPO_URL $REPO_NAME
    cd $REPO_NAME
  else 
    cd $REPO_NAME
    log "updating driver-repos"
    git fetch --all
    git reset --hard origin/master
fi

git checkout -b $BRANCH_NAME

# HAS_CUR_REPO=$(awk -v PROJECT_NAME="$PROJECT_NAME" '$0 ~ PROJECT_NAME {print $0; exit;}' .gitmodules)
echo
log "sync current project to driver-repos"

# 目录不存在
if [ ! -d $PROJECT_NAME ]
  then
    log "add $PROJECT_NAME to repos"
    git subtree add --prefix "$PROJECT_NAME" "$GIT_PATH" master --squash
  else
    log "updating $PROJECT_NAME"
    git subtree pull -m "[update] $PROJECT_NAME " --prefix $PROJECT_NAME "$GIT_PATH" master  --squash
fi

log "pushing to remote branch"
git push --quiet -u origin $BRANCH_NAME
log "pusing to remote branch done"
git checkout master
git branch -D $BRANCH_NAME

log "job done"