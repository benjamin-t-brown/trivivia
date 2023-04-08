module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query('ALTER TABLE liveQuizRoundAnswers ADD COLUMN answersGraded TEXT');
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query('ALTER TABLE liveQuizRoundAnswers DROP COLUMN answersGraded');
  },
};
