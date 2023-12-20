import { utils } from '@zippie/dataset-utils'
import Axios, { ResponseType } from 'axios'

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

  constructor(cid: string, baseURL = 'https://lambada.tspre.org') {
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

  async fetchDataset() {
    const latestStateResponse = await this.get(`/latest/${this.cid}`, 'json')
    const latestStateCid = latestStateResponse.data.state_cid

    const dataset = await this.get(`ipfs/${latestStateCid}/dataset.json`, 'json')
    this.datasetInfo = dataset.data || null

    const nonces = await this.get(`ipfs/${latestStateCid}/nonces.json`, 'json')
    this.nonces = nonces.data || []

    const owners = await this.get(`ipfs/${latestStateCid}/owners.json`, 'json')
    this.owners = owners.data || []

    const metadata = await this.get(`ipfs/${latestStateCid}/metadata.json`, 'json')
    this.metadata = metadata.data || null

    const batches = await this.get(`ipfs/${latestStateCid}/batches.json`, 'json')
    this.batches = batches.data || []

    const assets = await this.get(`ipfs/${latestStateCid}/assets.json`, 'json')
    this.assets = assets.data || []

    const balances = await this.get(`ipfs/${latestStateCid}/balances.json`, 'json')
    this.balances = balances.data || {}

    const events = await this.get(`ipfs/${latestStateCid}/events.json`, 'json')
    this.events = events.data || []

    const verifications = await this.get(`ipfs/${latestStateCid}/verifications.json`, 'json')
    this.verifications = verifications.data
  }

  async fetchDatasetHistory() {
    // // Get claims from Datachain API
    // const claimsResponse = await this.get(`/tosi/api/v1/query-claims/${this.cid}`, 'json')
    // this.claims = claimsResponse.data as Claim[]
    // // Fetch Arbitrum and Ethereum transaction data
    // const ethereumTransactionData = await utils.getEthereumTransactionDataForAllClaims(this.cid)
    // this.ethereumTransactionData = ethereumTransactionData as utils.types.EthereumTransactionData[]
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
