#!/usr/bin/env bash

# Checking parameters
if [ $# -ne 1 ]; then
	echo "Invalid parameters";
	echo "Usage : ./publish.sh %commit-message%";
	exit;
fi

# Reading version from bower.json with node
version=$(node --eval "console.log(require('./bower.json').version)")

echo "> Version: $version";
echo "> Message: $1";
echo "";

echo "> Adding files..."
git add --all
git status
echo "> Done";
echo ""

echo "> Commiting $1..."
git commit -m "$1"
echo "> Done";
echo ""

echo "> Creating tag..."
git tag -a "v${version}" -m $1
echo "> Done";
echo ""

echo "> Pushing to github..."
git push origin master
git push --tags
echo "> Done !"