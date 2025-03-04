import Typesense from "typesense";
import { TYPESENSE_ENDPOINT } from "utils/consts";

export const typesenseClient = new Typesense.Client({
  nodes: [
    {
      host: TYPESENSE_ENDPOINT,
      port: 443,
      protocol: "https",
    },
  ],
  apiKey: process.env.EXPO_PUBLIC_TYPESENSE_SEARCH_API_KEY as string,
  connectionTimeoutSeconds: 10,
});
