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
import { RoundTemplateResponse } from 'shared/responses';
import { QuestionTemplate } from './QuestionTemplate';
import { QuizTemplate } from './QuizTemplate';

@Table({
  timestamps: true,
})
export class RoundTemplate extends Model {
  @Column({ type: DataType.UUIDV4, primaryKey: true })
  id: string;

  @BelongsTo(() => QuizTemplate, {
    foreignKey: 'quizTemplateId',
  })
  quizTemplate: QuizTemplate;

  @HasMany(() => QuestionTemplate, {
    onDelete: 'cascade',
    hooks: true,
    foreignKey: 'roundTemplateId',
  })
  questions: QuestionTemplate[];

  @Column(DataType.TEXT)
  title: string;

  @Column(DataType.TEXT)
  description: string;

  @Column(DataType.TEXT)
  questionOrder: string;

  @CreatedAt
  creationDate: Date;

  @UpdatedAt
  updatedOn: Date;

  @DeletedAt
  deletionDate: Date;

  getResponseJson() {
    const ret = this.toJSON();
    ret.questionOrder = JSON.parse(this.questionOrder);
    if (this.quizTemplate) {
      ret.quizTemplate = this.quizTemplate.getResponseJson();
    }
    if (this.questions) {
      for (let i = 0; i < this.questions.length; i++) {
        ret.questions[i] = this.questions[i].getResponseJson();
      }
    }
    return ret as RoundTemplateResponse;
  }
}
