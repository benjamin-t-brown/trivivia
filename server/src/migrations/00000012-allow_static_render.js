module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.sequelize.query(
        'ALTER TABLE quizTemplates ADD COLUMN allowStaticRender BOOLEAN'
      ),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.sequelize.query(
        'ALTER TABLE quizTemplates DROP COLUMN allowStaticRender'
      ),
    ]);
  },
};
