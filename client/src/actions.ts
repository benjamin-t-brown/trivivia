import { getCacheKey, getFromCache, removeFromCache, updateCache } from 'cache';

interface BasicFetchResponse {
  error?: boolean;
  status: number;
  message: string;
}

export type LocalErrorResponse = Response | undefined;

export interface FetchResponse<T> extends BasicFetchResponse {
  data: T;
}

const activeFetches: string[] = [];
let activeFetchAwaits: {
  cacheKey: string;
  resolve: any;
}[] = [];

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
  // const cacheResult = undefined;

  if (cacheResult && !options?.bustCache) {
    console.log('using cache', {
      method,
      url,
      body: jsonBody,
      result: cacheResult,
    });
    const ret = {
      data: cacheResult.data as any,
      status: statusNum,
      message: '',
    };
    return ret;
  }

  // activeFetches combine requests to the same url+method if there is already one in progress
  const activeFetchKey = getCacheKey(method, url);
  if (activeFetches.includes(activeFetchKey)) {
    console.log('combining active fetch');
    return new Promise(resolve => {
      activeFetchAwaits.push({
        cacheKey: activeFetchKey,
        resolve,
      });
    });
  }
  // console.time('fetch2');
  const promise = fetch(url, {
    method,
    body: jsonBody,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })
    .then(r => {
      // console.timeEnd('fetch2');
      // console.log('got fetch');
      ok = r.ok;
      statusNum = r.status;
      return r.json();
    })
    .catch(e => {
      console.error('Fetch error', e);
    });

  activeFetches.push(activeFetchKey);

  console.time('fetch');
  const result: FetchResponse<T> = await promise;

  activeFetches.splice(activeFetches.indexOf(activeFetchKey), 1);

  console.log('fetch', {
    method,
    url,
    body,
    result,
    bustCache: !!options?.bustCache,
  });
  console.timeEnd('fetch');

  let finalResult: FetchResponse<T>;
  if (!ok || !result) {
    removeFromCache(method, url);
    finalResult = {
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
    finalResult = ret;
  }

  activeFetchAwaits
    .filter(af => af.cacheKey === activeFetchKey)
    .forEach(af => {
      // resolve next tick
      setTimeout(() => {
        af.resolve(finalResult);
      }, 1);
    });
  activeFetchAwaits = activeFetchAwaits.filter(
    af => af.cacheKey !== activeFetchKey
  );

  return finalResult;
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
