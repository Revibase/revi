import { initMultiWalletProgram } from "@revibase/multi-wallet";
import { Connection, ConnectionConfig } from "@solana/web3.js";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type FC,
  type ReactNode,
} from "react";

export interface ConnectionProviderProps {
  children: ReactNode;
  endpoint: string;
  config?: ConnectionConfig;
}

export const ConnectionProvider: FC<ConnectionProviderProps> = ({
  children,
  endpoint,
  config = { commitment: "confirmed" },
}) => {
  const connection = useMemo(
    () => new Connection(endpoint, config),
    [endpoint, config]
  );

  useEffect(() => {
    initMultiWalletProgram(connection);
  }, [connection]);

  return (
    <ConnectionContext.Provider value={{ connection }}>
      {children}
    </ConnectionContext.Provider>
  );
};

export interface ConnectionContextState {
  connection: Connection;
}

export const ConnectionContext = createContext<ConnectionContextState>(
  {} as ConnectionContextState
);

export function useConnection(): ConnectionContextState {
  return useContext(ConnectionContext);
}
