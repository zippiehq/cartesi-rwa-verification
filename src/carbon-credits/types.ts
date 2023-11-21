import { utils } from '@zippie/dataset-utils'

export type OperationCarbonCredits =
  | DatasetInit
  | OwnerAdd
  | OwnerRevoke
  | MetadataUpdate
  | AssetsMintForwardBatch
  | AssetsMintCarbonCredits
  | AssetsTransfer

export interface Parameters {
  ref: string | null
}

export interface Operation {
  module: string
  method: string
  params: Parameters
}

export interface Transaction {
  hash: string | null
  from: string
  signature: string | null
  datasetId: string
  nonce: string
  operations: Operation[]
}

export interface DatasetInit extends Operation {
  module: 'dataset'
  method: 'init'
  params: Parameters & {
    datasetId: string
    owner: string
  }
}

export interface OwnerAdd extends Operation {
  module: 'ownership'
  method: 'add'
  params: Parameters & {
    owner: string
  }
}

export interface OwnerRevoke extends Operation {
  module: 'ownership'
  method: 'revoke'
  params: Parameters & {
    owner: string
  }
}

// XXX: Do we need this?
// interface Metadata {
//   contract: string
//   name: string
//   'asset-description': string
//   'asset-class': string
//   'main-location': string
//   // supportedLocations: [string]
//   'asset-type': string
// }

export interface MetadataUpdate extends Operation {
  module: 'metadata'
  method: 'update'
  params: Parameters & {
    metadata: object // Metadata
  }
}

export interface AssetsMintForwardBatch extends Operation {
  module: 'assets'
  method: 'mintForwardBatch'
  params: Parameters & {
    batchName: string
    batchAmount: number
    batchPercentage: number
    assetMetadata: object
  }
}

export interface Vcus {
  serialStart: number
  serialEnd: number
  serialFormat: string
}

export interface AssetsMintCarbonCredits extends Operation {
  module: 'assets'
  method: 'mintCarbonCredits'
  params: Parameters & {
    assetVcus: Vcus
    assetMetadata: object
  }
}

export interface AssetsTransfer extends Operation {
  module: 'assets'
  method: 'transfer'
  params: Parameters & {
    tokenId: number
    to: string
  }
}

export interface Dataset {
  cid: string
}

export interface DatasetInfo {
  id: string
  name: string
  version: string
}

export type Nonce = string

export type Owner = string

export interface Metadata {
  'asset-class': string
  'asset-description': string
  'asset-type': string
  'main-location': string
  name: string
  contract: ''
  'supported-locations': string[]
}

export interface Batch {
  id: number
  name: string
  amount: number
  percentage: number
  firstTokenId: number
  converted: number
  remaining: number
}

export interface AssetMetadata {
  status: string
  vcu: string
}

export interface Asset {
  batchId: number
  tokenId: number
  owner: string
  metadata: AssetMetadata
}

export type Balanace = number

export type Balanaces = { [owner: string]: Balanace }

export interface Event {
  transactionHash: string | null
  // timestamp: number
  from: string
  module: string
  type: string
  data: object
}

export interface Verification {
  timestamp: number
  status: string
  message: string
}

export interface Claim {
  timestamp: number
  claimCID: string
  submitter: string
  canSeal: boolean
  isPermanentlyUnsealable: boolean
}

export interface DatasetHistory {
  verification: Verification
  claim?: Claim
  ethereumTransactionData?: utils.types.EthereumTransactionData
}
