/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/memeotc_contract.json`.
 */
export type MemeotcContract = {
  "address": "2yT4Gd7NV9NDcetuoBZsdA317Ko3JAZDGx6RCCaTATfJ",
  "metadata": {
    "name": "memeotcContract",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "acceptDeal",
      "docs": [
        "Accept and execute an OTC deal"
      ],
      "discriminator": [
        76,
        156,
        34,
        30,
        129,
        136,
        76,
        244
      ],
      "accounts": [
        {
          "name": "platform",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  116,
                  102,
                  111,
                  114,
                  109
                ]
              }
            ]
          }
        },
        {
          "name": "deal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "deal.deal_id",
                "account": "deal"
              }
            ]
          }
        },
        {
          "name": "escrowAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "deal.deal_id",
                "account": "deal"
              }
            ]
          }
        },
        {
          "name": "escrowAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "deal.deal_id",
                "account": "deal"
              }
            ]
          }
        },
        {
          "name": "taker",
          "writable": true,
          "signer": true
        },
        {
          "name": "takerTokenAccountRequested",
          "writable": true
        },
        {
          "name": "takerTokenAccountOffered",
          "writable": true
        },
        {
          "name": "makerTokenAccountRequested",
          "writable": true
        },
        {
          "name": "platformFeeAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "cancelDeal",
      "docs": [
        "Cancel an OTC deal"
      ],
      "discriminator": [
        158,
        86,
        193,
        45,
        168,
        111,
        48,
        29
      ],
      "accounts": [
        {
          "name": "deal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "deal.deal_id",
                "account": "deal"
              }
            ]
          }
        },
        {
          "name": "escrowAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "deal.deal_id",
                "account": "deal"
              }
            ]
          }
        },
        {
          "name": "escrowAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "deal.deal_id",
                "account": "deal"
              }
            ]
          }
        },
        {
          "name": "maker",
          "writable": true,
          "signer": true
        },
        {
          "name": "makerTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "createDeal",
      "docs": [
        "Create a new OTC deal"
      ],
      "discriminator": [
        198,
        212,
        144,
        151,
        97,
        56,
        149,
        113
      ],
      "accounts": [
        {
          "name": "platform",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  116,
                  102,
                  111,
                  114,
                  109
                ]
              }
            ]
          }
        },
        {
          "name": "deal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  97,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "dealId"
              }
            ]
          }
        },
        {
          "name": "escrowAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "arg",
                "path": "dealId"
              }
            ]
          }
        },
        {
          "name": "escrowAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "arg",
                "path": "dealId"
              }
            ]
          }
        },
        {
          "name": "maker",
          "writable": true,
          "signer": true
        },
        {
          "name": "makerTokenAccount",
          "writable": true
        },
        {
          "name": "tokenMintOffered"
        },
        {
          "name": "tokenMintRequested"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "dealId",
          "type": "u64"
        },
        {
          "name": "tokenMintOffered",
          "type": "pubkey"
        },
        {
          "name": "amountOffered",
          "type": "u64"
        },
        {
          "name": "tokenMintRequested",
          "type": "pubkey"
        },
        {
          "name": "amountRequested",
          "type": "u64"
        },
        {
          "name": "expiryTimestamp",
          "type": "i64"
        }
      ]
    },
    {
      "name": "initialize",
      "docs": [
        "Initialize the MemeOTC platform"
      ],
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "platform",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  116,
                  102,
                  111,
                  114,
                  109
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
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
      "name": "setPlatformPause",
      "docs": [
        "Pause/unpause the platform (only platform authority)"
      ],
      "discriminator": [
        66,
        196,
        80,
        8,
        64,
        171,
        56,
        26
      ],
      "accounts": [
        {
          "name": "platform",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  116,
                  102,
                  111,
                  114,
                  109
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "platform"
          ]
        }
      ],
      "args": [
        {
          "name": "paused",
          "type": "bool"
        }
      ]
    },
    {
      "name": "updatePlatformFee",
      "docs": [
        "Update platform fee (only platform authority)"
      ],
      "discriminator": [
        162,
        97,
        186,
        47,
        93,
        113,
        176,
        243
      ],
      "accounts": [
        {
          "name": "platform",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  116,
                  102,
                  111,
                  114,
                  109
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "platform"
          ]
        }
      ],
      "args": [
        {
          "name": "newFeeBps",
          "type": "u16"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "Deal",
      "discriminator": [
        125,
        223,
        160,
        234,
        71,
        162,
        182,
        219
      ]
    },
    {
      "name": "Platform",
      "discriminator": [
        77,
        92,
        204,
        58,
        187,
        98,
        91,
        12
      ]
    }
  ],
  "events": [
    {
      "name": "DealCancelled",
      "discriminator": [
        229,
        189,
        86,
        176,
        134,
        151,
        43,
        152
      ]
    },
    {
      "name": "DealCompleted",
      "discriminator": [
        3,
        185,
        99,
        192,
        252,
        161,
        216,
        28
      ]
    },
    {
      "name": "DealCreated",
      "discriminator": [
        27,
        18,
        50,
        52,
        104,
        175,
        46,
        101
      ]
    },
    {
      "name": "PlatformFeeUpdated",
      "discriminator": [
        210,
        134,
        201,
        4,
        92,
        228,
        80,
        26
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidAmount",
      "msg": "Invalid amount provided"
    },
    {
      "code": 6001,
      "name": "InvalidExpiry",
      "msg": "Invalid expiry timestamp"
    },
    {
      "code": 6002,
      "name": "DealNotOpen",
      "msg": "Deal is not open for acceptance"
    },
    {
      "code": 6003,
      "name": "DealExpired",
      "msg": "Deal has expired"
    },
    {
      "code": 6004,
      "name": "DealAlreadyTaken",
      "msg": "Deal has already been taken"
    },
    {
      "code": 6005,
      "name": "Unauthorized",
      "msg": "Unauthorized action"
    },
    {
      "code": 6006,
      "name": "FeeTooHigh",
      "msg": "Platform fee is too high"
    },
    {
      "code": 6007,
      "name": "CannotAcceptOwnDeal",
      "msg": "Cannot accept your own deal"
    },
    {
      "code": 6008,
      "name": "SameTokenMints",
      "msg": "Offered and requested token mints cannot be the same"
    },
    {
      "code": 6009,
      "name": "PlatformPaused",
      "msg": "Platform is currently paused"
    }
  ],
  "types": [
    {
      "name": "Deal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "dealId",
            "type": "u64"
          },
          {
            "name": "maker",
            "type": "pubkey"
          },
          {
            "name": "taker",
            "type": "pubkey"
          },
          {
            "name": "tokenMintOffered",
            "type": "pubkey"
          },
          {
            "name": "amountOffered",
            "type": "u64"
          },
          {
            "name": "tokenMintRequested",
            "type": "pubkey"
          },
          {
            "name": "amountRequested",
            "type": "u64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "DealStatus"
              }
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "expiryTimestamp",
            "type": "i64"
          },
          {
            "name": "completedAt",
            "type": "i64"
          },
          {
            "name": "escrowBump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "DealCancelled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "dealId",
            "type": "u64"
          },
          {
            "name": "maker",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "DealCompleted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "dealId",
            "type": "u64"
          },
          {
            "name": "maker",
            "type": "pubkey"
          },
          {
            "name": "taker",
            "type": "pubkey"
          },
          {
            "name": "amountOffered",
            "type": "u64"
          },
          {
            "name": "amountRequested",
            "type": "u64"
          },
          {
            "name": "platformFee",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "DealCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "dealId",
            "type": "u64"
          },
          {
            "name": "maker",
            "type": "pubkey"
          },
          {
            "name": "tokenOffered",
            "type": "pubkey"
          },
          {
            "name": "amountOffered",
            "type": "u64"
          },
          {
            "name": "tokenRequested",
            "type": "pubkey"
          },
          {
            "name": "amountRequested",
            "type": "u64"
          },
          {
            "name": "expiry",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "DealStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Open"
          },
          {
            "name": "InProgress"
          },
          {
            "name": "Completed"
          },
          {
            "name": "Cancelled"
          }
        ]
      }
    },
    {
      "name": "Platform",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "totalDeals",
            "type": "u64"
          },
          {
            "name": "completedDeals",
            "type": "u64"
          },
          {
            "name": "platformFeeBps",
            "type": "u16"
          },
          {
            "name": "isPaused",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "PlatformFeeUpdated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "oldFee",
            "type": "u16"
          },
          {
            "name": "newFee",
            "type": "u16"
          }
        ]
      }
    }
  ]
};
