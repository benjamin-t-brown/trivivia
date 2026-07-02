import path from 'path';
import pptxgen from 'pptxgenjs';
import { TemplateService } from './TemplateService';
import { QuestionTemplateResponse, getNumRadioBoxes } from 'shared/responses';

const LOGO_PATH = path.resolve(__dirname, '../../../res/logo.png');
const GRADIENT0_PATH = path.resolve(__dirname, '../../../res/gradient0.jpg');
const GRADIENT1_PATH = path.resolve(__dirname, '../../../res/gradient1.jpg');

const YOUTUBE_ID_REGEX =
  /(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

function extractYouTubeId(imageLink: string | undefined): string | null {
  if (!imageLink) return null;
  const match = imageLink.match(YOUTUBE_ID_REGEX);
  return match ? match[1] : null;
}

function getAnswerDisplayText(question: QuestionTemplateResponse): string {
  const answers = question.answers || {};
  const numRadios = getNumRadioBoxes(question.answerType);
  if (numRadios > 0) {
    return Object.entries(answers)
      .filter(([key]) => key.startsWith('radio'))
      .map(([, value]) => value)
      .filter(Boolean)
      .join(', ');
  }
  return Object.entries(answers)
    .filter(([key]) => key.startsWith('answer'))
    .map(([, value]) => value)
    .filter(Boolean)
    .join(', ');
}

function isLikelyImageUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (!lower.startsWith('http')) return false;
  if (lower.includes('<iframe') || lower.includes('youtube')) return false;
  // Has image extension, or common image hosts
  return (
    /\.(png|jpg|jpeg|gif|webp)(\?|$)/i.test(url) ||
    lower.includes('imgur') ||
    lower.includes('i.imgur')
  );
}

export class PowerPointExportService {
  private templateService = new TemplateService();

