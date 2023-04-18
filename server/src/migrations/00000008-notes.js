module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.sequelize.query(
        'ALTER TABLE quizTemplates ADD COLUMN notes TEXT'
      ),
      queryInterface.sequelize.query(
        'ALTER TABLE questionTemplates ADD COLUMN notes TEXT'
      ),
      queryInterface.sequelize.query(
        'ALTER TABLE roundTemplates ADD COLUMN notes TEXT'
      ),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.sequelize.query(
        'ALTER TABLE quizTemplates DROP COLUMN notes'
      ),
      queryInterface.sequelize.query(
        'ALTER TABLE questionTemplates ADD COLUMN notes TEXT'
      ),
      queryInterface.sequelize.query(
        'ALTER TABLE roundTemplates ADD COLUMN notes TEXT'
      ),
    ]);
  },
};
