import {
  Table,
  Column,
  Model,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  DataType,
  HasMany,
  HasOne,
  BelongsTo,
} from 'sequelize-typescript';
import {
  LiveQuizResponse,
  LiveQuizState,
  LiveRoundState,
} from 'shared/responses';
import { LiveQuiz } from './LiveQuiz';
import { LiveQuizRoundAnswers } from './LiveQuizRoundAnswers';
import { LiveQuizTeam } from './LiveQuizTeam';

@Table({
  timestamps: true,
})
export class LiveQuizTeamSession extends Model {
  @Column({ type: DataType.UUIDV4, primaryKey: true })
  id: string;

  @BelongsTo(() => LiveQuiz, {
    foreignKey: 'liveQuizTeamId',
  })
  quizTeam: LiveQuizTeam;

  @CreatedAt
  creationDate: Date;

  @UpdatedAt
  updatedOn: Date;

  @DeletedAt
  deletionDate: Date;

  getResponseJson() {
    const ret = this.toJSON();
    return ret;
  }
}