  async exportQuizToPowerPoint(quizTemplateId: string): Promise<Buffer> {
    const quizTemplate =
      await this.templateService.findQuizById(quizTemplateId);
    if (!quizTemplate) {
      throw new Error('Quiz template not found');
    }

    const pptx = new pptxgen();
    pptx.title = quizTemplate.name;

    // Slide 1: Quiz Title + Waiting for quiz to start
    const titleSlide = pptx.addSlide();
    titleSlide.background = { path: GRADIENT1_PATH };
    titleSlide.addText(quizTemplate.name, {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 1.5,
      fontSize: 44,
      bold: true,
      align: 'center',
    });
    titleSlide.addText('Waiting for quiz to start!', {
      x: 0.5,
      y: 3,
      w: 9,
      h: 0.75,
      fontSize: 24,
      align: 'center',
    });
    this.addLogoToSlide(titleSlide);

    const roundOrder: string[] = JSON.parse(quizTemplate.roundOrder);

    for (let i = 0; i < roundOrder.length; i++) {
      const roundId = roundOrder[i];
      const roundTemplate = await this.templateService.findRoundById(roundId);
      if (!roundTemplate) {
        throw new Error(`Round not found: ${roundId}`);
      }

      // Round title + description slide
      const roundSlide = pptx.addSlide();
      roundSlide.background = { path: GRADIENT1_PATH };
      roundSlide.addText(`Round ${i + 1}: ${roundTemplate.title}`, {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 1,
        fontSize: 32,
        bold: true,
      });
      roundSlide.addText(roundTemplate.description || '', {
        x: 0.5,
        y: 1.75,
        w: 9,
        h: 2,
        fontSize: 18,
        valign: 'top',
      });
      this.addLogoToSlide(roundSlide);

      // Question slides
      const questionOrder: string[] = JSON.parse(roundTemplate.questionOrder);
      for (let j = 0; j < questionOrder.length; j++) {
        const questionId = questionOrder[j];
        const question = roundTemplate.questions?.find(
          q => q.id === questionId
        );
        if (!question) continue;

        const questionResponse = question.getResponseJson();
        this.addQuestionSlide(
          pptx,
          j + 1,
          questionResponse,
          i + 1,
          roundTemplate.title
        );
      }

      // End Round slide
      const endRoundSlide = pptx.addSlide();
      endRoundSlide.background = { path: GRADIENT1_PATH };
      endRoundSlide.addText(`End Round ${i + 1}`, {
        x: 0.5,
        y: 2.5,
        w: 9,
        h: 1,
        fontSize: 36,
        bold: true,
        align: 'center',
      });
      this.addLogoToSlide(endRoundSlide);

      // Start answers slide
      const startAnswersSlide = pptx.addSlide();
      startAnswersSlide.background = { path: GRADIENT1_PATH };
      startAnswersSlide.addText(`Round ${i + 1} Answers`, {
        x: 0.5,
        y: 2.5,
        w: 9,
        h: 1,
        fontSize: 36,
        bold: true,
        align: 'center',
      });
      this.addLogoToSlide(startAnswersSlide);

      // Answer slides: 2 steps per question (step 1 = question only, step 2 = question + answer)
      for (let j = 0; j < questionOrder.length; j++) {
        const questionId = questionOrder[j];
        const question = roundTemplate.questions?.find(
          q => q.id === questionId
        );
        if (!question) continue;

        const questionResponse = question.getResponseJson();
        const answerText = getAnswerDisplayText(questionResponse);

        // Step 1: Question only (click to advance)
        this.addQuestionSlide(
          pptx,
          j + 1,
          questionResponse,
          i + 1,
          roundTemplate.title
        );

        // Step 2: Question + Answer in bottom middle
        this.addQuestionWithAnswerSlide(
          pptx,
          j + 1,
          questionResponse,
          answerText,
          i + 1,
          roundTemplate.title
        );
      }

      // End round answers slide
      const endAnswersSlide = pptx.addSlide();
      endAnswersSlide.background = { path: GRADIENT1_PATH };
      endAnswersSlide.addText(`End Round ${i + 1} Answers`, {
        x: 0.5,
        y: 2.5,
        w: 9,
        h: 1,
        fontSize: 36,
        bold: true,
        align: 'center',
      });
      this.addLogoToSlide(endAnswersSlide);
    }

    // Quiz End slide
    const endSlide = pptx.addSlide();
    endSlide.background = { path: GRADIENT1_PATH };
    endSlide.addText('Quiz End', {
      x: 0.5,
      y: 2,
      w: 9,
      h: 1.5,
      fontSize: 44,
      bold: true,
      align: 'center',
    });
    endSlide.addText('Thanks for playing!', {
      x: 0.5,
      y: 3.5,
      w: 9,
      h: 0.75,
      fontSize: 24,
      align: 'center',
    });
    this.addLogoToSlide(endSlide);

    const buffer = (await pptx.write({
      outputType: 'nodebuffer',
      compression: true,
    })) as Buffer;
    return buffer;
  }

  private addQuestionSlide(
    pptx: pptxgen,
    questionNumber: number,
    question: QuestionTemplateResponse,
    roundNumber: number,
    roundTitle: string
  ): void {
    const slide = pptx.addSlide();
    slide.background = { path: GRADIENT0_PATH };

    // Question text
    slide.addText(`Question ${questionNumber}: ${question.text}`, {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 1.5,
      fontSize: 24,
      bold: true,
      valign: 'top',
    });

    let yOffset = 2;

    // Image or video
    const imageLink = question.imageLink;
    const youtubeId = extractYouTubeId(imageLink);

    if (youtubeId) {
      slide.addMedia({
        type: 'online',
        link: `https://www.youtube.com/embed/${youtubeId}`,
        x: 1,
        y: yOffset,
        w: 6,
        h: 3.5,
      });
      yOffset += 4;
    } else if (imageLink && isLikelyImageUrl(imageLink)) {
      try {
        slide.addImage({
          path: imageLink,
          x: 1,
          y: yOffset,
          w: 6,
          h: 3.5,
        });
        yOffset += 4;
      } catch {
        // If image fails to load, add as link text
        slide.addText(`[Image: ${imageLink}]`, {
          x: 0.5,
          y: yOffset,
          w: 9,
          h: 0.5,
          fontSize: 12,
          color: '666666',
        });
        yOffset += 0.75;
      }
    } else if (imageLink && imageLink.includes('<iframe')) {
      // Non-YouTube iframe - try to extract URL for display
      const urlMatch = imageLink.match(/src="([^"]+)"/);
      const embedUrl = urlMatch ? urlMatch[1] : imageLink;
      slide.addText(`[Video: ${embedUrl}]`, {
        x: 0.5,
        y: yOffset,
        w: 9,
        h: 0.5,
        fontSize: 12,
        color: '666666',
      });
      yOffset += 0.75;
    }

