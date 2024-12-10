/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/multi_wallet.json`.
 */
export type MultiWallet = {
  "address": "mu1LDWh4VGHhnZHB85s92HNBapj3b9s5DgzTkiAyeKY",
  "metadata": {
    "name": "multiWallet",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "changeConfig",
      "discriminator": [
        24,
        158,
        114,
        115,
        94,
        210,
        244,
        233
      ],
      "accounts": [
        {
          "name": "multiWallet",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
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
                ]
              },
              {
                "kind": "account",
                "path": "multi_wallet.create_key",
                "account": "multiWallet"
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true,
          "optional": true
        },
        {
          "name": "systemProgram",
          "optional": true,
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "instructionSysvar",
          "address": "Sysvar1nstructions1111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "removeMembers",
          "type": {
            "option": {
              "vec": "pubkey"
            }
          }
        },
        {
          "name": "addMembers",
          "type": {
            "option": {
              "vec": "pubkey"
            }
          }
        },
        {
          "name": "newThreshold",
          "type": {
            "option": "u16"
          }
        }
      ]
    },
    {
      "name": "create",
      "discriminator": [
        24,
        30,
        200,
        40,
        5,
        28,
        7,
        119
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "multiWallet",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
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
                ]
              },
              {
                "kind": "account",
                "path": "createKey"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
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
                ]
              },
              {
                "kind": "account",
                "path": "multiWallet"
              },
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "const",
                "value": [
                  0,
                  0
                ]
              }
            ]
          }
        },
        {
          "name": "createKey",
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "vaultTransactionExecute",
      "discriminator": [
        194,
        8,
        161,
        87,
        153,
        164,
        25,
        171
      ],
      "accounts": [
        {
          "name": "multiWallet",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
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
                ]
              },
              {
                "kind": "account",
                "path": "multi_wallet.create_key",
                "account": "multiWallet"
              }
            ]
          }
        },
        {
          "name": "instructionSysvar",
          "address": "Sysvar1nstructions1111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "vaultIndex",
          "type": "u16"
        },
        {
          "name": "transactionMessage",
          "type": "bytes"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "multiWallet",
      "discriminator": [
        100,
        242,
        252,
        66,
        54,
        82,
        77,
        90
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "durableNonceDetected",
      "msg": "Durable nonce is not allowed"
    },
    {
      "code": 6001,
      "name": "duplicateMember",
      "msg": "Found multiple members with the same pubkey"
    },
    {
      "code": 6002,
      "name": "emptyMembers",
      "msg": "Members array is empty"
    },
    {
      "code": 6003,
      "name": "tooManyMembers",
      "msg": "Too many members, can be up to 65535"
    },
    {
      "code": 6004,
      "name": "invalidThreshold",
      "msg": "Invalid threshold, must be between 1 and number of members with Vote permission"
    },
    {
      "code": 6005,
      "name": "invalidTransactionMessage",
      "msg": "TransactionMessage is malformed."
    },
    {
      "code": 6006,
      "name": "notEnoughSigners",
      "msg": "Number of signers does not meet the minumum threshold"
    },
    {
      "code": 6007,
      "name": "invalidNumberOfAccounts",
      "msg": "Wrong number of accounts provided"
    },
    {
      "code": 6008,
      "name": "invalidAccount",
      "msg": "Invalid account provided"
    },
    {
      "code": 6009,
      "name": "missingAccount",
      "msg": "Missing account"
    },
    {
      "code": 6010,
      "name": "decimalsMismatch",
      "msg": "Decimals don't match the mint"
    },
    {
      "code": 6011,
      "name": "illegalAccountOwner",
      "msg": "Account is not owned by Multisig program"
    },
    {
      "code": 6012,
      "name": "protectedAccount",
      "msg": "Account is protected, it cannot be passed into a CPI as writable"
    }
  ],
  "types": [
    {
      "name": "multiWallet",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "createKey",
            "type": "pubkey"
          },
          {
            "name": "threshold",
            "type": "u16"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "members",
            "type": {
              "vec": "pubkey"
            }
          }
        ]
      }
    }
  ]
};
