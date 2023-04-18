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
import {
  AnswerBoxType,
  AnswerState,
  QuestionTemplateResponse,
} from 'shared/responses';
import { RoundTemplate } from './RoundTemplate';

@Table({
  timestamps: true,
})
export class QuestionTemplate extends Model {
  @Column({ type: DataType.UUIDV4, primaryKey: true })
  id: string;

  @BelongsTo(() => RoundTemplate, {
    foreignKey: 'roundTemplateId',
  })
  roundTemplate: RoundTemplate;

  @Column(DataType.TEXT)
  text: string;

  @Column(DataType.TEXT)
  answers: string;

  @Column({ type: DataType.STRING })
  answerType: AnswerBoxType;

  @Column(DataType.TEXT)
  imageLink: string;

  @Column(DataType.BOOLEAN)
  orderMatters: boolean;

  @Column(DataType.BOOLEAN)
  isBonus: boolean;

  @Column(DataType.TEXT)
  notes: string;

  @CreatedAt
  creationDate: Date;

  @UpdatedAt
  updatedOn: Date;

  @DeletedAt
  deletionDate: Date;

  getResponseJson() {
    const ret = this.toJSON();
    if (this.roundTemplate) {
      ret.roundTemplate = this.roundTemplate.getResponseJson();
    }
    if (this.answers) {
      ret.answers = JSON.parse(ret.answers);
    }
    return ret as QuestionTemplateResponse;
  }
}
