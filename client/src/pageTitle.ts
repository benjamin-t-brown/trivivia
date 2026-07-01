import { matchPath } from 'react-router-dom';

export const APP_NAME = 'Trivivia';

export function formatPageTitle(page?: string | null): string {
  if (!page) {
    return APP_NAME;
  }
  return `${APP_NAME} - ${page}`;
}

function unwrapData(data: unknown): Record<string, unknown> | undefined {
  if (!data || typeof data !== 'object') {
    return undefined;
  }
  const record = data as Record<string, unknown>;
  if (
    'data' in record &&
    record.data &&
    typeof record.data === 'object' &&
    !Array.isArray(record.data)
  ) {
    return record.data as Record<string, unknown>;
  }
  return record;
}

function getString(data: unknown, ...keys: string[]): string | undefined {
  let current: unknown = unwrapData(data);
  for (const key of keys) {
    if (!current || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' ? current : undefined;
}

function truncateTitle(text: string, max = 48): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) {
    return normalized;
  }
  return normalized.slice(0, max - 1) + '…';
}

type TitleRule = {
  path: string;
  title:
    | string
    | ((
        params: Record<string, string | undefined>,
        data: unknown
      ) => string | undefined);
};

// Most specific paths first.
const TITLE_RULES: TitleRule[] = [
  {
    path: '/quiz-template/:quizTemplateId/round-template/:roundTemplateId/question-template/:questionTemplateId/edit',
    title: (_params, data) => {
      const text = getString(data, 'text');
      return text ? `Edit Question - ${truncateTitle(text)}` : 'Edit Question';
    },
  },
  {
    path: '/quiz-template/:quizTemplateId/round-template/:roundTemplateId/question-template/:questionTemplateId/delete',
    title: 'Delete Question',
  },
  {
    path: '/quiz-template/:quizTemplateId/round-template/:roundTemplateId/question-templates/:questionTemplateId/duplicate',
    title: 'Duplicate Question',
  },
  {
    path: '/quiz-template/:quizTemplateId/round-template/:roundTemplateId/question-template-new',
    title: 'New Question',
  },
  {
    path: '/quiz-template/:quizTemplateId/round-template/:roundTemplateId/question-templates',
    title: (_params, data) => {
      const title = getString(data, 'roundTemplate', 'title');
      return title ? `${title} - Questions` : 'Questions';
    },
  },
  {
    path: '/quiz-template/:quizTemplateId/round-template/:roundTemplateId/edit',
    title: (_params, data) => {
      const title = getString(data, 'title');
      return title ? `Edit Round - ${title}` : 'Edit Round';
    },
  },
  {
    path: '/quiz-template/:quizTemplateId/round-template/:roundTemplateId/delete',
    title: 'Delete Round',
  },
  {
    path: '/quiz-template/:quizTemplateId/round-template-new',
    title: 'New Round',
  },
  {
    path: '/quiz-template/:quizTemplateId/round/all',
    title: 'Pick Round Template',
  },
  {
    path: '/quiz-template/:quizTemplateId/round-templates',
    title: (_params, data) => {
      const name = getString(data, 'quizTemplate', 'name');
      return name ? `${name} - Rounds` : 'Rounds';
    },
  },
  {
    path: '/quiz-template/:quizTemplateId/edit',
    title: (_params, data) => {
      const name = getString(data, 'name');
      return name ? `Edit Quiz - ${name}` : 'Edit Quiz';
    },
  },
  {
    path: '/quiz-template/:quizTemplateId/delete',
    title: 'Delete Quiz',
  },
  {
    path: '/live-quiz-admin/:liveQuizId/delete-team',
    title: (_params, data) => {
      const name = getString(data, 'name');
      return name ? `${name} - Delete Team` : 'Delete Team';
    },
  },
  {
    path: '/live-quiz-admin/:liveQuizId/scores',
    title: (_params, data) => {
      const name = getString(data, 'name');
      return name ? `${name} - Scores` : 'Update Scores';
    },
  },
  {
    path: '/live-quiz-admin/:liveQuizId/grade',
    title: (_params, data) => {
      const name = getString(data, 'name');
      return name ? `${name} - Grading` : 'Grading';
    },
  },
  {
    path: '/live-quiz-admin/:liveQuizId/edit',
    title: (_params, data) => {
      const name = getString(data, 'name');
      return name ? `Edit - ${name}` : 'Edit Live Quiz';
    },
  },
  {
    path: '/live-quiz-admin/:liveQuizId/delete',
    title: 'Delete Live Quiz',
  },
  {
    path: '/live-quiz-admin/:liveQuizId',
    title: (_params, data) => {
      const name = getString(data, 'name');
      return name ? `${name} - Admin` : 'Live Quiz Admin';
    },
  },
  {
    path: '/live/:userFriendlyQuizId/update',
    title: (_params, data) => {
      const name = getString(data, 'quiz', 'name');
      return name ? `${name} - Update Team` : 'Update Team';
    },
  },
  {
    path: '/live/:userFriendlyQuizId',
    title: (_params, data) => {
      const name = getString(data, 'quiz', 'name');
      return name ?? 'Live Quiz';
    },
  },
  {
    path: '/join/:userFriendlyQuizId',
    title: (_params, data) => {
      const name =
        getString(data, 'quiz', 'name') ?? getString(data, 'name');
      return name ? `Join - ${name}` : 'Join Quiz';
    },
  },
  {
    path: '/rejoin/:userFriendlyQuizId/:teamId',
    title: 'Rejoin Quiz',
  },
  {
    path: '/static-quiz/:userFriendlyQuizId',
    title: (_params, data) => {
      const name = getString(data, 'name');
      return name ?? 'Static Quiz';
    },
  },
  {
    path: '/qr/:userFriendlyQuizId/team/:teamId',
    title: 'Team QR Code',
  },
  {
    path: '/qr/:userFriendlyQuizId',
    title: 'QR Code',
  },
  {
    path: '/quiz-template-new',
    title: 'New Quiz',
  },
  {
    path: '/live-quiz-start',
    title: 'Start Live Quiz',
  },
  {
    path: '/live-quizzes',
    title: 'Live Quizzes',
  },
  {
    path: '/quiz-templates',
    title: 'Quiz Templates',
  },
  {
    path: '/account-created',
    title: 'Account Created',
  },
  {
    path: '/signup',
    title: 'Sign Up',
  },
  {
    path: '/login',
    title: 'Login',
  },
  {
    path: '/logout',
    title: 'Logout',
  },
  {
    path: '/landing',
    title: 'Home',
  },
  {
    path: '/admin-settings',
    title: 'Admin Settings',
  },
  {
    path: '/settings',
    title: 'Settings',
  },
  {
    path: '/join',
    title: 'Join Quiz',
  },
];

export function resolvePageTitle(pathname: string, loaderData: unknown): string {
  for (const rule of TITLE_RULES) {
    const match = matchPath(rule.path, pathname);
    if (!match) {
      continue;
    }
    const page =
      typeof rule.title === 'function'
        ? rule.title(match.params, loaderData)
        : rule.title;
    return formatPageTitle(page);
  }
  return formatPageTitle();
}
