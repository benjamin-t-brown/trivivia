import { Router } from 'express';
import { registerGet, registerRoute } from '../routing';
import { StaticQuizService } from '../services/StaticQuizService';
import { TemplateService } from '../services/TemplateService';

export const initStaticQuizController = (router: Router) => {
  const staticQuizService = new StaticQuizService();
  const templateService = new TemplateService();

  registerGet(
    router,
    '/api/static/:liveQuizUserFriendlyId',
    async function getStaticQuiz(params: { liveQuizUserFriendlyId: string }) {
      const staticQuiz = await staticQuizService.getStaticQuiz(
        params.liveQuizUserFriendlyId
      );

      if (!staticQuiz) {
        return undefined;
      }

      return staticQuiz;
    }
  );

  // same as route to export as html, but not downloadable.  Simply render the html to the client.
  // Checks first if this template allows static rendering.
  registerRoute(
    router,
    'get',
    '/api/static/render-html/template/:quizTemplateId',
    async function renderQuizTemplate(params, _, context) {
      const quizTemplate = await templateService.findQuizById(
        params.quizTemplateId
      );
      if (!quizTemplate) {
        return undefined;
      }
      if (!quizTemplate.allowStaticRender) {
        throw new Error('Quiz template does not allow static rendering.');
      }

      const str = await templateService.exportQuizTemplate({
        quizTemplateId: params.quizTemplateId,
        format: 'html',
      });

      return str;
    },
    true
  );
};