    slide.addText(`Round ${roundNumber}: ${roundTitle}`, {
      x: 0.5,
      y: '2%',
      w: 9,
      h: 1.5,
      fontSize: 16,
      bold: false,
      valign: 'top',
      color: '666666',
    });

    // Notes go to speaker notes (talking points), not on the slide
    if (question.notes) {
      slide.addNotes(question.notes);
    }
    this.addLogoToSlide(slide);
  }

  private addQuestionWithAnswerSlide(
    pptx: pptxgen,
    questionNumber: number,
    question: QuestionTemplateResponse,
    answerText: string,
    roundNumber: number,
    roundTitle: string
  ): void {
    const slide = pptx.addSlide();
    slide.background = { path: GRADIENT0_PATH };

    // Question text (same as question slide)
    slide.addText(`Question ${questionNumber}: ${question.text}`, {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 1.5,
      fontSize: 24,
      bold: true,
      valign: 'top',
    });

    let yOffset = 2;

    // Image or video
    const imageLink = question.imageLink;
    const youtubeId = extractYouTubeId(imageLink);

    if (youtubeId) {
      slide.addMedia({
        type: 'online',
        link: `https://www.youtube.com/embed/${youtubeId}`,
        x: 1,
        y: yOffset,
        w: 6,
        h: 3.5,
      });
      yOffset += 4;
    } else if (imageLink && isLikelyImageUrl(imageLink)) {
      try {
        slide.addImage({
          path: imageLink,
          x: 1,
          y: yOffset,
          w: 6,
          h: 3.5,
        });
        yOffset += 4;
      } catch {
        slide.addText(`[Image: ${imageLink}]`, {
          x: 0.5,
          y: yOffset,
          w: 9,
          h: 0.5,
          fontSize: 12,
          color: '666666',
        });
        yOffset += 0.75;
      }
    } else if (imageLink && imageLink.includes('<iframe')) {
      const urlMatch = imageLink.match(/src="([^"]+)"/);
      const embedUrl = urlMatch ? urlMatch[1] : imageLink;
      slide.addText(`[Video: ${embedUrl}]`, {
        x: 0.5,
        y: yOffset,
        w: 9,
        h: 0.5,
        fontSize: 12,
        color: '666666',
      });
      yOffset += 0.75;
    }

    const answerHeight = answerText?.length > 100 ? 1.75 : 0.75;
    // Answer in bottom middle (step 2)
    slide.addText(answerText || '(No answer)', {
      x: '10%',
      y: '65%',
      w: 8,
      h: answerHeight,
      fontSize: 28,
      bold: true,
      align: 'center',
      valign: 'middle',
      fill: { color: '43a2ce' },
    });

    slide.addText(`Round ${roundNumber}: ${roundTitle}`, {
      x: 0.5,
      y: '2%',
      w: 9,
      h: 1.5,
      fontSize: 16,
      bold: false,
      valign: 'top',
      color: '666666',
    });

    // Notes to speaker notes
    if (question.notes) {
      slide.addNotes(question.notes);
    }
    this.addLogoToSlide(slide);
  }

  private addLogoToSlide(slide: pptxgen.Slide): void {
    try {
      slide.addImage({
        path: LOGO_PATH,
        x: '93%',
        y: '88%',
        w: 0.4,
        h: 0.4,
        transparency: 50, // 50% transparent
      });
    } catch {
      // Logo may not exist in some environments; skip silently
    }
  }
}
