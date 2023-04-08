import {
  Table,
  Column,
  Model,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  DataType,
  HasMany,
  BelongsTo,
} from 'sequelize-typescript';
import {
  LiveQuizResponse,
  LiveQuizState,
  LiveRoundState,
} from 'shared/responses';
import { Account } from './Account';
import { LiveQuizTeam } from './LiveQuizTeam';
import { QuizTemplate } from './QuizTemplate';

@Table({
  timestamps: true,
})
export class LiveQuiz extends Model {
  @Column({ type: DataType.UUIDV4, primaryKey: true })
  id: string;

  @Column(DataType.TEXT)
  userFriendlyId: string;

  @BelongsTo(() => Account, {
    foreignKey: 'accountId',
  })
  account: Account;

  @BelongsTo(() => QuizTemplate, {
    foreignKey: 'quizTemplateId',
  })
  quizTemplate: QuizTemplate;

  @HasMany(() => LiveQuizTeam, {
    onDelete: 'cascade',
    hooks: true,
    foreignKey: 'liveQuizId',
  })
  liveQuizTeams: LiveQuizTeam[];

  @Column(DataType.TEXT)
  quizTemplateJson: string;

  @Column(DataType.TEXT)
  name: string;

  @Column(DataType.TEXT)
  quizState: LiveQuizState;

  @Column(DataType.TEXT)
  roundState: LiveRoundState;

  @Column(DataType.INTEGER)
  currentRoundNumber: number;

  @Column(DataType.INTEGER)
  currentQuestionNumber: number;

  @Column(DataType.DATE)
  startedAt: Date;

  @Column(DataType.DATE)
  completedAt: Date;

  @CreatedAt
  creationDate: Date;

  @UpdatedAt
  updatedOn: Date;

  @DeletedAt
  deletionDate: Date;

  getResponseJson() {
    const ret = this.toJSON();
    delete ret.quizTemplate;
    if (this.quizTemplateJson) {
      ret.quizTemplateJson = JSON.parse(this.quizTemplateJson);
    }
    if (this.liveQuizTeams) {
      ret.liveQuizTeams = this.liveQuizTeams.map(t => t.getResponseJson());
    }
    return ret as LiveQuizResponse;
  }

  getLiveResponseJson() {
    const ret = this.toJSON();
    delete ret.quizTemplate;
    delete ret.quizTemplateJson;
    ret.liveQuizTeams = this.liveQuizTeams.map(t => t.getResponseJson());
    return ret as LiveQuizResponse;
  }
}
