import {
  FirebaseFirestoreTypes,
  FirestoreError,
  onSnapshot,
} from "@react-native-firebase/firestore";
import { QueryKey, UseQueryOptions } from "@tanstack/react-query";
import { useCallback } from "react";
import { useSubscription } from "./useSubscription";

type NextOrObserver = (
  data: FirebaseFirestoreTypes.DocumentSnapshot | null
) => Promise<void>;
export const useFirestoreDocument = ({
  queryKey,
  ref,
  useQueryOptions,
}: {
  queryKey: QueryKey;
  ref: FirebaseFirestoreTypes.DocumentReference;
  useQueryOptions?: Omit<
    UseQueryOptions<FirebaseFirestoreTypes.DocumentSnapshot, FirestoreError>,
    "queryFn"
  >;
}) => {
  const subscribeFn = useCallback(
    (callback: NextOrObserver) => {
      return onSnapshot(
        ref,
        {
          includeMetadataChanges: false,
        },
        (snapshot: FirebaseFirestoreTypes.DocumentSnapshot) => {
          return callback(snapshot);
        }
      );
    },
    [ref]
  );
  return useSubscription(
    queryKey,
    ["useFirestoreDocument", queryKey],
    subscribeFn,
    {
      queryKey,
      ...useQueryOptions,
      onlyOnce: false,
    }
  );
};
