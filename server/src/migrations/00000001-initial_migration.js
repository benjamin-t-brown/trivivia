'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "Accounts", deps: []
 * createTable "QuizTemplates", deps: [Accounts]
 * createTable "LiveQuizTeams", deps: [LiveQuizzes]
 * createTable "LiveQuizRoundAnswers", deps: [LiveQuizTeams]
 * createTable "LiveQuizTeamSessions", deps: [LiveQuizTeams]
 * createTable "RoundTemplates", deps: [QuizTemplates]
 * createTable "LiveQuizzes", deps: [Accounts, QuizTemplates]
 * createTable "QuestionTemplates", deps: [RoundTemplates]
 *
 **/

var info = {
  revision: 1,
  name: 'initial_migration',
  created: '2023-04-03T14:24:50.787Z',
  comment: '',
};

var migrationCommands = [
  {
    fn: 'createTable',
    params: [
      'Accounts',
      {
        id: {
          primaryKey: true,
          type: Sequelize.UUIDV4,
        },
        email: {
          type: Sequelize.STRING,
        },
        password: {
          type: Sequelize.STRING,
        },
        creationDate: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedOn: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        deletionDate: {
          type: Sequelize.DATE,
        },
      },
      {},
    ],
  },

  {
    fn: 'createTable',
    params: [
      'QuizTemplates',
      {
        id: {
          primaryKey: true,
          type: Sequelize.UUIDV4,
        },
        numRounds: {
          type: Sequelize.INTEGER,
        },
        roundOrder: {
          type: Sequelize.TEXT,
        },
        name: {
          type: Sequelize.TEXT,
        },
        creationDate: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedOn: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        deletionDate: {
          type: Sequelize.DATE,
        },
        accountId: {
          onDelete: 'cascade',
          onUpdate: 'CASCADE',
          references: {
            model: 'Accounts',
            key: 'id',
          },
          allowNull: true,
          type: Sequelize.UUIDV4,
        },
      },
      {},
    ],
  },

  {
    fn: 'createTable',
    params: [
      'LiveQuizTeams',
      {
        id: {
          primaryKey: true,
          type: Sequelize.UUIDV4,
        },
        teamName: {
          type: Sequelize.TEXT,
        },
        numberOfPlayers: {
          type: Sequelize.INTEGER,
        },
        creationDate: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedOn: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        deletionDate: {
          type: Sequelize.DATE,
        },
        liveQuizId: {
          onDelete: 'cascade',
          onUpdate: 'CASCADE',
          references: {
            model: 'LiveQuizzes',
            key: 'id',
          },
          allowNull: true,
          type: Sequelize.UUIDV4,
        },
      },
      {},
    ],
  },

  {
    fn: 'createTable',
    params: [
      'LiveQuizRoundAnswers',
      {
        id: {
          primaryKey: true,
          type: Sequelize.UUIDV4,
        },
        roundId: {
          type: Sequelize.UUIDV4,
        },
        answers: {
          type: Sequelize.TEXT,
        },
        didJoker: {
          type: Sequelize.BOOLEAN,
        },
        creationDate: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedOn: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        deletionDate: {
          type: Sequelize.DATE,
        },
        liveQuizTeamId: {
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
          references: {
            model: 'LiveQuizTeams',
            key: 'id',
          },
          allowNull: true,
          type: Sequelize.UUIDV4,
        },
      },
      {},
    ],
  },

  {
    fn: 'createTable',
    params: [
      'LiveQuizTeamSessions',
      {
        id: {
          primaryKey: true,
          type: Sequelize.UUIDV4,
        },
        creationDate: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedOn: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        deletionDate: {
          type: Sequelize.DATE,
        },
        liveQuizTeamId: {
          onDelete: 'cascade',
          onUpdate: 'CASCADE',
          references: {
            model: 'LiveQuizTeams',
            key: 'id',
          },
          allowNull: true,
          type: Sequelize.UUIDV4,
        },
      },
      {},
    ],
  },

  {
    fn: 'createTable',
    params: [
      'RoundTemplates',
      {
        id: {
          primaryKey: true,
          type: Sequelize.UUIDV4,
        },
        title: {
          type: Sequelize.TEXT,
        },
        description: {
          type: Sequelize.TEXT,
        },
        questionOrder: {
          type: Sequelize.TEXT,
        },
        creationDate: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedOn: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        deletionDate: {
          type: Sequelize.DATE,
        },
        quizTemplateId: {
          onDelete: 'cascade',
          onUpdate: 'CASCADE',
          references: {
            model: 'QuizTemplates',
            key: 'id',
          },
          allowNull: true,
          type: Sequelize.UUIDV4,
        },
      },
      {},
    ],
  },

  {
    fn: 'createTable',
    params: [
      'LiveQuizzes',
      {
        id: {
          primaryKey: true,
          type: Sequelize.UUIDV4,
        },
        quizTemplateJson: {
          type: Sequelize.TEXT,
        },
        quizTemplateJson: {
          type: Sequelize.TEXT,
        },
        quizState: {
          type: Sequelize.TEXT,
        },
        roundState: {
          type: Sequelize.TEXT,
        },
        currentRoundNumber: {
          type: Sequelize.INTEGER,
        },
        currentQuestionNumber: {
          type: Sequelize.INTEGER,
        },
        startedAt: {
          type: Sequelize.DATE,
        },
        completedAt: {
          type: Sequelize.DATE,
        },
        creationDate: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedOn: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        deletionDate: {
          type: Sequelize.DATE,
        },
        accountId: {
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
          references: {
            model: 'Accounts',
            key: 'id',
          },
          allowNull: true,
          type: Sequelize.UUIDV4,
        },
        quizTemplateId: {
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
          references: {
            model: 'QuizTemplates',
            key: 'id',
          },
          allowNull: true,
          type: Sequelize.UUIDV4,
        },
      },
      {},
    ],
  },

  {
    fn: 'createTable',
    params: [
      'QuestionTemplates',
      {
        id: {
          primaryKey: true,
          type: Sequelize.UUIDV4,
        },
        text: {
          type: Sequelize.TEXT,
        },
        answers: {
          type: Sequelize.TEXT,
        },
        answerType: {
          type: Sequelize.STRING,
        },
        imageLink: {
          type: Sequelize.TEXT,
        },
        orderMatters: {
          type: Sequelize.BOOLEAN,
        },
        isBonus: {
          type: Sequelize.BOOLEAN,
        },
        creationDate: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedOn: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        deletionDate: {
          type: Sequelize.DATE,
        },
        roundTemplateId: {
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
          references: {
            model: 'RoundTemplates',
            key: 'id',
          },
          allowNull: true,
          type: Sequelize.UUIDV4,
        },
      },
      {},
    ],
  },
];

