#!/bin/bash

#ts-node --project ./server/tsconfig.json ./server/src/server.ts
forever start --uid "trivivia" --minUptime 1000 --spinSleepTime 1000 --append -c "yarn start:prod" ./