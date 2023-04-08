import React, { useCallback, useEffect, useState } from 'react';
import DialogBox from 'elements/DialogBox';
import {
  unstable_useBlocker,
  useLoaderData,
  useRouteError,
  useNavigate,
} from 'react-router-dom';
import { FormError } from 'components/FormErrorText';

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

export const useFormPristine = (
  formId: string,
  initialValues: Record<string, any>
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
      if (value !== initialValues[key]) {
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
        <div>Are you sure you wish to navigate away? Changes will be lost.</div>
      );
    },
    onConfirm: () => {
      setConfirmedNavigation(true);
      setTimeout(() => {
        navigate(nextLocation);
      }, 1);
    },
  });

  unstable_useBlocker(({ nextLocation, historyAction }) => {
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

export const useDnDListHandlers = (args: {
  itemHeight: number;
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
    ev.stopPropagation();

    const elem = document.getElementById(id);
    if (elem) {
      const clientY = getClientYFromClickBasedEvent(ev);
      elem.style.transform = `translateY(${-50}px)`;

      setDragState({
        id,
        dragging: true,
        clientY,
        elem,
      });
    }
  };

  React.useEffect(() => {
    const handleDragMove = (ev: MouseEvent | TouchEvent) => {
      if (dragState.dragging && dragState.elem) {
        ev.stopPropagation();
        const newClientY = getClientYFromClickBasedEvent(ev);
        dragState.elem.style.transform = `translateY(${
          newClientY - dragState.clientY - 50
        }px)`;
      }
    };

    const handleDragEnd = (ev: MouseEvent | TouchEvent) => {
      if (dragState.dragging && dragState.elem) {
        ev.stopPropagation();
        ev.preventDefault();

        let offset = Math.floor(
          (parseInt(dragState.elem.style.transform.slice(11)) +
            args.itemHeight) /
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
          dragging: false,
          clientY: 0,
          elem: undefined,
        });
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
  }, [dragState]);

  return {
    dragWasEdited: wasEdited,
    dragState,
    handleDragStart,
    resetDragState: () => {
      setWasEdited(false);
    },
  };
};
