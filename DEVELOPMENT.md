# Requirements
- node >= 20 or later
- yarn (npm install --global yarn)

# Run the install script
`./install.sh`

# Database setup
The server by default expects a sqlite database in `db/prod.sqlite`.  If it's not there, it will still boot, but will connect to an empty database and nothing will work properly.

If you need a new db, you'll need to run the migrations in the server dir.
`cd server && yarn setup-db`

# Run the app
`./start.dev.sh`
or
`yarn start`

This boots both client (vite) and server (express) and allows you to open a page to http://localhost:3005/.

