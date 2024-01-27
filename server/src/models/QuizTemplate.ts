import {
  Table,
  Column,
  Model,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  DataType,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { QuizTemplateResponse } from 'shared/responses';
import { Account } from './Account';
import { LiveQuiz } from './LiveQuiz';
import { RoundTemplate } from './RoundTemplate';

@Table({
  timestamps: true,
})
export class QuizTemplate extends Model {
  @Column({ type: DataType.UUIDV4, primaryKey: true })
  id: string;

  @BelongsTo(() => Account, {
    foreignKey: 'accountId',
  })
  account: Account;

  @HasMany(() => LiveQuiz, {
    onDelete: 'cascade',
    hooks: true,
    foreignKey: 'quizTemplateId',
  })
  liveQuizzes: LiveQuiz[];

  @HasMany(() => RoundTemplate, {
    onDelete: 'cascade',
    hooks: true,
    foreignKey: 'quizTemplateId',
  })
  rounds: RoundTemplate[];

  @Column({ type: DataType.INTEGER })
  numRounds: number;

  @Column(DataType.TEXT)
  roundOrder: string;

  @Column(DataType.TEXT)
  name: string;

  @Column(DataType.TEXT)
  notes: string;

  @Column(DataType.BOOLEAN)
  isJoker: string;

  @CreatedAt
  creationDate: Date;

  @UpdatedAt
  updatedOn: Date;

  @DeletedAt
  deletionDate: Date;

  getResponseJson() {
    const ret = this.toJSON();
    ret.roundOrder = JSON.parse(this.roundOrder);
    if (this.rounds) {
      for (let i = 0; i < this.rounds.length; i++) {
        ret.rounds[i] = this.rounds[i].getResponseJson();
      }
    }
    if (ret.account) {
      ret.account = this.account.getResponseJson();
    }
    return ret as QuizTemplateResponse;
  }
}
