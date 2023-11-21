import { JSONSchemaType } from 'ajv'

import {
  AssetsMintCarbonCredits,
  AssetsMintForwardBatch,
  AssetsTransfer,
  DatasetInit,
  MetadataUpdate,
  OwnerAdd,
  OwnerRevoke,
  Transaction,
} from './types'

// XXX: Validate string formats also

export const TransactionSchema: JSONSchemaType<Transaction> = {
  type: 'object',
  properties: {
    hash: {
      type: 'string',
    },
    from: {
      type: 'string',
    },
    signature: {
      type: 'string',
    },
    datasetId: {
      type: 'string',
    },
    nonce: {
      type: 'string',
    },
    operations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          module: {
            type: 'string',
          },
          method: {
            type: 'string',
          },
          params: {
            type: 'object',
            properties: {
              ref: {
                type: 'string',
              },
            },
            required: [],
          },
        },
        required: ['module', 'method', 'params'],
      },
    },
  },
  required: ['from', 'datasetId', 'nonce', 'operations'],
  additionalProperties: false,
}

export const DatasetInitSchema: JSONSchemaType<DatasetInit> = {
  type: 'object',
  properties: {
    module: { type: 'string', const: 'dataset' },
    method: { type: 'string', const: 'init' },
    params: {
      type: 'object',
      properties: {
        ref: {
          type: 'string',
        },
        datasetId: {
          type: 'string',
        },
        owner: {
          type: 'string',
        },
      },
      required: ['datasetId', 'owner'],
    },
  },
  required: ['module', 'method', 'params'],
  additionalProperties: false,
}

export const OwnershipAddSchema: JSONSchemaType<OwnerAdd> = {
  type: 'object',
  properties: {
    module: { type: 'string', const: 'ownership' },
    method: { type: 'string', const: 'add' },
    params: {
      type: 'object',
      properties: {
        ref: {
          type: 'string',
        },
        owner: {
          type: 'string',
        },
      },
      required: ['owner'],
    },
  },
  required: ['module', 'method', 'params'],
  additionalProperties: false,
}

export const OwnershipRevokeSchema: JSONSchemaType<OwnerRevoke> = {
  type: 'object',
  properties: {
    module: { type: 'string', const: 'ownership' },
    method: { type: 'string', const: 'revoke' },
    params: {
      type: 'object',
      properties: {
        ref: {
          type: 'string',
        },
        owner: {
          type: 'string',
        },
      },
      required: ['owner'],
    },
  },
  required: ['module', 'method', 'params'],
  additionalProperties: false,
}

export const MetadataUpdateSchema: JSONSchemaType<MetadataUpdate> = {
  type: 'object',
  properties: {
    module: { type: 'string', const: 'metadata' },
    method: { type: 'string', const: 'update' },
    params: {
      type: 'object',
      properties: {
        ref: {
          type: 'string',
        },
        metadata: {
          type: 'object',
          // properties: {
          //   contract: {
          //     type: 'string',
          //   },
          //   name: {
          //     type: 'string',
          //   },
          //   'asset-description': {
          //     type: 'string',
          //   },
          //   'asset-class': {
          //     type: 'string',
          //   },
          //   'main-location': {
          //     type: 'string',
          //   },
          //   // supportedLocations: {
          //   //   type: 'array',
          //   //   items: {
          //   //     type: 'string',
          //   //   },
          //   // },
          //   'asset-type': {
          //     type: 'string',
          //   },
          // },
          // required: [
          //   'contract',
          //   'name',
          //   'asset-description',
          //   'asset-class',
          //   'main-location',
          //   // 'supportedLocations',
          //   'asset-type',
          // ],
        },
      },
      required: ['metadata'],
    },
  },
  required: ['module', 'method', 'params'],
  additionalProperties: false,
}

export const AssetsMintForwardBatchSchema: JSONSchemaType<AssetsMintForwardBatch> = {
  type: 'object',
  properties: {
    module: { type: 'string', const: 'assets' },
    method: { type: 'string', const: 'mintForwardBatch' },
    params: {
      type: 'object',
      properties: {
        ref: {
          type: 'string',
        },
        batchName: {
          type: 'string',
        },
        batchAmount: {
          type: 'number',
        },
        batchPercentage: {
          type: 'number',
        },
        assetMetadata: {
          type: 'object',
        },
      },
      required: ['batchName', 'batchAmount', 'batchPercentage', 'assetMetadata'],
    },
  },
  required: ['module', 'method', 'params'],
  additionalProperties: false,
}

export const AssetsMintCarbonCreditsSchema: JSONSchemaType<AssetsMintCarbonCredits> = {
  type: 'object',
  properties: {
    module: { type: 'string', const: 'assets' },
    method: { type: 'string', const: 'mintCarbonCredits' },
    params: {
      type: 'object',
      properties: {
        ref: {
          type: 'string',
        },
        assetVcus: {
          type: 'object',
          properties: {
            serialStart: {
              type: 'number',
            },
            serialEnd: {
              type: 'number',
            },
            serialFormat: {
              type: 'string',
            },
          },
          required: ['serialStart', 'serialEnd', 'serialFormat'],
        },
        assetMetadata: {
          type: 'object',
        },
      },
      required: ['assetVcus', 'assetMetadata'],
    },
  },
  required: ['module', 'method', 'params'],
  additionalProperties: false,
}

export const AssetsTransferSchema: JSONSchemaType<AssetsTransfer> = {
  type: 'object',
  properties: {
    module: { type: 'string', const: 'assets' },
    method: { type: 'string', const: 'transfer' },
    params: {
      type: 'object',
      properties: {
        ref: {
          type: 'string',
        },
        tokenId: {
          type: 'number',
        },
        to: {
          type: 'string',
        },
      },
      required: ['tokenId', 'to'],
    },
  },
  required: ['module', 'method', 'params'],
  additionalProperties: false,
}
