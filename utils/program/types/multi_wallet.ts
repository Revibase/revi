/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/multi_wallet.json`.
 */
export type MultiWallet = {
  address: "mu1LDWh4VGHhnZHB85s92HNBapj3b9s5DgzTkiAyeKY";
  metadata: {
    name: "multiWallet";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "changeConfig";
      docs: [
        "# Parameters",
        "- `ctx`: The context of the multi-action execution.",
        "- `config_actions`: The list of actions to be executed.",
        "",
        "# Returns",
        "- `Result<()>`: The result of the multi-action execution."
      ];
      discriminator: [24, 158, 114, 115, 94, 210, 244, 233];
      accounts: [
        {
          name: "multiWallet";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  109,
                  117,
                  108,
                  116,
                  105,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116
                ];
              },
              {
                kind: "account";
                path: "multi_wallet.create_key";
                account: "multiWallet";
              }
            ];
          };
        },
        {
          name: "payer";
          writable: true;
          signer: true;
          optional: true;
        },
        {
          name: "systemProgram";
          optional: true;
          address: "11111111111111111111111111111111";
        },
        {
          name: "instructionSysvar";
          address: "Sysvar1nstructions1111111111111111111111111";
        }
      ];
      args: [
        {
          name: "configActions";
          type: {
            vec: {
              defined: {
                name: "configAction";
              };
            };
          };
        }
      ];
    },
    {
      name: "create";
      docs: [
        "Creates a new multi-wallet.",
        "",
        "# Parameters",
        "- `ctx`: The context of the multi-wallet creation.",
        "- `create_key`: The member key used to create the multi-wallet.",
        "- `metadata`: An optional metadata for the multi-wallet.",
        "- `label`: An optional label for the multi-wallet.",
        "",
        "# Returns",
        "- `Result<()>`: The result of the multi-wallet creation."
      ];
      discriminator: [24, 30, 200, 40, 5, 28, 7, 119];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "multiWallet";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  109,
                  117,
                  108,
                  116,
                  105,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116
                ];
              },
              {
                kind: "arg";
                path: "create_key.pubkey";
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "createKey";
          type: {
            defined: {
              name: "member";
            };
          };
        },
        {
          name: "metadata";
          type: {
            option: "pubkey";
          };
        }
      ];
    },
    {
      name: "vaultTransactionExecute";
      docs: [
        "Executes a vault transaction.",
        "",
        "# Parameters",
        "- `ctx`: The context of the vault transaction execution.",
        "- `vault_index`: The index of the vault.",
        "- `transaction_message`: The transaction message to be executed.",
        "",
        "# Returns",
        "- `Result<()>`: The result of the vault transaction execution."
      ];
      discriminator: [194, 8, 161, 87, 153, 164, 25, 171];
      accounts: [
        {
          name: "multiWallet";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  109,
                  117,
                  108,
                  116,
                  105,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116
                ];
              },
              {
                kind: "account";
                path: "multi_wallet.create_key";
                account: "multiWallet";
              }
            ];
          };
        },
        {
          name: "instructionSysvar";
          address: "Sysvar1nstructions1111111111111111111111111";
        }
      ];
      args: [
        {
          name: "vaultIndex";
          type: "u16";
        },
        {
          name: "transactionMessage";
          type: "bytes";
        }
      ];
    }
  ];
  accounts: [
    {
      name: "multiWallet";
      discriminator: [100, 242, 252, 66, 54, 82, 77, 90];
    }
  ];
  errors: [
    {
      code: 6000;
      name: "durableNonceDetected";
      msg: "Durable nonce is not allowed";
    },
    {
      code: 6001;
      name: "duplicateMember";
      msg: "Found multiple members with the same pubkey";
    },
    {
      code: 6002;
      name: "emptyMembers";
      msg: "Members array is empty";
    },
    {
      code: 6003;
      name: "tooManyMembers";
      msg: "Too many members, can be up to 65535";
    },
    {
      code: 6004;
      name: "invalidThreshold";
      msg: "Invalid threshold, must be between 1 and number of members";
    },
    {
      code: 6005;
      name: "thresholdTooHigh";
      msg: "Threshold must be lower than 10";
    },
    {
      code: 6006;
      name: "invalidTransactionMessage";
      msg: "TransactionMessage is malformed.";
    },
    {
      code: 6007;
      name: "notEnoughSigners";
      msg: "Number of signers does not meet the minumum threshold";
    },
    {
      code: 6008;
      name: "invalidNumberOfAccounts";
      msg: "Wrong number of accounts provided";
    },
    {
      code: 6009;
      name: "invalidAccount";
      msg: "Invalid account provided";
    },
    {
      code: 6010;
      name: "missingAccount";
      msg: "Missing account";
    },
    {
      code: 6011;
      name: "illegalAccountOwner";
      msg: "Account is not owned by Multisig program";
    },
    {
      code: 6012;
      name: "protectedAccount";
      msg: "Account is protected, it cannot be passed into a CPI as writable";
    }
  ];
  types: [
    {
      name: "configAction";
      type: {
        kind: "enum";
        variants: [
          {
            name: "addMembers";
            fields: [
              {
                vec: {
                  defined: {
                    name: "member";
                  };
                };
              }
            ];
          },
          {
            name: "removeMembers";
            fields: [
              {
                vec: "pubkey";
              }
            ];
          },
          {
            name: "setThreshold";
            fields: ["u8"];
          },
          {
            name: "setMetadata";
            fields: [
              {
                option: "pubkey";
              }
            ];
          }
        ];
      };
    },
    {
      name: "member";
      type: {
        kind: "struct";
        fields: [
          {
            name: "pubkey";
            type: "pubkey";
          },
          {
            name: "label";
            type: {
              option: "u8";
            };
          }
        ];
      };
    },
    {
      name: "multiWallet";
      type: {
        kind: "struct";
        fields: [
          {
            name: "createKey";
            type: "pubkey";
          },
          {
            name: "threshold";
            type: "u8";
          },
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "members";
            type: {
              vec: {
                defined: {
                  name: "member";
                };
              };
            };
          },
          {
            name: "metadata";
            type: {
              option: "pubkey";
            };
          }
        ];
      };
    }
  ];
};
