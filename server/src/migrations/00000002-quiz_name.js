module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query('ALTER TABLE liveQuizzes ADD COLUMN name TEXT');
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query('ALTER TABLE liveQuizzes DROP COLUMN name');
  },
};
