import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useReRender } from 'hooks';
import { getColors } from 'style';
import { RootRoute } from 'routes/Root';
import ErrorPage from 'components/ErrorPage';
import { LandingRoute } from 'routes/Landing';
import { LoginRoute } from 'routes/Login';
import { SignupRoute } from 'routes/Signup';
import { AccountCreatedRoute } from 'routes/AccountCreated';
import { LogoutRoute } from 'routes/Logout';
import {
  DeleteQuizTemplateRoute,
  EditQuizTemplateRoute,
  NewQuizTemplateRoute,
} from 'routes/EditQuizTemplate';
import { ListQuizTemplatesRoute } from 'routes/ListQuizTemplates';
import { ListRoundTemplatesRoute } from 'routes/ListRoundTemplates';
import {
  DeleteRoundTemplateRoute,
  EditRoundTemplateRoute,
  NewRoundTemplateRoute,
} from 'routes/EditRoundTemplate';
import {
  DuplicateQuestionRoute,
  ListQuestionTemplatesRoute,
} from 'routes/ListQuestionTemplates';
import {
  DeleteQuestionTemplateRoute,
  EditQuestionTemplateRoute,
  NewQuestionTemplateRoute,
} from 'routes/EditQuestionTemplate';
import { LiveQuizStartRoute } from 'routes/LiveQuizStart';
import { ListLiveQuizzesRoute } from 'routes/ListLiveQuizzes';
import { EditLiveQuizRoute, DeleteLiveQuizRoute } from 'routes/EditLiveQuiz';
import {
  LiveQuizAdminRoute,
  LiveQuizAdminDeleteTeamRoute,
  LiveQuizAdminUpdateScoresRoute,
} from 'routes/LiveQuizAdmin';
import { JoinQuizRoute, JoinRoute } from 'routes/Join';
import { LiveQuizRoute, LiveQuizUpdateRoute } from 'routes/LiveQuiz';
import { LiveQuizAdminGradingRoute } from 'routes/LiveQuizAdminGrading';
import { QRCodeRoute } from 'routes/QRCode';
import { SettingsAdminRoute, SettingsRoute } from 'routes/Settings';
import { ListAllRoundTemplatesRoute } from 'routes/ListAllRoundTemplates';
import { StaticQuizRoute } from 'routes/StaticQuiz';

export const init = () => {
  const router = createBrowserRouter([
    {
      path: '/',
      errorElement: <ErrorPage />,
      children: [
        RootRoute,
        LandingRoute,
        LoginRoute,
        SignupRoute,
        AccountCreatedRoute,
        LogoutRoute,
        ListAllRoundTemplatesRoute,
        ListQuizTemplatesRoute,
        ListRoundTemplatesRoute,
        ListQuestionTemplatesRoute,
        DuplicateQuestionRoute,
        EditQuizTemplateRoute,
        NewQuizTemplateRoute,
        DeleteQuizTemplateRoute,
        EditRoundTemplateRoute,
        NewRoundTemplateRoute,
        DeleteRoundTemplateRoute,
        EditQuestionTemplateRoute,
        NewQuestionTemplateRoute,
        DeleteQuestionTemplateRoute,
        ListLiveQuizzesRoute,
        LiveQuizStartRoute,
        EditLiveQuizRoute,
        LiveQuizAdminRoute,
        DeleteLiveQuizRoute,
        LiveQuizAdminDeleteTeamRoute,
        LiveQuizAdminUpdateScoresRoute,
        LiveQuizAdminGradingRoute,
        JoinRoute,
        JoinQuizRoute,
        LiveQuizRoute,
        LiveQuizUpdateRoute,
        QRCodeRoute,
        SettingsRoute,
        SettingsAdminRoute,
        StaticQuizRoute,
        // UpdatePasswordRoute,
      ],
    },
  ]);

  const App = () => {
    return (
      <React.StrictMode>
        <RouterProvider router={router} />
      </React.StrictMode>
    );
  };

  const div = document.createElement('div');
  div.id = 'app';
  document.body.innerHTML = '';
  document.body.appendChild(div);
  document.body.style.background = getColors().BODY_BACKGROUND;

  const root = createRoot(div);
  root.render(<App />);
};