var rollbackCommands = [
  {
    fn: 'dropTable',
    params: ['QuizTemplates'],
  },
  {
    fn: 'dropTable',
    params: ['LiveQuizTeams'],
  },
  {
    fn: 'dropTable',
    params: ['LiveQuizRoundAnswers'],
  },
  {
    fn: 'dropTable',
    params: ['LiveQuizTeamSessions'],
  },
  {
    fn: 'dropTable',
    params: ['RoundTemplates'],
  },
  {
    fn: 'dropTable',
    params: ['LiveQuizzes'],
  },
  {
    fn: 'dropTable',
    params: ['QuestionTemplates'],
  },
  {
    fn: 'dropTable',
    params: ['Accounts'],
  },
];

module.exports = {
  pos: 0,
  up: function (queryInterface, Sequelize) {
    var index = this.pos;
    return new Promise(function (resolve, reject) {
      function next() {
        if (index < migrationCommands.length) {
          let command = migrationCommands[index];
          console.log('[#' + index + '] execute: ' + command.fn);
          index++;
          queryInterface[command.fn]
            .apply(queryInterface, command.params)
            .then(next, reject);
        } else resolve();
      }
      next();
    });
  },
  down: function (queryInterface, Sequelize) {
    var index = this.pos;
    return new Promise(function (resolve, reject) {
      function next() {
        if (index < rollbackCommands.length) {
          let command = rollbackCommands[index];
          console.log('[#' + index + '] execute: ' + command.fn);
          index++;
          queryInterface[command.fn]
            .apply(queryInterface, command.params)
            .then(next, reject);
        } else resolve();
      }
      next();
    });
  },
  info: info,
};
