import { utils } from '@zippie/dataset-utils'
import Axios, { ResponseType } from 'axios'
import JSZip from 'jszip'

import {
  Asset,
  AssetMetadata,
  Balanace,
  Balanaces,
  Batch,
  Claim,
  Dataset,
  DatasetHistory,
  DatasetInfo,
  Event,
  Metadata,
  Nonce,
  Owner,
  Verification,
} from './types'

export default class DatasetCarbonCredits implements Dataset {
  baseURL: string

  cid: string

  datasetInfo: DatasetInfo | null = null

  nonces: Nonce[] = []

  owners: Owner[] = []

  metadata: Metadata | null = null

  batches: Batch[] = []

  assets: Asset[] = []

  balances: Balanaces = {}

  events: Event[] = []

  verifications: Verification[] = []

  claims: Claim[] | null = null

  ethereumTransactionData: utils.types.EthereumTransactionData[] | null = null

  datasetHistory: [] | null = null

  constructor(cid: string, baseURL = 'https://tosiscan-testnet-one.zippie.com') {
    this.cid = cid
    this.baseURL = baseURL
  }

  private get(url: string, responseType: ResponseType) {
    const { baseURL } = this
    const axios = Axios.create({
      baseURL,
      responseType,
    })
    return axios.get(url)
  }

  private static async unzip(blob: any, file: string): Promise<any> {
    const zip = new JSZip()
    const zipped = await zip.loadAsync(blob)
    const data = await zipped.file(file)?.async('string')
    if (!data) return null
    return JSON.parse(data)
  }

  async fetchDataset() {
    const sealResponse = await this.get(`/tosi/api/v1/query-seal/${this.cid}`, 'json')
    const path = sealResponse.data.status
    const [output] = await Promise.all([this.get(`/tosi/api/v0/ipfs/get/${path}/output.zip`, 'blob')])
    const [dataset, nonces, owners, metadata, batches, assets, balances, events, verifications] = await Promise.all([
      DatasetCarbonCredits.unzip(output.data, 'dataset.json'),
      DatasetCarbonCredits.unzip(output.data, 'nonces.json'),
      DatasetCarbonCredits.unzip(output.data, 'owners.json'),
      DatasetCarbonCredits.unzip(output.data, 'metadata.json'),
      DatasetCarbonCredits.unzip(output.data, 'batches.json'),
      DatasetCarbonCredits.unzip(output.data, 'assets.json'),
      DatasetCarbonCredits.unzip(output.data, 'balances.json'),
      DatasetCarbonCredits.unzip(output.data, 'events.json'),
      DatasetCarbonCredits.unzip(output.data, 'verifications.json'),
    ])
    this.datasetInfo = dataset || null
    this.nonces = nonces || []
    this.owners = owners || []
    this.metadata = metadata || null
    this.batches = batches || []
    this.assets = assets || []
    this.balances = balances || {}
    this.events = events || []
    this.verifications = verifications
  }

  async fetchDatasetHistory() {
    // Get claims from Datachain API
    const claimsResponse = await this.get(`/tosi/api/v1/query-claims/${this.cid}`, 'json')
    this.claims = claimsResponse.data as Claim[]

    // Fetch Arbitrum and Ethereum transaction data
    const ethereumTransactionData = await utils.getEthereumTransactionDataForAllClaims(this.cid)
    this.ethereumTransactionData = ethereumTransactionData as utils.types.EthereumTransactionData[]
  }

  getDatasetInfo(): DatasetInfo | null {
    return this.datasetInfo
  }

  getNonces(): string[] {
    return this.nonces
  }

  getOwners(): string[] {
    return this.owners
  }

  getMetadata(): Metadata | null {
    return this.metadata
  }

  getBatches(): Batch[] {
    return this.batches
  }

  getAssets(): Asset[] {
    return this.assets
  }

  getBalances(): Balanaces {
    return this.balances
  }

  getEvents(): Event[] {
    return this.events
  }

  getVerifications(): Verification[] {
    return this.verifications
  }

  assetsOf(owner: string): Asset[] {
    return this.assets.filter((asset) => asset.owner === owner)
  }

  balanceOf(owner: string): Balanace {
    return this.balances[owner]
  }

  ownerOf(tokenId: number): Owner | null {
    const token = this.assets.find((asset) => asset.tokenId === tokenId)
    return token?.owner || null
  }

  metadataOf(tokenId: number): AssetMetadata | null {
    const token = this.assets.find((asset) => asset.tokenId === tokenId)
    return token?.metadata || null
  }

  getEthereumTransactionData(): utils.types.EthereumTransactionData[] | null {
    return this.ethereumTransactionData
  }

  getClaims(): Claim[] | null {
    return this.claims
  }

  getDatasetHistory(): DatasetHistory[] | null {
    const datasetHistory = this.verifications?.map((verification: Verification, index: number) => ({
      verification,
      claim: this.claims?.[index],
      ethereumTransactionData: this.ethereumTransactionData?.[index],
    }))
    return datasetHistory
  }
}
