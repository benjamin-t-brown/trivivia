# Trivivia

Web application to create and manage "Geeks Who Drink"-like trivia quizzes.

## Requirements
node 18.7.0^
yarn 1.22.11^


## Deployment on ec2

This application is deployed at [https://trivivia.twilightparadox.com](https://trivivia.twilightparadox.com/login)

```
# ssh into ecs instance
ssh admin@52.91.8.165

# test and build client
cd trivivia/client
yarn test:prod
yarn build

# test server
cd ../server
yarn test:prod
forever list

# use the trivivia index from the forever list command
forever stop 1

# forever doesn't actually kill the ts-node process so you have to find it
ps aux | grep node

# you're looking for:
#   /home/admin/trivivia/server/node_modules/.bin/ts-node --project ./tsconfig.json src/server.ts /home/admin/trivivia/server/
kill -9 159706

# when the server is not running anymore you can re-start it with this
forever start --uid "trivivia" --minUptime 1000 --spinSleepTime 1000 --append -c "yarn start:prod" ./

# to check if it's running correctly
forever list
```
