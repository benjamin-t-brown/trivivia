import pptxgen from 'pptxgenjs';
import { TemplateService } from './TemplateService';
import { QuestionTemplateResponse } from 'shared/responses';

const YOUTUBE_ID_REGEX =
  /(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

function extractYouTubeId(imageLink: string | undefined): string | null {
  if (!imageLink) return null;
  const match = imageLink.match(YOUTUBE_ID_REGEX);
  return match ? match[1] : null;
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
    const quizTemplate = await this.templateService.findQuizById(quizTemplateId);
    if (!quizTemplate) {
      throw new Error('Quiz template not found');
    }

    const pptx = new pptxgen();
    pptx.title = quizTemplate.name;

    // Slide 1: Quiz Title + Waiting for quiz to start
    const titleSlide = pptx.addSlide();
    titleSlide.addText(quizTemplate.name, {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 1.5,
      fontSize: 44,
      bold: true,
      align: 'center',
    });
    titleSlide.addText('Waiting for quiz to start', {
      x: 0.5,
      y: 3,
      w: 9,
      h: 0.75,
      fontSize: 24,
      align: 'center',
    });

    const roundOrder: string[] = JSON.parse(quizTemplate.roundOrder);

    for (let i = 0; i < roundOrder.length; i++) {
      const roundId = roundOrder[i];
      const roundTemplate = await this.templateService.findRoundById(roundId);
      if (!roundTemplate) {
        throw new Error(`Round not found: ${roundId}`);
      }

      // Round title + description slide
      const roundSlide = pptx.addSlide();
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

      // Question slides
      const questionOrder: string[] = JSON.parse(roundTemplate.questionOrder);
      for (let j = 0; j < questionOrder.length; j++) {
        const questionId = questionOrder[j];
        const question = roundTemplate.questions?.find(q => q.id === questionId);
        if (!question) continue;

        const questionResponse = question.getResponseJson();
        this.addQuestionSlide(pptx, j + 1, questionResponse);
      }

      // End Round slide
      const endRoundSlide = pptx.addSlide();
      endRoundSlide.addText(`End Round ${i + 1}`, {
        x: 0.5,
        y: 2.5,
        w: 9,
        h: 1,
        fontSize: 36,
        bold: true,
        align: 'center',
      });
    }

    // Quiz End slide
    const endSlide = pptx.addSlide();
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

    const buffer = (await pptx.write({
      outputType: 'nodebuffer',
    })) as Buffer;
    return buffer;
  }

  private addQuestionSlide(
    pptx: pptxgen,
    questionNumber: number,
    question: QuestionTemplateResponse
  ): void {
    const slide = pptx.addSlide();

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

    // Notes if present
    if (question.notes) {
      slide.addText(`Notes: ${question.notes}`, {
        x: 0.5,
        y: yOffset,
        w: 9,
        h: 1,
        fontSize: 14,
        color: '666666',
        valign: 'top',
      });
    }
  }
}
