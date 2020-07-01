#!/usr/bin/bash

set -x
source /home/musicgen/.bash_profile

cd /home/musicgen/repositories/music-genre-ator

nvm use 12.18.2
npm install
npm run deploy
