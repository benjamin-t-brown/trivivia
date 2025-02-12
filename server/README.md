## Migrations

Required upon first setup, and any time the database models are changed.

If you are setting up, skip to step 4.

1. Edit src/models to the desired state
2. Create a migration that is subsequent to the last one in the 'migrations' folder.
3. Ensure that this file looks correct.
4. Apply migration with `yarn migrate`.  This uses the sequelize-cli.