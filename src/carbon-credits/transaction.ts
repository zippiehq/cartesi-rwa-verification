import { ethers } from 'ethers'
import { stringify } from 'safe-stable-stringify'
import secp256k1 from 'secp256k1'

import {
  OperationCarbonCredits,
  AssetsMintCarbonCredits,
  AssetsMintForwardBatch,
  AssetsTransfer,
  DatasetInit,
  MetadataUpdate,
  Operation,
  OwnerAdd,
  OwnerRevoke,
  Transaction,
  Vcus,
} from './types'
import { validateInput } from './validation'

export default class TransactionCarbonCredits implements Transaction {
  hash: string | null = null

  from: string

  signature: string | null = null

  datasetId: string

  nonce: string

  operations: Operation[]

  constructor(from: string, datasetId: string) {
    this.from = from
    this.datasetId = datasetId
    this.nonce = ethers.utils.hexlify(ethers.utils.randomBytes(32)).slice(2)
    this.operations = []
  }

  private addOperation(operation: OperationCarbonCredits): void {
    this.operations.push(operation)
    this.getHash()
    this.signature = null
  }

  // Dataset

  init(ref: string, datasetId: string, owner: string): void {
    this.addOperation({ module: 'dataset', method: 'init', params: { ref, datasetId, owner } })
  }

  // Ownership

  addOwner(ref: string, owner: string): void {
    this.addOperation({ module: 'ownership', method: 'add', params: { ref, owner } })
  }

  revokeOwner(ref: string, owner: string): void {
    this.addOperation({ module: 'ownership', method: 'revoke', params: { ref, owner } })
  }

  // Metadata

  updateMetadata(ref: string, metadata: object): void {
    this.addOperation({ module: 'metadata', method: 'update', params: { ref, metadata } })
  }

  // Assets

  mintForwardBatch(
    ref: string,
    batchName: string,
    batchAmount: number,
    batchPercentage: number,
    assetMetadata: object,
  ): void {
    this.addOperation({
      module: 'assets',
      method: 'mintForwardBatch',
      params: {
        ref,
        batchName,
        batchAmount,
        batchPercentage,
        assetMetadata,
      },
    })
  }

  mintCarbonCredits(ref: string, assetVcus: Vcus, assetMetadata: object): void {
    this.addOperation({ module: 'assets', method: 'mintCarbonCredits', params: { ref, assetVcus, assetMetadata } })
  }

  transfer(ref: string, to: string, tokenId: number): void {
    this.addOperation({ module: 'assets', method: 'transfer', params: { ref, tokenId, to } })
  }

  getJson(): string {
    return stringify(this, null, 2)
  }

  getHashJson(): string {
    const input = { datasetId: this.datasetId, nonce: this.nonce, operations: this.operations }
    return stringify(input)
  }

  getHash(): string {
    const input = { datasetId: this.datasetId, nonce: this.nonce, operations: this.operations }
    const hash = ethers.utils.sha256(Buffer.from(stringify(input)))
    this.hash = hash.slice(2)
    return this.hash
  }

  setSignature(signature: string): void {
    const hash = this.getHash()
    const valid = secp256k1.ecdsaVerify(
      ethers.utils.arrayify(`0x${signature}`),
      ethers.utils.arrayify(`0x${hash}`),
      ethers.utils.arrayify(`0x${this.from}`),
    )
    if (!valid) {
      throw new Error('Invalid signature')
    }
    this.signature = signature
  }

  static validateJson(json: string): boolean {
    return validateInput(JSON.parse(json))
  }

  static validateObject(tx: object): boolean {
    return validateInput(tx)
  }
}
