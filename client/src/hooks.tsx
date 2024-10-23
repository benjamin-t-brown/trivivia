import React, { useCallback, useEffect, useState } from 'react';
import DialogBox from 'elements/DialogBox';
import {
  useBlocker,
  useLoaderData,
  useRouteError,
  useNavigate,
  useParams,
  FetcherWithComponents,
} from 'react-router-dom';
import { FormError } from 'components/FormErrorText';
import { getLiveQuizSpectateId, getLiveQuizTeamId } from 'utils';
import { updateCacheLiveQuiz } from 'cache';

export const useReRender = () => {
  const [, updateState] = useState();
  const handleForceUpdateMethod = useCallback(() => updateState({} as any), []);
  return handleForceUpdateMethod;
};

export interface DialogBoxHookProps {
  body: React.FC;
  title?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const useConfirmDialog = (props: DialogBoxHookProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const element = (
    <DialogBox
      {...props}
      onConfirm={() => {
        if (props.onConfirm) {
          props.onConfirm();
        }
        setDialogOpen(false);
      }}
      onCancel={() => {
        if (props.onCancel) {
          props.onCancel();
        }
        setDialogOpen(false);
      }}
      open={dialogOpen}
      type="confirm"
    />
  );

  return {
    confirmDialog: element,
    setOpen: setDialogOpen,
    open: dialogOpen,
  };
};

export const useInfoDialog = (props: DialogBoxHookProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const element = (
    <DialogBox
      {...props}
      open={dialogOpen}
      onConfirm={() => {
        if (props.onConfirm) {
          props.onConfirm();
        }
        setDialogOpen(false);
      }}
      type="info"
    />
  );

  return {
    infoDialog: element,
    setOpen: setDialogOpen,
    open: dialogOpen,
  };
};

export function useTypedLoaderData<T>(args: {
  isError?: boolean;
  cache?: T;
}): T | undefined {
  return args.isError ? args.cache : (useLoaderData() as T);
}

export const throwValidationError = (message: string, values: any) => {
  throw {
    status: 400,
    message,
    values,
  } as FormError;
};

// This hook replaces the given form's values with the values in a route error
// if they exist
export const useFormResetValues = (formId: string) => {
  const routeError = useRouteError() as FormError;

  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (form && routeError?.values) {
      for (const name in routeError.values) {
        if (form.elements[name]) {
          form.elements[name].value = routeError.values[name];
        }
      }
    }
  }, [formId, routeError]);
};

// returns true if the form with the given id is pristine (hasn't been edited)
export const useFormPristine = (
  formId: string,
  initialValues: Record<string, any>,
  ignoreKeys?: string[]
) => {
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (form) {
      for (const i in initialValues) {
        form.elements[i].value = initialValues[i];
      }
    }
  }, []);

  const form = document.getElementById(formId) as HTMLFormElement | null;
  if (form) {
    for (const [key, value] of (new FormData(form) as any).entries()) {
      if (ignoreKeys && ignoreKeys.includes(key)) {
        continue;
      }
      let v1 = value;
      let v2 = initialValues[key];
      if (v1 === 'true') {
        v1 = true;
      }
      if (v1 === 'false') {
        v1 = false;
      }
      if (v2 === 'true') {
        v2 = true;
      }
      if (v2 === 'false') {
        v2 = false;
      }
      const v1Num = parseFloat(v1);
      if (!isNaN(v1Num)) {
        v1 = v1Num;
      }
      const v2Num = parseFloat(v2);
      if (!isNaN(v2Num)) {
        v2 = v2Num;
      }
      if (v1 !== v2) {
        return false;
      }
    }
    return true;
  } else {
    return true;
  }
};

export const useConfirmNav = (enabled: boolean) => {
  const [confirmedNavigation, setConfirmedNavigation] = useState(false);
  const navigate = useNavigate();
  const [nextLocation, setNextLocation] = useState('');

  const { setOpen, open, confirmDialog } = useConfirmDialog({
    title: 'Confirm Navigation',
    body: () => {
      return (
        <p>
          Are you sure you wish to navigate away? <br /> <br /> Changes will be
          lost.
        </p>
      );
    },
    onConfirm: () => {
      setConfirmedNavigation(true);
      setTimeout(() => {
        navigate(nextLocation);
      }, 1);
    },
  });

  useBlocker(({ nextLocation, historyAction }) => {
    if (historyAction === 'REPLACE') {
      return false;
    }

    if (confirmedNavigation) {
      setConfirmedNavigation(false);
      return false;
    }

    if (enabled && !open) {
      setOpen(true);
      setNextLocation(nextLocation.pathname);
      return true;
    }

    return false;
  });

  return confirmDialog;
};

export interface DragState {
  id: string;
  dragging: boolean;
  clientY: number;
  elem?: HTMLElement;
}

const getClientYFromClickBasedEvent = (ev: MouseEvent | TouchEvent) => {
  let clientY = 0;
  if ((ev as TouchEvent).touches) {
    const touch = (ev as TouchEvent).touches[0];
    clientY = touch.clientY;
  } else {
    clientY = (ev as MouseEvent).clientY;
  }
  return clientY;
};

