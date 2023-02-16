#!/usr/bin/env sh

TMP_DIR=.tmp
CDATE=`date +'%Y%m%d%H%M'`

npm install

npm run build:web

# 得到项目名称
PROJECT_NAME=`node -p "require('./package.json').bizProjectName"`
# 模板分支名
VIEW_BRANCH_NAME=$PROJECT_NAME-$CDATE

mkdir -p $TMP_DIR

cd $TMP_DIR

# NEED_MODIFY: 静态资源上线仓库地址
git clone git@git.xiaojukeji.com:biz-fe/driver/activity/driver-activity-biz-static.git static-repo
cd static-repo

# 放置资源的文件夹，默认项目名
mkdir -p $PROJECT_NAME
cp -R ../../dist/web/$PROJECT_NAME/ $PROJECT_NAME/

git add .

# NEED_MODIFY: commit message
git commit -m "bulid $PROJECT_NAME static"

git push

cd ..

# NEED_MODIFY: 入口模板上线仓库地址
git clone git@git.xiaojukeji.com:biz-fe/driver/activity/driver-activity-biz-page.git page-repo
cd page-repo

git checkout -b $VIEW_BRANCH_NAME

# 放置的 pages 的名字，默认项目名
mkdir -p $PROJECT_NAME

cd $PROJECT_NAME

# NEED_MODIFY: 复制 html 模板文件到当前目录下
cp "../../../dist/web/index.html" ./

git add .

# NEED_MODIFY: commit message.
git commit

git push origin $VIEW_BRANCH_NAME

cd ../../..

rm -rf $TMP_DIR
