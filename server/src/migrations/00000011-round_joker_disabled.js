module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.sequelize.query(
        'ALTER TABLE quizTemplates DROP COLUMN isJoker'
      ),
      queryInterface.sequelize.query(
        'ALTER TABLE roundTemplates ADD COLUMN jokerDisabled BOOLEAN'
      ),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.sequelize.query(
        'ALTER TABLE quizTemplates ADD COLUMN isJoker BOOLEAN'
      ),
      queryInterface.sequelize.query(
        'ALTER TABLE roundTemplates DROP COLUMN jokerDisabled'
      ),
    ]);
  },
};
