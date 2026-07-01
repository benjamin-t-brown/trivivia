import { redirect } from 'react-router-dom';
import {
  setLiveQuizJoinedDate,
  setLiveQuizJoinedId,
  setLiveQuizSpectateId,
  setLiveQuizTeamId,
  setNoRedirect,
} from 'utils';

const loader = async ({ params }) => {
  setLiveQuizSpectateId('');
  setLiveQuizTeamId(params.teamId);
  setLiveQuizJoinedId(params.userFriendlyQuizId);
  setLiveQuizJoinedDate(new Date());
  setNoRedirect(true);
  return redirect(`/live/${params.userFriendlyQuizId}`);
};

export const TeamRejoinRoute = {
  path: '/rejoin/:userFriendlyQuizId/:teamId',
  loader,
};
