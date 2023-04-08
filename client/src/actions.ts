import { getFromCache, removeFromCache, updateCache } from 'cache';

interface BasicFetchResponse {
  error?: boolean;
  status: number;
  message: string;
}

export type LocalErrorResponse = Response | undefined;

export interface FetchResponse<T> extends BasicFetchResponse {
  data: T;
}

export async function fetchAsync<T>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  body?: Object,
  options?: {
    bustCache?: boolean;
    headers?: Record<string, string>;
  }
): Promise<FetchResponse<T>> {
  let ok = false;
  let statusNum = 200;

  const jsonBody = body ? JSON.stringify(body) : undefined;

  const cacheResult = getFromCache<T>(method, url);

  if (cacheResult && !options?.bustCache) {
    console.log('using cache', {
      method,
      url,
      body: jsonBody,
      result: cacheResult,
    });
    return cacheResult;
  }

  const result: FetchResponse<T> = await fetch(url, {
    method,
    body: jsonBody,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })
    .then(r => {
      ok = r.ok;
      statusNum = r.status;
      return r.json();
    })
    .catch(e => {
      console.error('Fetch error', e);
    });

  console.log('fetch', { method, url, body, result });

  if (!ok || !result) {
    removeFromCache(method, url);
    return {
      error: true,
      status: statusNum,
      message: result?.message ?? 'Error',
    } as FetchResponse<T>;
  } else {
    const ret = {
      data: result as any,
      status: statusNum,
      message: '',
    };
    if (method === 'get') {
      updateCache(method, url, ret);
    }
    return ret;
  }
}

type LocalActionFunction<T> = (
  body: T,
  params: Record<string, string>
) => Promise<null | Object>;
export function createAction<T>(cb: LocalActionFunction<T>) {
  return async ({ request, params }) => {
    const formData = await request.formData();
    const body = Object.fromEntries(formData);
    return (await cb(body as T, params)) ?? null;
  };
}
