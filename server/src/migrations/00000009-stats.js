module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.sequelize.query(
        'ALTER TABLE liveQuizzes ADD COLUMN stats TEXT'
      ),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.sequelize.query(
        'ALTER TABLE liveQuizzes DROP COLUMN stats'
      ),
    ]);
  },
};
