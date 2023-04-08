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
import { ListQuestionTemplatesRoute } from 'routes/ListQuestionTemplates';
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
} from 'routes/LiveQuizAdmin';
import { JoinQuizRoute, JoinRoute } from 'routes/Join';
import { LiveQuizRoute, LiveQuizUpdateRoute } from 'routes/LiveQuiz';
import { LiveQuizAdminGradingRoute } from 'routes/LiveQuizAdminGrading';

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
        ListQuizTemplatesRoute,
        ListRoundTemplatesRoute,
        ListQuestionTemplatesRoute,
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
        LiveQuizAdminGradingRoute,
        JoinRoute,
        JoinQuizRoute,
        LiveQuizRoute,
        LiveQuizUpdateRoute,
      ],
    },
  ]);

  const App = () => {
    const reRender = useReRender();

    useEffect(() => {
      let debounceResizeId: any;
      window.addEventListener('resize', () => {
        if (debounceResizeId !== false) {
          clearTimeout(debounceResizeId);
          debounceResizeId = false;
        }
        debounceResizeId = setTimeout(() => {
          reRender();
          debounceResizeId = false;
        }, 50);
      });
    }, []);

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
  document.body.style.background = getColors().BACKGROUND;

  const root = createRoot(div);
  root.render(<App />);
};
