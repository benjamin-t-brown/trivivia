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
import { LiveQuiz } from './LiveQuiz';
import { LiveQuizRoundAnswers } from './LiveQuizRoundAnswers';
import { LiveQuizTeamResponse } from '@shared/responses';

@Table({
  timestamps: true,
})
export class LiveQuizTeam extends Model {
  @Column({ type: DataType.UUIDV4, primaryKey: true })
  id: string;

  @Column({ type: DataType.UUIDV4 })
  publicId: string;

  @BelongsTo(() => LiveQuiz, {
    foreignKey: 'liveQuizId',
  })
  liveQuiz: LiveQuiz;

  @HasMany(() => LiveQuizRoundAnswers, {
    onDelete: 'cascade',
    hooks: true,
    foreignKey: 'liveQuizTeamId',
  })
  liveQuizRoundAnswers: LiveQuizRoundAnswers[];

  @Column(DataType.TEXT)
  teamName: string;

  @Column(DataType.INTEGER)
  numberOfPlayers: number;

  @Column(DataType.INTEGER)
  currentScore: number;

  @CreatedAt
  creationDate: Date;

  @UpdatedAt
  updatedOn: Date;

  @DeletedAt
  deletionDate: Date;

  getResponseJson(): LiveQuizTeamResponse {
    const ret = this.toJSON();

    if (this.liveQuizRoundAnswers) {
      ret.liveQuizRoundAnswers = this.liveQuizRoundAnswers.map(a =>
        a.getResponseJson()
      );
    }
    return ret;
  }
}
