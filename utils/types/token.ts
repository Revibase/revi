export interface Token {
  id: string;
  address: string;
  name: string | null;
  symbol: string;
  decimals: number;
  logoURI: string | null;
  tags: string[] | null;
  daily_volume: number | null;
  created_at: string;
  freeze_authority: string | null;
  mint_authority: string | null;
  permanent_delegate: string | null;
  minted_at: string;
  extensions: { coingeckoId: string };
}
