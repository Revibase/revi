import {
  QueryFunction,
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
  hashKey,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Unsubscribe as AuthUnsubscribe } from "firebase/auth";
import type { Unsubscribe as DatabaseUnsubscribe } from "firebase/database";
import type { Unsubscribe as FirestoreUnsubscribe } from "firebase/firestore";

type Unsubscribe = AuthUnsubscribe | FirestoreUnsubscribe | DatabaseUnsubscribe;

const firestoreUnsubscribes: Record<string, any> = {};
const queryCacheSubscribes: Record<
  string,
  { result: Promise<any>; unsubscribe: () => void }
> = {};
const eventCount: Record<string, number> = {};

interface CancellablePromise<T = void> extends Promise<T> {
  cancel?: () => void;
}

type UseSubscriptionOptions<TData, TError, R> = UseQueryOptions<
  TData,
  TError,
  R
> & {
  onlyOnce?: boolean;
  fetchFn?: () => Promise<TData | null>;
};

function firestoreUnsubscribe(subscriptionHash: string) {
  const firestoreUnsubscribe = firestoreUnsubscribes[subscriptionHash];
  if (firestoreUnsubscribe && typeof firestoreUnsubscribe === "function") {
    firestoreUnsubscribe();
  }
  delete firestoreUnsubscribes[subscriptionHash];
  delete eventCount[subscriptionHash];
}

function queryCacheUnsubscribe(subscriptionHash: string) {
  const queryCacheUnsubscribe = queryCacheSubscribes[subscriptionHash];
  if (queryCacheUnsubscribe) {
    queryCacheUnsubscribe.unsubscribe();
    delete queryCacheSubscribes[subscriptionHash];
  }
}

/**
 * Utility hook to subscribe to events, given a function that returns an observer callback.
 * @param queryKey The react-query queryKey
 * @param subscriptionKey A hashable key to store the subscription
 * @param subscribeFn Returns an unsubscribe function to the event
 * @param options
 * @returns
 */
export function useSubscription<TData, TError, R = TData>(
  queryKey: QueryKey,
  subscriptionKey: QueryKey,
  subscribeFn: (cb: (data: TData | null) => Promise<void>) => Unsubscribe,
  options?: UseSubscriptionOptions<TData, TError, R>
): UseQueryResult<R, TError> {
  const hashFn = options?.queryKeyHashFn || hashKey;
  const subscriptionHash = hashFn(subscriptionKey);
  const queryClient = useQueryClient();

  let resolvePromise: (data: TData | null) => void = () => null;
  let rejectPromise: (err: any) => void = () => null;

  let result: CancellablePromise<TData | null> = new Promise<TData | null>(
    (resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    }
  );
  result.cancel = () => {
    queryClient.invalidateQueries({ queryKey });
  };
  const enabled = options?.enabled;

  if (options?.onlyOnce) {
    if (!options.fetchFn) {
      throw new Error("You must specify fetchFn if using onlyOnce mode.");
    } else if (enabled) {
      options
        .fetchFn()
        .then(resolvePromise)
        .catch((err) => {
          rejectPromise(err);
        });
    }
  } else if (enabled) {
    const subscribedToQueryCache = !!queryCacheSubscribes[subscriptionHash];
    if (!subscribedToQueryCache) {
      const queryCache = queryClient.getQueryCache();
      const unsubscribe = queryCache.subscribe((event) => {
        if (!event || event.query.queryHash !== hashFn(queryKey)) {
          return;
        }
        const { query, type } = event;
        if (type === "removed") {
          delete eventCount[subscriptionHash];
          queryCacheUnsubscribe(subscriptionHash);
          firestoreUnsubscribe(subscriptionHash);
        }
        if (type === "observerAdded" || type === "observerRemoved") {
          const observersCount = query.getObserversCount();
          if (observersCount === 0) {
            firestoreUnsubscribe(subscriptionHash);
          } else {
            const isSubscribedToFirestore =
              !!firestoreUnsubscribes[subscriptionHash];
            if (isSubscribedToFirestore) {
              const cachedData = queryClient.getQueryData<TData | null>(
                queryKey
              );
              const hasData = !!eventCount[subscriptionHash];

              if (hasData) {
                resolvePromise(cachedData ?? null);
              }
            } else {
              firestoreUnsubscribes[subscriptionHash] = subscribeFn(
                async (data) => {
                  eventCount[subscriptionHash] ??= 0;
                  eventCount[subscriptionHash]++;
                  if (eventCount[subscriptionHash] === 1) {
                    resolvePromise(data || null);
                  } else {
                    queryClient.setQueryData(queryKey, data);
                  }
                }
              );
            }
          }
        }
      });
      queryCacheSubscribes[subscriptionHash] = { result, unsubscribe };
    } else {
      result = queryCacheSubscribes[subscriptionHash]!.result;
    }
  }

  const queryFn: QueryFunction<TData> = () => {
    return result as Promise<TData>;
  };

  return useQuery<TData, TError, R>({
    ...options,
    queryFn,
    queryKey,
    retry: false,
    staleTime: Infinity,
    refetchInterval: undefined,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
