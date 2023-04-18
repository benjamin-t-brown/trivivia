module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.sequelize.query(
        'ALTER TABLE liveQuizTeams ADD COLUMN publicId TEXT'
      ),
      queryInterface.sequelize.query(
        'ALTER TABLE liveQuizTeams ADD COLUMN currentScore INTEGER'
      ),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.sequelize.query(
        'ALTER TABLE liveQuizTeams DROP COLUMN publicId'
      ),
      queryInterface.sequelize.query(
        'ALTER TABLE liveQuizTeams DROP COLUMN currentScore'
      ),
    ]);
  },
};
