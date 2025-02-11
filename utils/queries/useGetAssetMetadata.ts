import { useQuery } from "@tanstack/react-query";

export function useGetAssetMetadata({
  url,
}: {
  url: string | undefined | null;
}) {
  return useQuery({
    queryKey: ["get-asset-metadata", { url }],
    queryFn: async () => {
      if (!url) return null;
      const result = await (await fetch(url)).json();
      return result;
    },
    enabled: !!url,
  });
}
