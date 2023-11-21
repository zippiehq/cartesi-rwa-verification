import Ajv from 'ajv'

import {
  AssetsMintCarbonCreditsSchema,
  AssetsMintForwardBatchSchema,
  AssetsTransferSchema,
  DatasetInitSchema,
  MetadataUpdateSchema,
  OwnershipAddSchema,
  OwnershipRevokeSchema,
  TransactionSchema,
} from './schema'

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

const ajv = new Ajv()

export function validateTransaction(data: object): Transaction {
  const validate = ajv.compile(TransactionSchema)
  const valid = validate(data)

  if (!valid) {
    console.log(validate.errors)
    throw new Error('Invalid input')
  }
  return data as Transaction
}

export function validateDatasetInit(data: object): DatasetInit {
  const validate = ajv.compile(DatasetInitSchema)
  const valid = validate(data)

  if (!valid) {
    console.log(validate.errors)
    throw new Error('Invalid input')
  }
  return data as DatasetInit
}

export function validateOwnerAdd(data: object): OwnerAdd {
  const validate = ajv.compile(OwnershipAddSchema)
  const valid = validate(data)

  if (!valid) {
    console.log(validate.errors)
    throw new Error('Invalid input')
  }
  return data as OwnerAdd
}

export function validateOwnerRevoke(data: object): OwnerRevoke {
  const validate = ajv.compile(OwnershipRevokeSchema)
  const valid = validate(data)

  if (!valid) {
    console.log(validate.errors)
    throw new Error('Invalid input')
  }
  return data as OwnerRevoke
}

export function validateMetadataUpdate(data: object): MetadataUpdate {
  const validate = ajv.compile(MetadataUpdateSchema)
  const valid = validate(data)

  if (!valid) {
    console.log(validate.errors)
    throw new Error('Invalid input')
  }
  return data as MetadataUpdate
}

export function validateAssetsMintForwardBatch(data: object): AssetsMintForwardBatch {
  const validate = ajv.compile(AssetsMintForwardBatchSchema)
  const valid = validate(data)

  if (!valid) {
    console.log(validate.errors)
    throw new Error('Invalid input')
  }
  return data as AssetsMintForwardBatch
}

export function validateAssetsMintCarbonCredits(data: object): AssetsMintCarbonCredits {
  const validate = ajv.compile(AssetsMintCarbonCreditsSchema)
  const valid = validate(data)

  if (!valid) {
    console.log(validate.errors)
    throw new Error('Invalid input')
  }
  return data as AssetsMintCarbonCredits
}

export function validateAssetsTransfer(data: object): AssetsTransfer {
  const validate = ajv.compile(AssetsTransferSchema)
  const valid = validate(data)

  if (!valid) {
    console.log(validate.errors)
    throw new Error('Invalid input')
  }
  return data as AssetsTransfer
}

export function validateInput(data: object): boolean {
  try {
    const transaction = validateTransaction(data)

    transaction.operations.forEach((tx) => {
      if (tx.module === 'dataset' && tx.method === 'init') validateDatasetInit(tx)
      else if (tx.module === 'ownership' && tx.method === 'add') validateOwnerAdd(tx)
      else if (tx.module === 'ownership' && tx.method === 'revoke') validateOwnerRevoke(tx)
      else if (tx.module === 'metadata' && tx.method === 'update') validateMetadataUpdate(tx)
      else if (tx.module === 'assets' && tx.method === 'mintForwardBatch') validateAssetsMintForwardBatch(tx)
      else if (tx.module === 'assets' && tx.method === 'mintCarbonCredits') validateAssetsMintCarbonCredits(tx)
      else if (tx.module === 'assets' && tx.method === 'transfer') validateAssetsTransfer(tx)
      else throw Error('Uknown transaction')
    })
    return true
  } catch (err) {
    return false
  }
}
