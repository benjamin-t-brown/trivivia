## Requirements

node 18.7.0^
npm

## Deployment on ec2 (without docker)

This application is deployed at [https://trivivia.net](https://trivivia.net/login)

```
# ssh into ecs instance
ssh admin@3.84.126.152

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
ps aux | grep /home/admin/trivivia/server/node_modules/.bin/

# you're looking for:
#   /home/admin/trivivia/server/node_modules/.bin/(ts-node OR tsx) --project ./tsconfig.json src/server.ts /home/admin/trivivia/server/
kill -9 159706

# before starting server again, source env
source ~/trivivia_config_vars.sh

# when the server is not running anymore you can re-start it with this
cd server
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

Changes can be reflected with:

```
sudo service nginx restart
```

SSL stuff is managed by certbot.

## Docker + AWS

Install docker on system

```
sudo apt-get install docker.io -y
sudo systemctl start docker
# verify
sudo docker run hello-world
sudo usermod -a -G docker $(whoami)f
```

Install awscli

```
pip3 install awscli

# configure with cli-user
aws configure
# login to docker registry
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 442979135069.dkr.ecr.us-east-1.amazonaws.com
```

Build and push image

```
docker build -t revirtualis/trivivia .
docker tag revirtualis/trivivia:latest 442979135069.dkr.ecr.us-east-1.amazonaws.com/revirtualis/trivivia:latest
docker push 442979135069.dkr.ecr.us-east-1.amazonaws.com/revirtualis/trivivia:latest
```

Running the image
```
# debug msys
docker run --rm -it -p 3006:3006 --mount type=bind,source="$(cygpath -w "$(pwd)")/db",target=/app/db --entrypoint bash revirtualis/trivivia:latest

# debug bash
docker run --rm -it -p 3006:3006 --mount type=bind,source="$(pwd)/db",target=/app/db --entrypoint bash revirtualis/trivivia:latest

# local (from root of repo)
docker run -it -p 3006:3006 --mount type=bind,source="$(cygpath -w "$(pwd)")/db",target=/app/db revirtualis/trivivia:latest

# server (from root of repo)
docker run -it -p 3006:3006 --mount type=bind,source="$(pwd)/db",target=/app/db revirtualis/trivivia:latest
```

