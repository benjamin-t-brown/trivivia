import {
  Table,
  Column,
  Model,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  DataType,
  BelongsTo,
} from 'sequelize-typescript';
import { LiveQuizRoundAnswersResponse } from 'shared/responses';
import { LiveQuizTeam } from './LiveQuizTeam';

@Table({
  timestamps: true,
})
export class LiveQuizRoundAnswers extends Model {
  @Column({ type: DataType.UUIDV4, primaryKey: true })
  id: string;

  @BelongsTo(() => LiveQuizTeam, {
    foreignKey: 'liveQuizTeamId',
  })
  quizTeam: LiveQuizTeam;

  // not a foreign key because it actually references the JSON inside the quiz instead
  // of the roundId of a template (which may have been deleted)
  @Column(DataType.UUIDV4)
  roundId: string;

  @Column(DataType.TEXT)
  answers: string;

  @Column(DataType.TEXT)
  answersGraded: string;

  @Column(DataType.BOOLEAN)
  didJoker: boolean;

  @CreatedAt
  creationDate: Date;

  @UpdatedAt
  updatedOn: Date;

  @DeletedAt
  deletionDate: Date;

  getResponseJson(): LiveQuizRoundAnswersResponse {
    const ret = this.toJSON();

    if (ret.quizTeam) {
      ret.quizTeam = this.quizTeam.getResponseJson();
    }
    if (ret.answers) {
      ret.answers = JSON.parse(ret.answers);
    }
    if (ret.answersGraded) {
      ret.answersGraded = JSON.parse(ret.answersGraded);
    }

    return ret;
  }
}
