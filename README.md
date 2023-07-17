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

# pull changes
cd trivivia
git pull

# test and build client
cd client
yarn test:prod
yarn build

# Since it is static site, client code doesn't require a server restart.

# If you need to deploy the server then do the following
# but no need to if you have no server changes.

# test server
cd ../server
yarn test:prod
forever list

# use the trivivia index from the forever list command
forever stop <number>

# forever doesn't actually kill the ts-node process so you have to find it
# 'forever restart' also does not work correctly
ps aux | grep node

# you're looking for:
#   /home/admin/trivivia/server/node_modules/.bin/ts-node --project ./tsconfig.json src/server.ts /home/admin/trivivia/server/
kill -9 159706

# when the server is not running anymore you can re-start it with this
forever start --uid "trivivia" --minUptime 1000 --spinSleepTime 1000 --append -c "yarn start:prod" ./

# to check if it's running correctly
forever list
```

## Nginx Restart

ecs server uses nginx to route ssl and domain names to the proper port where the server is listening:

```
/etc/nginx/conf.d/trivivia.conf
```

Check this conf if something is wrong.

SSL stuff is managed by certbot.
