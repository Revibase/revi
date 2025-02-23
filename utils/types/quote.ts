export interface Quote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: { amount: number; feeBps: number } | null;
  priceImpactPct: string;
  routePlan:
    | {
        swapInfo: {
          ammKey: string;
          label: string;
          inputMint: string;
          outputMint: string;
          inAmount: string;
          outAmount: string;
          feeAmount: string;
          feeMint: string;
        };
        percent: number;
      }[]
    | undefined;
  contextSlot: number;
  timeTaken: number;
}
