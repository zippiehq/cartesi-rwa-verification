import crypto from 'crypto'
import fs from 'fs'
import process from 'process'

import { stringify } from 'safe-stable-stringify'
import secp256k1 from 'secp256k1'
import { Asset, Balanace, Batch, Event, DatasetInfo, Metadata, Nonce, Owner } from './types'
import {
  validateTransaction,
  validateDatasetInit,
  validateOwnerAdd,
  validateOwnerRevoke,
  validateMetadataUpdate,
  validateAssetsMintForwardBatch,
  validateAssetsMintCarbonCredits,
  validateAssetsTransfer,
} from './validation'

export default class App {
  private inputPath: string

  private statePath: string

  private outputPath: string

  constructor(inputPath: string, statePath: string, outputPath: string) {
    this.inputPath = inputPath
    this.statePath = statePath
    this.outputPath = outputPath
  }

  public async run(): Promise<void> {
    try {
      // Verification status
      const verification = {
        transactionHash: '',
        timestamp: Date.now(),
        status: 'success',
        message: 'All assets verified correctly',
      }

      // Read transaction input (doesn't exisit on first run after deployment, and compare with  https://ethereum.org/en/developers/docs/transactions/)
      if (fs.existsSync(`${this.inputPath}/transaction.json`)) {
        const transactionInput = JSON.parse(fs.readFileSync(`${this.inputPath}/transaction.json`, 'utf-8'))
        const transaction = validateTransaction(transactionInput)

        // Check signature
        const input = {
          datasetId: transaction.datasetId,
          nonce: transaction.nonce,
          operations: transaction.operations,
        }

        const hash = crypto.createHash('sha256').update(stringify(input)).digest()
        if (Buffer.from(hash).toString('hex') !== transaction.hash) throw new Error('Invalid hash')

        if (transaction.signature === null) throw new Error('Invalid signature')

        const verify = secp256k1.ecdsaVerify(
          Uint8Array.from(Buffer.from(transaction.signature, 'hex')),
          hash,
          Uint8Array.from(Buffer.from(transaction.from, 'hex')),
        )

        if (!verify) throw new Error('Invalid signature')

        // Update verification status with transaction hash
        verification.transactionHash = transaction.hash

        // Read dataset
        let dataset: DatasetInfo | null = null
        if (fs.existsSync(`${this.statePath}/dataset.json`)) {
          dataset = JSON.parse(fs.readFileSync(`${this.statePath}/dataset.json`, 'utf-8'))
        }

        // Check datasetId
        if (dataset && dataset.id !== transaction.datasetId) throw new Error('Invalid datasetId')

        // Read nonces
        let nonces: Nonce[] = []
        if (fs.existsSync(`${this.statePath}/nonces.json`)) {
          nonces = JSON.parse(fs.readFileSync(`${this.statePath}/nonces.json`, 'utf-8'))
        }

        // Check nonce
        if (nonces.find((nonce) => nonce === transaction.nonce)) throw new Error('Invalid nonce')
        nonces.push(transaction.nonce)

        // Read owners
        let owners: Owner[] = []
        if (fs.existsSync(`${this.statePath}/owners.json`)) {
          owners = JSON.parse(fs.readFileSync(`${this.statePath}/owners.json`, 'utf-8'))
        }

        // Read metadata
        let metadata: Metadata | {} = {}
        if (fs.existsSync(`${this.statePath}/metadata.json`)) {
          metadata = JSON.parse(fs.readFileSync(`${this.statePath}/metadata.json`, 'utf-8'))
        }

        // Read batches
        let batches: Batch[] = []
        if (fs.existsSync(`${this.statePath}/batches.json`)) {
          batches = JSON.parse(fs.readFileSync(`${this.statePath}/batches.json`, 'utf-8'))
        }

        // Read assets
        let assets: Asset[] = []
        if (fs.existsSync(`${this.statePath}/assets.json`)) {
          assets = JSON.parse(fs.readFileSync(`${this.statePath}/assets.json`, 'utf-8'))
        }

        // Read balances
        let balances: Record<string, Balanace> = {}
        if (fs.existsSync(`${this.statePath}/balances.json`)) {
          balances = JSON.parse(fs.readFileSync(`${this.statePath}/balances.json`, 'utf-8'))
        }

        // Read events
        let events: Event[] = []
        if (fs.existsSync(`${this.statePath}/events.json`)) {
          events = JSON.parse(fs.readFileSync(`${this.statePath}/events.json`, 'utf-8'))
        }

        // Process operations
        transaction.operations.forEach((operation) => {
          // Init dataset (set id and owner)
          if (operation.module === 'dataset' && operation.method === 'init') {
            const op = validateDatasetInit(operation)

            if (dataset) throw new Error('Already initialized')

            // Set unique Id
            dataset = {
              id: op.params.datasetId,
              name: 'airimpact-carbon-credit-dataset-v1',
              version: '1.1', // Update before new deployment
            }

            // Add owner
            owners.push(op.params.owner)

            // Log owner add event
            events.push({
              transactionHash: transaction.hash,
              from: transaction.from,
              module: 'dataset',
              type: 'init',
              data: { ref: op.params.ref, id: op.params.datasetId, owner: op.params.owner },
            })
          }

          if (!dataset) throw new Error('Not initialized')

          // Add ownership
          if (operation.module === 'ownership' && operation.method === 'add') {
            const op = validateOwnerAdd(operation)

            const isOwner = owners.some((item) => item === transaction.from)
            if (!isOwner) throw new Error('Not owner')

            // Add owner
            owners.push(op.params.owner)

            // Log owner add event
            events.push({
              transactionHash: transaction.hash,
              from: transaction.from,
              module: 'ownership',
              type: 'add',
              data: { ref: op.params.ref, owner: op.params.owner },
            })
          }

          // Revoke ownership
          if (operation.module === 'ownership' && operation.method === 'revoke') {
            const op = validateOwnerRevoke(operation)

            const isOwner = owners.some((item) => item === transaction.from)
            if (!isOwner) throw new Error('Not owner')

            // Remove owner
            owners = owners.filter((item) => item !== op.params.owner)

            // Log owner revoked event
            events.push({
              transactionHash: transaction.hash,
              from: transaction.from,
              module: 'ownership',
              type: 'revoke',
              data: { ref: op.params.ref, owner: op.params.owner },
            })
          }

          // Metadata
          if (operation.module === 'metadata' && operation.method === 'update') {
            const op = validateMetadataUpdate(operation)

            const isOwner = owners.some((item) => item === transaction.from)
            if (!isOwner) throw new Error('Not owner')

            // Set metadata
            metadata = op.params.metadata

            events.push({
              transactionHash: transaction.hash,
              from: transaction.from,
              module: 'metadata',
              type: 'update',
              data: { ref: op.params.ref },
            })
          }

          // Assets
          if (operation.module === 'assets' && operation.method === 'mintForwardBatch') {
            const op = validateAssetsMintForwardBatch(operation)

            const isOwner = owners.some((item) => item === transaction.from)
            if (!isOwner) throw new Error('Not owner')

            // Get params
            const { ref, batchName, batchAmount, batchPercentage, assetMetadata } = op.params

            // Get next available batchId (auto increment batchId)
            const batchId = batches.length + 1

            // Get next available tokenId (auto increment tokenId)
            const batchFirstTokenId = assets.length + 1

            // Add batch
            batches.push({
              id: batchId,
              name: batchName,
              amount: batchAmount,
              percentage: batchPercentage, // 1-100
              firstTokenId: batchFirstTokenId,
              converted: 0,
              remaining: batchAmount,
            })

            // Init metadata
            const metadata = { ...assetMetadata, status: 'forward', vcu: '' }

            // Project is the initial owner of assets
            const projectOwner = 'owner'

            // Create all assets
            for (let i = 0; i < batchAmount; i++) {
              assets.push({ batchId: batchId, tokenId: batchFirstTokenId + i, owner: projectOwner, metadata })
            }

            // Update balance
            balances[projectOwner] = balances[projectOwner] ? (balances[projectOwner] += batchAmount) : batchAmount

            // Log mint event
            events.push({
              transactionHash: transaction.hash,
              from: transaction.from,
              module: 'assets',
              type: 'mintForwardBatch',
              data: {
                ref,
                batchId,
                batchName,
                batchPercentage,
                batchAmount,
                assetMetadata,
                firstTokenId: batchFirstTokenId,
                owner: projectOwner,
              },
            })
          }

          if (operation.module === 'assets' && operation.method === 'mintCarbonCredits') {
            const op = validateAssetsMintCarbonCredits(operation)

            const isOwner = owners.some((item) => item === transaction.from)
            if (!isOwner) throw new Error('Not owner')

            // Get params
            const { ref, assetVcus, assetMetadata } = op.params

            // Check vcu range (start and end serial numbers)
            if (!Number.isInteger(assetVcus.serialStart) || !Number.isInteger(assetVcus.serialEnd))
              throw new Error('Invalid vcus serial range provided')

            // Check vcu format
            if (!assetVcus.serialFormat.includes('{serialNumber}'))
              throw new Error('Invalid vcus serial format provided')

            // Get total amount of assets to convert from forward to carbon credit
            const totalConvertAmount = assetVcus.serialEnd - assetVcus.serialStart + 1
            if (totalConvertAmount <= 0) throw new Error('Invalid vcus provided')

            // Generate array of vcu serial numbers
            const vcusGenerated = [...Array(totalConvertAmount).keys()].map((i) =>
              assetVcus.serialFormat.replace('{serialNumber}', String(assetVcus.serialStart + i)),
            )

            // Get amount of assets to convert for each batch
            const batchConvertAmount = batches.map((batch) => ({
              batchId: batch.id,
              // Convert only the amount of assets that are available in the batch
              convertAmount: Math.min(batch.remaining, Math.trunc((batch.percentage / 100) * totalConvertAmount)),
            }))

            // Get sum of all amounts to convert
            const sumConvertAmount = batchConvertAmount.reduce((acc, item) => acc + item.convertAmount, 0)

            // If sum is less than total amount, add the difference to the project batch/account (this will also be the case if each batch has no remaining assets to be converted)
            if (sumConvertAmount < totalConvertAmount) {
              batchConvertAmount.push({ batchId: 0, convertAmount: totalConvertAmount - sumConvertAmount })
            }

            // Check if final sum and total is equal
            const finalSumConvertAmount = batchConvertAmount.reduce((acc, item) => acc + item.convertAmount, 0)
            if (finalSumConvertAmount !== totalConvertAmount)
              throw new Error('Sum of convert amounts is not equal to total amount')

            // Log mint event
            events.push({
              transactionHash: transaction.hash,
              from: transaction.from,
              module: 'assets',
              type: 'mintCarbonCredits',
              data: { ref, batchConvertAmount, assetVcus, assetMetadata },
            })

            // Convert assets using vcus
            let numberOfUsedVcus = 0
            batchConvertAmount.forEach((item) => {
              const batchIndex = batches.findIndex((batch) => batch.id === item.batchId)
              if (item.batchId !== 0) {
                const batch = batches[batchIndex]

                // Check if batch has enough assets to convert
                if (batch.remaining < item.convertAmount) throw new Error('Not enough assets to convert')

                // Update batch amounts
                batch.converted += item.convertAmount
                batch.remaining -= item.convertAmount

                // Check if batch amounts are correct after update
                if (batch.converted + batch.remaining !== batch.amount)
                  throw new Error('Sum of converted and remaining assets is not equal to total amount')

                // Get all assets that are in the batch and have status forward
                const forwards = assets.filter(
                  (asset) => asset.batchId === batch.id && asset.metadata.status === 'forward',
                )
                if (forwards.length < item.convertAmount) throw new Error('Not enough forwards to convert')

                // Get forwards and vcus to use for conversion
                const forwardsToConvert = forwards.slice(0, item.convertAmount)
                const vcusToUse = vcusGenerated.slice(numberOfUsedVcus, numberOfUsedVcus + item.convertAmount)
                if (vcusToUse.length !== forwardsToConvert.length)
                  throw new Error('Number of vcus to use is not equal to number of forwards to convert')

                // Update assets
                forwardsToConvert.forEach((forward, index) => {
                  // Update metadata
                  const asset = assets[assets.findIndex((item) => item.tokenId === forward.tokenId)]
                  const metadata = {
                    ...asset.metadata,
                    ...assetMetadata,
                    status: 'carbonCredit',
                    vcu: vcusToUse[index],
                  }
                  assets[assets.findIndex((item) => item.tokenId === forward.tokenId)] = {
                    ...asset,
                    metadata,
                  }

                  // Log convert event for asset
                  events.push({
                    transactionHash: transaction.hash,
                    from: transaction.from,
                    module: 'assets',
                    type: 'convertForwardToCarbonCredit',
                    data: { ref, batchId: batch.id, tokenId: forward.tokenId, vcu: vcusToUse[index] },
                  })
                })

                // Update number of used vcus
                numberOfUsedVcus += item.convertAmount
              } else {
                // Mint carbon credit assets for project
                const projectOwner = 'owner'
                for (let i = 0; i < item.convertAmount; i++) {
                  // Create asset
                  const tokenId = assets.length + 1 // Auto increment tokenId
                  const metadata = {
                    ...assetMetadata,
                    status: 'carbonCredit',
                    vcu: vcusGenerated[numberOfUsedVcus + i],
                  }
                  assets.push({ batchId: 0, tokenId, owner: projectOwner, metadata })

                  // Update balance
                  balances[projectOwner] = balances[projectOwner] ? (balances[projectOwner] += 1) : 1

                  // Log mint event for asset
                  events.push({
                    transactionHash: transaction.hash,
                    from: transaction.from,
                    module: 'assets',
                    type: 'mintCarbonCreditWithoutConvert',
                    data: { ref, batchId: 0, tokenId, vcu: vcusGenerated[numberOfUsedVcus + i] },
                  })
                }
              }
            })
          }

          // Transfer
          if (operation.module === 'assets' && operation.method === 'transfer') {
            const op = validateAssetsTransfer(operation)

            const asset = assets.find((item) => item.tokenId === op.params.tokenId)

            if (!asset) throw new Error('Invalid asset')

            // Check if asset is owned by project owners
            if (asset.owner === 'owner' && !owners.some((item) => item === transaction.from))
              throw new Error('Not owner')

            // Check if asset is owned by sender
            if (asset.owner !== 'owner' && transaction.from !== asset.owner) throw new Error('Not asset owner')

            // Change asset owner
            assets[assets.findIndex((item) => item.tokenId === op.params.tokenId)] = {
              ...asset,
              owner: op.params.to,
            }

            // Update balance
            balances[asset.owner] -= 1
            balances[op.params.to] = balances[op.params.to] ? (balances[op.params.to] += 1) : 1

            // Log transfer event
            events.push({
              transactionHash: transaction.hash,
              from: transaction.from,
              module: 'assets',
              type: 'transfer',
              data: { ref: op.params.ref, tokenId: asset.tokenId, from: asset.owner, to: op.params.to },
            })
          }
        })

        // Write dataset
        fs.writeFileSync(`${this.statePath}/dataset.json`, JSON.stringify(dataset, null, 2))
        fs.copyFileSync(`${this.statePath}/dataset.json`, `${this.outputPath}/dataset.json`)

        // Write nonces
        fs.writeFileSync(`${this.statePath}/nonces.json`, JSON.stringify(nonces, null, 2))
        fs.copyFileSync(`${this.statePath}/nonces.json`, `${this.outputPath}/nonces.json`)

        // Write owners
        fs.writeFileSync(`${this.statePath}/owners.json`, JSON.stringify(owners, null, 2))
        fs.copyFileSync(`${this.statePath}/owners.json`, `${this.outputPath}/owners.json`)

        // Write metadata
        fs.writeFileSync(`${this.statePath}/metadata.json`, JSON.stringify(metadata, null, 2))
        fs.copyFileSync(`${this.statePath}/metadata.json`, `${this.outputPath}/metadata.json`)

        // Write batches
        fs.writeFileSync(`${this.statePath}/batches.json`, JSON.stringify(batches, null, 2))
        fs.copyFileSync(`${this.statePath}/batches.json`, `${this.outputPath}/batches.json`)

        // Write assets
        fs.writeFileSync(`${this.statePath}/assets.json`, JSON.stringify(assets, null, 2))
        fs.copyFileSync(`${this.statePath}/assets.json`, `${this.outputPath}/assets.json`)

        // Write balances
        fs.writeFileSync(`${this.statePath}/balances.json`, JSON.stringify(balances, null, 2))
        fs.copyFileSync(`${this.statePath}/balances.json`, `${this.outputPath}/balances.json`)

        // Write transfers
        fs.writeFileSync(`${this.statePath}/events.json`, JSON.stringify(events, null, 2))
        fs.copyFileSync(`${this.statePath}/events.json`, `${this.outputPath}/events.json`)

        // Copy transaction input to output (for easy access)
        fs.copyFileSync(`${this.inputPath}/transaction.json`, `${this.outputPath}/transaction.json`)
      }

      // Update verification status history
      if (!fs.existsSync(`${this.statePath}/verifications.json`)) {
        fs.writeFileSync(`${this.statePath}/verifications.json`, JSON.stringify([verification], null, 2))
      } else {
        const verifications = JSON.parse(fs.readFileSync(`${this.statePath}/verifications.json`, 'utf-8'))
        verifications.push(verification)
        fs.writeFileSync(`${this.statePath}/verifications.json`, JSON.stringify(verifications, null, 2))
      }
      fs.copyFileSync(`${this.statePath}/verifications.json`, `${this.outputPath}/verifications.json`)
    } catch (err) {
      console.log(err)
      process.exit(1)
    }
  }
}
