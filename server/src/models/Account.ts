import {
  Table,
  Column,
  Model,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  DataType,
  HasMany,
} from 'sequelize-typescript';
import { AccountResponse } from 'shared/responses';
import { LiveQuiz } from './LiveQuiz';
import { QuizTemplate } from './QuizTemplate';

@Table({
  timestamps: true,
})
export class Account extends Model {
  @Column({ type: DataType.UUIDV4, primaryKey: true })
  id: string;

  @HasMany(() => QuizTemplate, {
    onDelete: 'cascade',
    hooks: true,
    foreignKey: 'accountId',
  })
  quizTemplates: QuizTemplate[];

  @HasMany(() => LiveQuiz, {
    onDelete: 'cascade',
    hooks: true,
    foreignKey: 'accountId',
  })
  liveQuizzes: LiveQuiz[];

  @Column(DataType.STRING)
  email: string;

  @Column(DataType.STRING)
  password: string;

  @CreatedAt
  creationDate: Date;

  @UpdatedAt
  updatedOn: Date;

  @DeletedAt
  deletionDate: Date;

  getResponseJson() {
    const ret = this.toJSON();
    delete ret.password;

    this.quizTemplates?.forEach((t, i) => {
      ret.quizTemplates[i] = t.getResponseJson();
    });

    this.liveQuizzes?.forEach((t, i) => {
      ret.liveQuizzes[i] = t.getResponseJson();
    });

    return ret as AccountResponse;
  }
}
