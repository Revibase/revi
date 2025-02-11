import {
  FirebaseFirestoreTypes,
  FirestoreError,
  onSnapshot,
} from "@react-native-firebase/firestore";
import { QueryKey, UseQueryOptions } from "@tanstack/react-query";
import { useCallback } from "react";
import { useSubscription } from "./useSubscription";

export type NamedQueryPromise =
  () => Promise<FirebaseFirestoreTypes.Query | null>;

export type NamedQuery = FirebaseFirestoreTypes.Query | NamedQueryPromise;

export type QueryType = FirebaseFirestoreTypes.Query | NamedQuery;

function isNamedQuery(query: QueryType): query is NamedQuery {
  return typeof query === "function";
}
async function resolveQuery(
  query: QueryType
): Promise<FirebaseFirestoreTypes.Query> {
  if (isNamedQuery(query)) {
    if (typeof query === "function") {
      // Firebase throws an error if the query doesn't exist.
      const resolved = await query();
      return resolved!;
    }

    return query;
  }

  return query;
}
type NextOrObserver = (
  data: FirebaseFirestoreTypes.QuerySnapshot | null
) => Promise<void>;
export const useFirestoreCollection = ({
  queryKey,
  query,
  useQueryOptions,
}: {
  queryKey: QueryKey;
  query: FirebaseFirestoreTypes.Query;
  useQueryOptions?: Omit<
    UseQueryOptions<FirebaseFirestoreTypes.QuerySnapshot, FirestoreError>,
    "queryFn"
  >;
}) => {
  const subscribeFn = useCallback(
    (callback: NextOrObserver) => {
      let unsubscribe = () => {
        // noop
      };
      resolveQuery(query).then((res) => {
        unsubscribe = onSnapshot(
          res,
          {
            includeMetadataChanges: false,
          },
          (snapshot: FirebaseFirestoreTypes.QuerySnapshot) => {
            return callback(snapshot);
          }
        );
      });
      return unsubscribe;
    },
    [query, queryKey]
  );
  return useSubscription<FirebaseFirestoreTypes.QuerySnapshot, FirestoreError>(
    queryKey,
    ["useFirestoreQuery", queryKey],
    subscribeFn,
    {
      queryKey,
      ...useQueryOptions,
      onlyOnce: false,
    }
  );
};
