import { getVaultFromAddress } from "@revibase/multi-wallet";
import { checkIfTokenAccountExist, DAS } from "@revibase/token-transfer";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  AddressLookupTableAccount,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { useConnection } from "components/providers/connectionProvider";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import {
  FEE_ACCOUNT,
  getSignerTypeFromWalletType,
  logError,
  Page,
  Quote,
  SignerState,
  useGlobalStore,
  WalletType,
} from "utils";
import { useWalletInfo } from "./useWalletInfo";
type PayloadInstructions = {
  data: string;
  programId: string;
  accounts: {
    pubkey: string;
    isSigner: boolean;
    isWritable: boolean;
  }[];
};

export const useSwap = () => {
  const {
    setPage,
    walletSheetArgs,
    setTransactionSheetArgs,
    paymasterWalletPublicKey,
    setWalletSheetArgs,
  } = useGlobalStore();
  const { walletAddress, type, theme, swapAsset } = walletSheetArgs ?? {};
  const { connection } = useConnection();
  const { walletInfo } = useWalletInfo({ type, walletAddress });
  const [quote, setQuote] = useState<Quote | undefined>();
  const [isLoading, setIsloading] = useState(false);
  const getQuote = async (
    mode: "ExactIn" | "ExactOut",
    value: string,
    inputAsset: DAS.GetAssetResponse,
    outputAsset: DAS.GetAssetResponse,
    signal?: AbortSignal
  ) => {
    try {
      const numericValue = parseFloat(value);
      if (isNaN(numericValue) || numericValue <= 0) {
        throw new Error("Invalid value: must be a positive number");
      }

      const inputDecimals = inputAsset.token_info?.decimals ?? 0;
      const outputDecimals = outputAsset.token_info?.decimals ?? 0;

      const amount = Math.round(
        numericValue *
          10 ** (mode === "ExactIn" ? inputDecimals : outputDecimals)
      );

      const url = `https://api.jup.ag/swap/v1/quote?inputMint=${inputAsset.id}&outputMint=${outputAsset.id}&amount=${amount}&restrictIntermediateTokens=true&swapMode=${mode}&dynamicSlippage=true&platformFeeBps=75&maxAccounts=60`;

      const response = await fetch(url, { signal });
      if (!response.ok) {
        throw new Error(`Failed to fetch quote: ${response.statusText}`);
      }

      const quoteResponse = (await response.json()) as Quote | undefined;
      if (!quoteResponse?.outAmount || !quoteResponse.inAmount) {
        throw new Error(`Failed to fetch quote.`);
      }

      const outAmount = parseFloat(quoteResponse.outAmount);
      const inAmount = parseFloat(quoteResponse.inAmount);
      const result =
        mode === "ExactIn"
          ? !isNaN(outAmount)
            ? (outAmount / 10 ** outputDecimals).toString()
            : ""
          : !isNaN(inAmount)
          ? (inAmount / 10 ** inputDecimals).toString()
          : "";
      if (result) {
        setQuote(quoteResponse);
      } else {
        setQuote(undefined);
      }

      return result;
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request aborted due to a new fetch");
      } else {
        setQuote(undefined);
        logError(error);
      }
      return "";
    }
  };

  const confirmSwap = useCallback(async () => {
    try {
      setIsloading(true);
      if (!walletAddress || !quote || !type || !swapAsset) {
        throw new Error("No quote found.");
      }

      if (swapAsset.id !== quote.outputMint) {
        throw new Error("Incorrect mint");
      }

      const userPublicKey =
        type === WalletType.MULTIWALLET
          ? getVaultFromAddress(new PublicKey(walletAddress))
          : new PublicKey(walletAddress);

      const mint = new PublicKey(swapAsset.id);
      const tokenProgram = swapAsset.token_info?.token_program
        ? new PublicKey(swapAsset.token_info?.token_program)
        : TOKEN_PROGRAM_ID;

      const destinationTokenAccount = getAssociatedTokenAddressSync(
        mint,
        userPublicKey,
        true,
        tokenProgram
      );

      const feeAccount = new PublicKey(FEE_ACCOUNT);
      const feeTokenAccount = getAssociatedTokenAddressSync(
        mint,
        feeAccount,
        false,
        tokenProgram
      );

      // Fetch swap instructions
      const response = await fetch(
        "https://api.jup.ag/swap/v1/swap-instructions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destinationTokenAccount: destinationTokenAccount.toString(),
            quoteResponse: quote,
            userPublicKey: userPublicKey.toString(),
            feeAccount: feeTokenAccount.toString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch swap instructions: ${response.statusText}`
        );
      }

      const instructions = await response.json();
      if (!instructions || instructions.error) {
        throw new Error(`Swap instructions error: ${instructions.error}`);
      }

      const {
        setupInstructions,
        swapInstruction,
        cleanupInstruction,
        addressLookupTableAddresses,
      }: {
        setupInstructions: PayloadInstructions[];
        swapInstruction: PayloadInstructions;
        cleanupInstruction: PayloadInstructions;
        addressLookupTableAddresses: string[];
      } = instructions;

      // Helper function to deserialize instructions
      const deserializeInstruction = (
        instruction:
          | {
              data: string;
              programId: string;
              accounts: {
                pubkey: string;
                isSigner: boolean;
                isWritable: boolean;
              }[];
            }
          | undefined
      ) =>
        instruction
          ? new TransactionInstruction({
              programId: new PublicKey(instruction.programId),
              keys: instruction.accounts.map((key) => ({
                pubkey: new PublicKey(key.pubkey),
                isSigner: key.isSigner,
                isWritable: key.isWritable,
              })),
              data: Buffer.from(instruction.data, "base64"),
            })
          : null;

      // Fetch Address Lookup Table Accounts
      const getAddressLookupTableAccounts = async (keys: string[]) => {
        const infos = await connection.getMultipleAccountsInfo(
          keys.map((key) => new PublicKey(key))
        );
        return infos.reduce((acc, accountInfo, index) => {
          if (accountInfo) {
            acc.push(
              new AddressLookupTableAccount({
                key: new PublicKey(keys[index]),
                state: AddressLookupTableAccount.deserialize(accountInfo.data),
              })
            );
          }
          return acc;
        }, [] as AddressLookupTableAccount[]);
      };

      const addressLookupTableAccounts = await getAddressLookupTableAccounts(
        addressLookupTableAddresses
      );

      const prepareAccountInstructions = async (payer: string) => {
        return [
          ...(await checkIfTokenAccountExist(
            connection,
            new PublicKey(payer),
            feeTokenAccount,
            feeAccount,
            mint,
            tokenProgram
          )),
          ...(await checkIfTokenAccountExist(
            connection,
            new PublicKey(payer),
            destinationTokenAccount,
            userPublicKey,
            mint,
            tokenProgram
          )),
        ];
      };

      if (type === WalletType.MULTIWALLET) {
        if (!paymasterWalletPublicKey) {
          setWalletSheetArgs(null);
          router.replace("/(tabs)/profile");
          throw new Error("You need to complete your wallet setup first.");
        }

        if (walletInfo) {
          setTransactionSheetArgs({
            callback: (signature) => signature && setPage(Page.Main),
            ixs: [
              ...(await prepareAccountInstructions(paymasterWalletPublicKey)),
              ...setupInstructions.map(deserializeInstruction),
              deserializeInstruction(swapInstruction),
              deserializeInstruction(cleanupInstruction),
            ].filter((x) => x !== null),
            lookUpTables: addressLookupTableAccounts,
            walletInfo,
            walletAddress,
            feePayer: paymasterWalletPublicKey,
            theme,
          });
        }
      } else {
        setTransactionSheetArgs({
          callback: (signature) => signature && setPage(Page.Main),
          ixs: [
            ...(await prepareAccountInstructions(walletAddress)),
            ...setupInstructions.map(deserializeInstruction),
            deserializeInstruction(swapInstruction),
            deserializeInstruction(cleanupInstruction),
          ].filter((x) => x !== null),
          lookUpTables: addressLookupTableAccounts,
          signers: [
            {
              key: walletAddress,
              state: SignerState.Unsigned,
              type: getSignerTypeFromWalletType(type),
            },
          ],
          walletAddress,
          feePayer: walletAddress,
          theme,
        });
      }
    } catch (error) {
      logError(error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      setIsloading(false);
    }
  }, [
    connection,
    swapAsset,
    theme,
    quote,
    type,
    walletAddress,
    walletInfo,
    paymasterWalletPublicKey,
  ]);

  return { getQuote, quote, setQuote, confirmSwap, isLoading };
};
