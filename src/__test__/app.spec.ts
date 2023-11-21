import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

import { stringify } from 'safe-stable-stringify'
import secp256k1 from 'secp256k1'

import App from '../carbon-credits/app'
import {
  Operation,
  DatasetInit,
  AssetsMintForwardBatch,
  Event,
  Transaction,
  AssetsMintCarbonCredits,
  OperationCarbonCredits,
} from '../carbon-credits/types'

// Keys
const privateKey1 = 'eb8e6e1b2f89b5863b73777855fb160c5fdf0e2d51f92a645ba6c17906e03f6f' // 0459def4fe9d584d115e5cfa1fc9d428ff5a8b23023c094cafb745ad7e53bacc5f184123456558db7168ca7122c5e21348fa4ea4af7a61c9eb4c8ca8c6461b59ac
const publickKey1Compressed = secp256k1.publicKeyCreate(Uint8Array.from(Buffer.from(privateKey1, 'hex')))
const publicKey1 = Buffer.from(secp256k1.publicKeyConvert(publickKey1Compressed, false)).toString('hex')

const privateKey2 = 'b58a3b22e9d5c7248ddcae731703da1f84fd265d370ffb559494c64c54769a3b' // 04c50af7c47a927ba40162144890561a601436f5719cfd5f256a5fd8601d5232b05df1f95a7445ca2290ba9b6b97b686b8c0ab4be8c2109124bdb0af42488debc6
const publickKey2Compressed = secp256k1.publicKeyCreate(Uint8Array.from(Buffer.from(privateKey2, 'hex')))
const publicKey2 = Buffer.from(secp256k1.publicKeyConvert(publickKey2Compressed, false)).toString('hex')

const app = new App(`${__dirname}/.input`, `${__dirname}/.state`, `${__dirname}/.output`)
const datasetId = crypto.randomBytes(32).toString('hex')

const createSignedTransaction = (
  datasetId: string,
  privateKey1: string,
  publicKey1: string,
  operations: Operation[],
): Transaction => {
  // Compare with  https://ethereum.org/en/developers/docs/transactions/
  // Create signed transaction (use deterministic stringify)
  const nonce = crypto.randomBytes(32).toString('hex')
  const input = { datasetId, nonce, operations }
  const hash = crypto.createHash('sha256').update(stringify(input)).digest()
  const sig = secp256k1.ecdsaSign(hash, Uint8Array.from(Buffer.from(privateKey1, 'hex')))
  const signature = { rs: Buffer.from(sig.signature).toString('hex'), recovery: sig.recid }

  // Create signed transaction object
  const transaction: Transaction = {
    hash: Buffer.from(hash).toString('hex'),
    from: publicKey1,
    signature: signature.rs,
    ...input,
  }
  return transaction
}

