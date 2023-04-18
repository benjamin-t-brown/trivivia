module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query('ALTER TABLE liveQuizzes ADD COLUMN currentRoundAnswerNumber INTEGER');
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query('ALTER TABLE liveQuizzes DROP COLUMN currentRoundAnswerNumber');
  },
};
