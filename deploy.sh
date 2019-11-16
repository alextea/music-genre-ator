#!/bin/bash

set -x

# delete existing deployment
rm -rf /home/musicgen/apps/music-genre-ator

# copy new deploy
cp -r  /home/musicgen/repositories/music-genre-ator /home/musicgen/apps

# cd to new direction
cd /home/musicgen/apps/music-genre-ator

npm install
npm deploy