describe('Datachain App', () => {
  beforeAll(async () => {
    // Remove input, state, output folders (inluding files)
    if (fs.existsSync(path.join(__dirname, `/.input`))) fs.rmSync(path.join(__dirname, `/.input`), { recursive: true })
    if (fs.existsSync(path.join(__dirname, `/.state`))) fs.rmSync(path.join(__dirname, `/.state`), { recursive: true })
    if (fs.existsSync(path.join(__dirname, `/.output`)))
      fs.rmSync(path.join(__dirname, `/.output`), { recursive: true })

    // Re-create empty input, state, output folders
    fs.mkdirSync(path.join(__dirname, `/.input`), { recursive: true })
    fs.mkdirSync(path.join(__dirname, `/.state`), { recursive: true })
    fs.mkdirSync(path.join(__dirname, `/.output`), { recursive: true })
  })

  describe('Airimpact Carbon Credit Dataset - Multiple transactions with single operations', () => {
    it('init dataset', () => {
      // Create list of operations
      const operations: DatasetInit[] = [
        {
          module: 'dataset',
          method: 'init',
          params: {
            ref: 'tx 01',
            datasetId,
            owner: publicKey1,
          },
        },
      ]

      // Create signed transaction
      const transaction = createSignedTransaction(datasetId, privateKey1, publicKey1, operations)

      fs.writeFileSync(`${__dirname}/.input/transaction.json`, stringify(transaction, null, 2))

      app.run()

      const dataset = JSON.parse(fs.readFileSync(`${__dirname}/.state/dataset.json`, 'utf-8'))
      expect(dataset).toEqual({
        id: operations[0].params.datasetId,
        name: 'airimpact-carbon-credit-dataset-v1',
        version: '1.1',
      })

      const nonces = JSON.parse(fs.readFileSync(`${__dirname}/.state/nonces.json`, 'utf-8'))
      expect(nonces).toEqual(expect.arrayContaining([transaction.nonce]))

      const owners = JSON.parse(fs.readFileSync(`${__dirname}/.state/owners.json`, 'utf-8'))
      expect(owners).toEqual([operations[0].params.owner])

      const events = JSON.parse(fs.readFileSync(`${__dirname}/.state/events.json`, 'utf-8'))
      expect(events).toEqual(
        expect.arrayContaining([
          {
            transactionHash: transaction.hash,
            from: publicKey1,
            module: 'dataset',
            type: 'init',
            data: {
              ref: 'tx 01',
              id: operations[0].params.datasetId,
              owner: operations[0].params.owner,
            },
          },
        ]),
      )
    })

    it('add owner', () => {
      // Create list of operations
      const operations = [
        {
          module: 'ownership',
          method: 'add',
          params: {
            ref: 'tx 02',
            owner: publicKey2,
          },
        },
      ]

      // Create signed transaction
      const transaction = createSignedTransaction(datasetId, privateKey1, publicKey1, operations)

      fs.writeFileSync(`${__dirname}/.input/transaction.json`, stringify(transaction, null, 2))

      app.run()

      const nonces = JSON.parse(fs.readFileSync(`${__dirname}/.state/nonces.json`, 'utf-8'))
      expect(nonces).toEqual(expect.arrayContaining([transaction.nonce]))

      const owners = JSON.parse(fs.readFileSync(`${__dirname}/.state/owners.json`, 'utf-8'))
      expect(owners).toEqual([publicKey1, publicKey2])

      const events = JSON.parse(fs.readFileSync(`${__dirname}/.state/events.json`, 'utf-8'))
      expect(events).toEqual(
        expect.arrayContaining([
          {
            transactionHash: transaction.hash,
            from: publicKey1,
            module: 'ownership',
            type: 'add',
            data: {
              ref: 'tx 02',
              owner: publicKey2,
            },
          },
        ]),
      )
    })

    it('update metadata', () => {
      // Create list of operations
      const operations = [
        {
          module: 'metadata',
          method: 'update',
          params: {
            ref: 'tx 03',
            metadata: {
              contract: '',
              name: 'Airimpact Carbon Credit Dataset',
              'asset-description': '',
              'asset-class': 'Carbon Credit',
              'main-location': 'Datachain',
              'supported-locations': ['Ethereum Goerli', 'Ethereum Mainnet'],
              'asset-type': 'Digital Asset',
            },
          },
        },
      ]

      // Sign transaction
      const transaction = createSignedTransaction(datasetId, privateKey1, publicKey1, operations)

      fs.writeFileSync(`${__dirname}/.input/transaction.json`, stringify(transaction, null, 2))

      app.run()

      const nonces = JSON.parse(fs.readFileSync(`${__dirname}/.state/nonces.json`, 'utf-8'))
      expect(nonces).toEqual(expect.arrayContaining([transaction.nonce]))

      const metadata = JSON.parse(fs.readFileSync(`${__dirname}/.state/metadata.json`, 'utf-8'))
      expect(metadata).toEqual({
        contract: '',
        name: 'Airimpact Carbon Credit Dataset',
        'asset-description': '',
        'asset-class': 'Carbon Credit',
        'main-location': 'Datachain',
        'supported-locations': ['Ethereum Goerli', 'Ethereum Mainnet'],
        'asset-type': 'Digital Asset',
      })

      const events = JSON.parse(fs.readFileSync(`${__dirname}/.state/events.json`, 'utf-8'))
      expect(events).toEqual(
        expect.arrayContaining([
          {
            transactionHash: transaction.hash,
            from: publicKey1,
            module: 'metadata',
            type: 'update',
            data: { ref: 'tx 03' },
          },
        ]),
      )
    })

    it('mint two forward batches', () => {
      // Create list of operations
      const operations: AssetsMintForwardBatch[] = [
        {
          module: 'assets',
          method: 'mintForwardBatch',
          params: {
            ref: 'tx 04',
            batchName: 'Batch 1',
            batchAmount: 3,
            batchPercentage: 50,
            assetMetadata: {
              description: 'Airimpact Carbon Credit Foward',
            },
          },
        },
        {
          module: 'assets',
          method: 'mintForwardBatch',
          params: {
            ref: 'tx 05',
            batchName: 'Batch 2',
            batchAmount: 3,
            batchPercentage: 50,
            assetMetadata: {
              description: 'Airimpact Carbon Credit Foward',
            },
          },
        },
      ]

      // Create signed transaction
      const transaction = createSignedTransaction(datasetId, privateKey1, publicKey1, operations)

      fs.writeFileSync(`${__dirname}/.input/transaction.json`, stringify(transaction, null, 2))

      app.run()

      const nonces = JSON.parse(fs.readFileSync(`${__dirname}/.state/nonces.json`, 'utf-8'))
      expect(nonces).toEqual(expect.arrayContaining([transaction.nonce]))

      const batches = JSON.parse(fs.readFileSync(`${__dirname}/.state/batches.json`, 'utf-8'))
      expect(batches).toEqual([
        {
          id: 1,
          name: 'Batch 1',
          amount: 3,
          percentage: 50,
          firstTokenId: 1,
          converted: 0,
          remaining: 3,
        },
        {
          id: 2,
          name: 'Batch 2',
          amount: 3,
          percentage: 50,
          firstTokenId: 4,
          converted: 0,
          remaining: 3,
        },
      ])

      const assets = JSON.parse(fs.readFileSync(`${__dirname}/.state/assets.json`, 'utf-8'))
      expect(assets).toEqual([
        {
          batchId: 1,
          tokenId: 1,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 1,
          tokenId: 2,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 1,
          tokenId: 3,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 2,
          tokenId: 4,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 2,
          tokenId: 5,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 2,
          tokenId: 6,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
      ])

      const balances = JSON.parse(fs.readFileSync(`${__dirname}/.state/balances.json`, 'utf-8'))
      expect(balances).toEqual({
        owner: 6,
      })

      const events = JSON.parse(fs.readFileSync(`${__dirname}/.state/events.json`, 'utf-8'))
      expect(events).toEqual(
        expect.arrayContaining([
          {
            transactionHash: transaction.hash,
            from: publicKey1,
            module: 'assets',
            type: 'mintForwardBatch',
            data: {
              ref: 'tx 04',
              batchId: 1,
              batchName: 'Batch 1',
              batchPercentage: 50,
              batchAmount: 3,
              assetMetadata: {
                description: 'Airimpact Carbon Credit Foward',
              },
              firstTokenId: 1,
              owner: 'owner',
            },
          },
          {
            transactionHash: transaction.hash,
            from: publicKey1,
            module: 'assets',
            type: 'mintForwardBatch',
            data: {
              ref: 'tx 05',
              batchId: 2,
              batchName: 'Batch 2',
              batchPercentage: 50,
              batchAmount: 3,
              assetMetadata: {
                description: 'Airimpact Carbon Credit Foward',
              },
              firstTokenId: 4,
              owner: 'owner',
            },
          },
        ]),
      )
    })

    it('mint three carbon credits', () => {
      // Create list of operations
      const operations: AssetsMintCarbonCredits[] = [
        {
          module: 'assets',
          method: 'mintCarbonCredits',
          params: {
            ref: 'tx 06',
            assetVcus: {
              serialStart: 1,
              serialEnd: 3,
              serialFormat: 'VCU-{serialNumber}-TEST',
            },
            assetMetadata: {
              description: 'Airimpact Carbon Credit', // Will replace existimg metadata description from mintForwardBatch
            },
          },
        },
      ]

      // Create signed transaction
      const transaction = createSignedTransaction(datasetId, privateKey1, publicKey1, operations)

      fs.writeFileSync(`${__dirname}/.input/transaction.json`, stringify(transaction, null, 2))

      app.run()

      const nonces = JSON.parse(fs.readFileSync(`${__dirname}/.state/nonces.json`, 'utf-8'))
      expect(nonces).toEqual(expect.arrayContaining([transaction.nonce]))

      const assets = JSON.parse(fs.readFileSync(`${__dirname}/.state/assets.json`, 'utf-8'))
      expect(assets).toEqual([
        {
          batchId: 1,
          tokenId: 1,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit',
            status: 'carbonCredit',
            vcu: 'VCU-1-TEST',
          },
        },
        {
          batchId: 1,
          tokenId: 2,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 1,
          tokenId: 3,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 2,
          tokenId: 4,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit',
            status: 'carbonCredit',
            vcu: 'VCU-2-TEST',
          },
        },
        {
          batchId: 2,
          tokenId: 5,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 2,
          tokenId: 6,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 0,
          tokenId: 7,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit',
            status: 'carbonCredit',
            vcu: 'VCU-3-TEST',
          },
        },
      ])

      const balances = JSON.parse(fs.readFileSync(`${__dirname}/.state/balances.json`, 'utf-8'))
      expect(balances).toEqual({
        owner: 7,
      })

      const events = JSON.parse(fs.readFileSync(`${__dirname}/.state/events.json`, 'utf-8'))
      expect(events).toEqual(
        expect.arrayContaining([
          {
            transactionHash: transaction.hash,
            from: publicKey1,
            module: 'assets',
            type: 'mintCarbonCredits',
            data: {
              ref: 'tx 06',
              batchConvertAmount: [
                {
                  batchId: 1,
                  convertAmount: 1,
                },
                {
                  batchId: 2,
                  convertAmount: 1,
                },
                {
                  batchId: 0,
                  convertAmount: 1,
                },
              ],
              assetVcus: {
                serialEnd: 3,
                serialFormat: 'VCU-{serialNumber}-TEST',
                serialStart: 1,
              },
              assetMetadata: {
                description: 'Airimpact Carbon Credit',
              },
            },
          },
          {
            transactionHash: transaction.hash,
            from: publicKey1,
            module: 'assets',
            type: 'convertForwardToCarbonCredit',
            data: {
              ref: 'tx 06',
              batchId: 1,
              tokenId: 1,
              vcu: 'VCU-1-TEST',
            },
          },
          {
            transactionHash: transaction.hash,
            from: publicKey1,
            module: 'assets',
            type: 'convertForwardToCarbonCredit',
            data: {
              ref: 'tx 06',
              batchId: 2,
              tokenId: 4,
              vcu: 'VCU-2-TEST',
            },
          },
          {
            transactionHash: transaction.hash,
            from: publicKey1,
            module: 'assets',
            type: 'mintCarbonCreditWithoutConvert',
            data: {
              ref: 'tx 06',
              batchId: 0,
              tokenId: 7,
              vcu: 'VCU-3-TEST',
            },
          },
        ]),
      )
    })

    it('transfer two asset', () => {
      // Create list of operations
      const operations = [
        {
          module: 'assets',
          method: 'transfer',
          params: {
            ref: 'tx 07',
            tokenId: 1,
            to: publicKey1,
          },
        },
        {
          module: 'assets',
          method: 'transfer',
          params: {
            ref: 'tx 08',
            tokenId: 2,
            to: publicKey2,
          },
        },
      ]

      // Create signed transaction
      const transaction = createSignedTransaction(datasetId, privateKey1, publicKey1, operations)

      fs.writeFileSync(`${__dirname}/.input/transaction.json`, stringify(transaction, null, 2))

      app.run()

      const nonces = JSON.parse(fs.readFileSync(`${__dirname}/.state/nonces.json`, 'utf-8'))
      expect(nonces).toEqual(expect.arrayContaining([transaction.nonce]))

      const assets = JSON.parse(fs.readFileSync(`${__dirname}/.state/assets.json`, 'utf-8'))
      expect(assets).toEqual([
        {
          batchId: 1,
          tokenId: 1,
          owner: publicKey1,
          metadata: {
            description: 'Airimpact Carbon Credit',
            status: 'carbonCredit',
            vcu: 'VCU-1-TEST',
          },
        },
        {
          batchId: 1,
          tokenId: 2,
          owner: publicKey2,
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 1,
          tokenId: 3,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 2,
          tokenId: 4,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit',
            status: 'carbonCredit',
            vcu: 'VCU-2-TEST',
          },
        },
        {
          batchId: 2,
          tokenId: 5,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 2,
          tokenId: 6,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 0,
          tokenId: 7,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit',
            status: 'carbonCredit',
            vcu: 'VCU-3-TEST',
          },
        },
      ])

      const balances = JSON.parse(fs.readFileSync(`${__dirname}/.state/balances.json`, 'utf-8'))
      expect(balances).toEqual({
        owner: 5,
        [publicKey1]: 1,
        [publicKey2]: 1,
      })

      const events = JSON.parse(fs.readFileSync(`${__dirname}/.state/events.json`, 'utf-8'))
      expect(events).toEqual(
        expect.arrayContaining([
          {
            transactionHash: transaction.hash,
            from: publicKey1,
            module: 'assets',
            type: 'transfer',
            data: {
              ref: 'tx 07',
              tokenId: 1,
              from: 'owner',
              to: publicKey1,
            },
          },
          {
            transactionHash: transaction.hash,
            from: publicKey1,
            module: 'assets',
            type: 'transfer',
            data: {
              ref: 'tx 08',
              tokenId: 2,
              from: 'owner',
              to: publicKey2,
            },
          },
        ]),
      )
    })

    it('revoke one owner', () => {
      // Create list of operations
      const operations = [
        {
          module: 'ownership',
          method: 'revoke',
          params: {
            ref: 'tx 09',
            owner: publicKey1,
          },
        },
      ]

      // Create signed transaction
      const transaction = createSignedTransaction(datasetId, privateKey1, publicKey1, operations)

      fs.writeFileSync(`${__dirname}/.input/transaction.json`, stringify(transaction, null, 2))

      app.run()

      const nonces = JSON.parse(fs.readFileSync(`${__dirname}/.state/nonces.json`, 'utf-8'))
      expect(nonces).toEqual(expect.arrayContaining([transaction.nonce]))

      const owners = JSON.parse(fs.readFileSync(`${__dirname}/.state/owners.json`, 'utf-8'))
      expect(owners).toEqual([publicKey2])

      const events = JSON.parse(fs.readFileSync(`${__dirname}/.state/events.json`, 'utf-8'))
      expect(events).toEqual(
        expect.arrayContaining([
          {
            transactionHash: transaction.hash,
            from: publicKey1,
            module: 'ownership',
            type: 'revoke',
            data: {
              ref: 'tx 09',
              owner: publicKey1,
            },
          },
        ]),
      )
    })
  })

  describe('Airimpact Carbon Credit Dataset - Single transaction with multiple operations', () => {
    it('send all operations signed in one transaction', () => {
      // Remove input, state, output folders (inluding files)
      fs.rmSync(path.join(__dirname, `/.input`), { recursive: true })
      fs.rmSync(path.join(__dirname, `/.state`), { recursive: true })
      fs.rmSync(path.join(__dirname, `/.output`), { recursive: true })

      // Re-create empty input, state, output folders
      fs.mkdirSync(path.join(__dirname, `/.input`), { recursive: true })
      fs.mkdirSync(path.join(__dirname, `/.state`), { recursive: true })
      fs.mkdirSync(path.join(__dirname, `/.output`), { recursive: true })

      // Create list of operations
      const operations: OperationCarbonCredits[] = [
        {
          module: 'dataset',
          method: 'init',
          params: {
            ref: 'tx 01',
            datasetId,
            owner: publicKey1,
          },
        },
        {
          module: 'ownership',
          method: 'add',
          params: {
            ref: 'tx 02',
            owner: publicKey2,
          },
        },
        {
          module: 'metadata',
          method: 'update',
          params: {
            ref: 'tx 03',
            metadata: {
              contract: '',
              name: 'Airimpact Carbon Credit Dataset',
              'asset-description': '',
              'asset-class': 'Carbon Credit',
              'main-location': 'Datachain',
              'supported-locations': ['Ethereum Goerli', 'Ethereum Mainnet'],
              'asset-type': 'Digital Asset',
            },
          },
        },
        {
          module: 'assets',
          method: 'mintForwardBatch',
          params: {
            ref: 'tx 04',
            batchName: 'Batch 1',
            batchAmount: 10,
            batchPercentage: 50,
            assetMetadata: {
              description: 'Airimpact Carbon Credit Foward',
            },
          },
        },
        {
          module: 'assets',
          method: 'mintForwardBatch',
          params: {
            ref: 'tx 05',
            batchName: 'Batch 2',
            batchAmount: 10,
            batchPercentage: 50,
            assetMetadata: {
              description: 'Airimpact Carbon Credit Foward',
            },
          },
        },
        {
          module: 'assets',
          method: 'mintCarbonCredits',
          params: {
            ref: 'tx 06',
            assetVcus: {
              serialStart: 1,
              serialEnd: 3,
              serialFormat: 'VCU-{serialNumber}-TEST',
            },
            assetMetadata: {
              description: 'Airimpact Carbon Credit', // Will replace existimg metadata description from mintForwardBatch
            },
          },
        },
        {
          module: 'assets',
          method: 'transfer',
          params: {
            ref: 'tx 07',
            tokenId: 1,
            to: publicKey1,
          },
        },
        {
          module: 'assets',
          method: 'transfer',
          params: {
            ref: 'tx 08',
            tokenId: 2,
            to: publicKey2,
          },
        },
      ]

      // Create signed transaction
      const transaction = createSignedTransaction(datasetId, privateKey1, publicKey1, operations)

      fs.writeFileSync(`${__dirname}/.input/transaction.json`, stringify(transaction, null, 2))

      app.run()

      const dataset = JSON.parse(fs.readFileSync(`${__dirname}/.state/dataset.json`, 'utf-8'))
      expect(dataset).toEqual({ id: datasetId, name: 'airimpact-carbon-credit-dataset-v1', version: '1.1' })

      const nonces = JSON.parse(fs.readFileSync(`${__dirname}/.state/nonces.json`, 'utf-8'))
      expect(nonces).toEqual(expect.arrayContaining([transaction.nonce]))

      const owners = JSON.parse(fs.readFileSync(`${__dirname}/.state/owners.json`, 'utf-8'))
      expect(owners).toEqual([publicKey1, publicKey2])

      const events = JSON.parse(fs.readFileSync(`${__dirname}/.state/events.json`, 'utf-8'))
      expect(events).toEqual(
        expect.arrayContaining([
          {
            transactionHash: transaction.hash,
            from: publicKey1,
            module: 'dataset',
            type: 'init',
            data: {
              ref: 'tx 01',
              id: datasetId,
              owner: publicKey1,
            },
          },
          {
            transactionHash: transaction.hash,
            from: publicKey1,
            module: 'ownership',
            type: 'add',
            data: {
              ref: 'tx 02',
              owner: publicKey2,
            },
          },
          {
            transactionHash: transaction.hash,
            from: publicKey1,
            module: 'metadata',
            type: 'update',
            data: {
              ref: 'tx 03',
            },
          },
          {
            transactionHash: transaction.hash,
            from: publicKey1,
            module: 'assets',
            type: 'mintForwardBatch',
            data: {
              ref: 'tx 04',
              batchId: 1,
              batchName: 'Batch 1',
              batchPercentage: 50,
              batchAmount: 10,
              assetMetadata: {
                description: 'Airimpact Carbon Credit Foward',
              },
              firstTokenId: 1,
              owner: 'owner',
            },
          },
          {
            transactionHash: transaction.hash,
            from: publicKey1,
            module: 'assets',
            type: 'mintForwardBatch',
            data: {
              ref: 'tx 05',
              batchId: 2,
              batchName: 'Batch 2',
              batchPercentage: 50,
              batchAmount: 10,
              assetMetadata: {
                description: 'Airimpact Carbon Credit Foward',
              },
              firstTokenId: 11,
              owner: 'owner',
            },
          },
          {
            transactionHash: transaction.hash,
            from: publicKey1,
            module: 'assets',
            type: 'mintCarbonCredits',
            data: {
              ref: 'tx 06',
              batchConvertAmount: [
                {
                  batchId: 1,
                  convertAmount: 1,
                },
                {
                  batchId: 2,
                  convertAmount: 1,
                },
                {
                  batchId: 0,
                  convertAmount: 1,
                },
              ],
              assetVcus: {
                serialEnd: 3,
                serialFormat: 'VCU-{serialNumber}-TEST',
                serialStart: 1,
              },
              assetMetadata: {
                description: 'Airimpact Carbon Credit',
              },
            },
          },
          {
            transactionHash: transaction.hash,
            from: publicKey1,
            module: 'assets',
            type: 'convertForwardToCarbonCredit',
            data: {
              ref: 'tx 06',
              batchId: 1,
              tokenId: 1,
              vcu: 'VCU-1-TEST',
            },
          },
          {
            transactionHash: transaction.hash,
            from: publicKey1,
            module: 'assets',
            type: 'convertForwardToCarbonCredit',
            data: {
              ref: 'tx 06',
              batchId: 2,
              tokenId: 11,
              vcu: 'VCU-2-TEST',
            },
          },
          {
            transactionHash: transaction.hash,
            from: publicKey1,
            module: 'assets',
            type: 'mintCarbonCreditWithoutConvert',
            data: {
              ref: 'tx 06',
              batchId: 0,
              tokenId: 21,
              vcu: 'VCU-3-TEST',
            },
          },
          {
            transactionHash: transaction.hash,
            from: publicKey1,
            module: 'assets',
            type: 'transfer',
            data: {
              ref: 'tx 07',
              tokenId: 1,
              from: 'owner',
              to: publicKey1,
            },
          },
          {
            transactionHash: transaction.hash,
            from: publicKey1,
            module: 'assets',
            type: 'transfer',
            data: {
              ref: 'tx 08',
              tokenId: 2,
              from: 'owner',
              to: publicKey2,
            },
          },
        ]),
      )
    })
  })
})