// This hook handles the drag and drop logic for a list of items with a fixed itemHeight
export const useDnDListHandlers = (args: {
  itemHeight: number;
  clickOffset: number;
  arr: string[];
  setArr: (arr: string[]) => void;
}) => {
  const [dragState, setDragState] = React.useState<DragState>({
    id: '',
    dragging: false,
    clientY: 0,
  });
  const [wasEdited, setWasEdited] = React.useState(false);

  const handleDragStart = (id: string) => (ev: MouseEvent | TouchEvent) => {
    const elem = document.getElementById(id);
    if (ev.type === 'mousedown') {
      ev.preventDefault();
    }
    if (elem) {
      const clientY = getClientYFromClickBasedEvent(ev);
      elem.style.transform = `translateY(${-args.clickOffset}px)`;

      setDragState({
        id,
        dragging: true,
        clientY,
        elem,
      });

      const root = document.getElementById('content-root');
      if (root) {
        root.style.overflow = 'hidden';
      }
    }
  };

  React.useEffect(() => {
    const handleDragMove = (ev: MouseEvent | TouchEvent) => {
      if (dragState.dragging && dragState.elem) {
        const newClientY = getClientYFromClickBasedEvent(ev);
        dragState.elem.style.transform = `translateY(${
          newClientY - dragState.clientY - args.clickOffset
        }px)`;
      }
    };

    const handleDragEnd = (ev: MouseEvent | TouchEvent) => {
      if (dragState.dragging && dragState.elem) {
        const root = document.getElementById('content-root');
        if (root) {
          root.style.overflow = 'auto';
        }

        let offset = Math.floor(
          (parseInt(dragState.elem.style.transform.slice(11)) +
            args.itemHeight -
            (args.clickOffset > 0 ? 0 : 50)) /
            args.itemHeight
        );
        if (offset < 0) {
          offset++;
        }

        const reorder = (arr: string[], ind: number, offset: number) => {
          arr = [...arr];
          const swapIfPossible = (arr: string[], i1: number, i2: number) => {
            if (arr[i1] === undefined || arr[i2] === undefined) {
              return;
            }

            const tmp = arr[i2];
            arr[i2] = arr[i1];
            arr[i1] = tmp;
          };

          if (offset > 0) {
            for (let i = ind; i < ind + offset; i++) {
              swapIfPossible(arr, i, i + 1);
            }
          } else {
            for (let i = ind; i > ind + offset; i--) {
              swapIfPossible(arr, i, i - 1);
            }
          }
          return arr;
        };
        const newArr = reorder(
          args.arr,
          args.arr.indexOf(dragState.id),
          offset
        );
        args.setArr(newArr);

        setWasEdited(true);

        dragState.elem.style.transform = 'unset';
        setDragState({
          id: '',
          dragging: true,
          clientY: 0,
          elem: undefined,
        });
        setTimeout(() => {
          setDragState({
            id: '',
            dragging: false,
            clientY: 0,
            elem: undefined,
          });
        }, 100);
      }
    };

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('touchmove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchend', handleDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
    };
  });

  return {
    dragWasEdited: wasEdited,
    dragState,
    handleDragStart,
    resetDragState: () => {
      setWasEdited(false);
    },
  };
};

let socket;
let pingInterval;
let pingSent = false;

export const useSocketIoRefreshState = (
  fetcher: FetcherWithComponents<any>
) => {
  const [connected, setConnected] = React.useState(false);
  const [joined, setJoined] = React.useState(false);
  const [requireReconnected, setRequireReconnected] = React.useState(false);
  const params = useParams();
  const sendJoinRequest = (args: {
    teamId: string;
    gameId: string;
    spectateTeamId: string;
  }) => {
    console.log('emit join request', args);
    socket.emit('join', JSON.stringify(args));
  };

  function emitPing() {
    if (!socket) {
      if (pingInterval !== undefined) {
        clearInterval(pingInterval);
        pingInterval = undefined;
      }
      return;
    }

    if (pingSent) {
      console.log('DISCONNECTED!');
      socket.disconnect();
      setConnected(false);
      setJoined(false);
      clearInterval(pingInterval);
      setRequireReconnected(true);
      pingInterval = undefined;
      return;
    }

    // console.log('send ping');
    socket.emit('ping-alive');
    pingSent = true;
  }

  React.useEffect(() => {
    if (!socket) {
      const io = (window as any).io;
      socket = io();
      socket.on('hello', () => {
        console.log('server says hello');
        setConnected(true);
        setJoined(false);
        if (pingInterval !== undefined) {
          clearInterval(pingInterval);
        }
        pingInterval = setInterval(emitPing, 5000);
      });
      socket.on('disconnect', () => {
        socket = undefined;
        setJoined(false);
        setConnected(false);
        setRequireReconnected(true);
      });
      socket.on('state', () => {
        console.log('received refresh request from server');
        updateCacheLiveQuiz(params.userFriendlyQuizId ?? '');
        fetcher.load(`/live/${params.userFriendlyQuizId}`);
      });
      socket.on('joined', () => {
        console.log('joined');
        setJoined(true);
      });
      socket.on('error', () => {
        setConnected(false);
        setJoined(false);
      });
      socket.on('connect_error', () => {
        setConnected(false);
        setJoined(false);
      });
      socket.on('ping-alive', () => {
        // console.log('got ping');
        pingSent = false;
      });
    }
  }, []);

  React.useEffect(() => {
    if (socket && connected && !joined) {
      const teamId = getLiveQuizTeamId() ?? '';
      const gameId = params.userFriendlyQuizId;
      const spectateTeamId = getLiveQuizSpectateId() ?? '';

      console.log('check for join', teamId, gameId, spectateTeamId);

      if ((teamId || spectateTeamId) && gameId) {
        sendJoinRequest({
          teamId,
          gameId,
          spectateTeamId,
        });
      }
    }
  }, [connected, joined, params]);

  return {
    connected,
    joined,
    requireReconnected,
  };
};
