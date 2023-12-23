import crypto from 'crypto'

import secp256k1 from 'secp256k1'

import DatasetCarbonCredits from '../carbon-credits/dataset'
import TransactionCarbonCredits from '../carbon-credits/transaction'

const privateKey1 = 'eb8e6e1b2f89b5863b73777855fb160c5fdf0e2d51f92a645ba6c17906e03f6f' // 0459def4fe9d584d115e5cfa1fc9d428ff5a8b23023c094cafb745ad7e53bacc5f184123456558db7168ca7122c5e21348fa4ea4af7a61c9eb4c8ca8c6461b59ac
const publickKey1Compressed = secp256k1.publicKeyCreate(Uint8Array.from(Buffer.from(privateKey1, 'hex')))
const publicKey1 = Buffer.from(secp256k1.publicKeyConvert(publickKey1Compressed, false)).toString('hex')

const privateKey2 = 'b58a3b22e9d5c7248ddcae731703da1f84fd265d370ffb559494c64c54769a3b' // 04c50af7c47a927ba40162144890561a601436f5719cfd5f256a5fd8601d5232b05df1f95a7445ca2290ba9b6b97b686b8c0ab4be8c2109124bdb0af42488debc6
const publickKey2Compressed = secp256k1.publicKeyCreate(Uint8Array.from(Buffer.from(privateKey2, 'hex')))
const publicKey2 = Buffer.from(secp256k1.publicKeyConvert(publickKey2Compressed, false)).toString('hex')

function computeHash(json: string) {
  const hash = crypto.createHash('sha256').update(json).digest()
  return Buffer.from(hash).toString('hex')
}

function signHash(hash: string) {
  const sig = secp256k1.ecdsaSign(
    Uint8Array.from(Buffer.from(hash, 'hex')),
    Uint8Array.from(Buffer.from(privateKey1, 'hex')),
  )
  const signature = { rs: Buffer.from(sig.signature).toString('hex'), recovery: sig.recid }
  return signature.rs
}

describe('TransactionCarbonCredits', () => {
  it('TransactionCarbonCredits', () => {
    // Transaction
    const datasetId = crypto.randomBytes(32).toString('hex')
    const tx = new TransactionCarbonCredits(publicKey1, datasetId)
    tx.init('ref', datasetId, publicKey1)
    tx.addOwner('ref', publicKey2)
    tx.updateMetadata('ref', {
      contract: '',
      name: 'Airimpact Carbon Credit Dataset',
      'asset-description': '',
      'asset-class': 'Carbon Credit',
      'main-location': 'Datachain',
      'supported-locations': ['Ethereum Goerli', 'Ethereum Mainnet'],
      'asset-type': 'Digital Asset',
    })
    tx.mintForwardBatch('ref', 'Batch 1', 10, 50, { description: 'Airimpact Carbon Credit Foward' })
    tx.mintForwardBatch('ref', 'Batch 2', 10, 50, { description: 'Airimpact Carbon Credit Foward' })
    tx.mintCarbonCredits(
      'ref',
      {
        serialStart: 1,
        serialEnd: 3,
        serialFormat: 'VCU-{serialNumber}-TEST',
      },
      {
        description: 'Airimpact Carbon Credit', // Will replace existimg metadata description from mintForwardBatch
        status: 'test',
        vcu: 'TEST',
      },
    )
    tx.transfer('ref', publicKey1, 1)
    tx.transfer('ref', publicKey2, 2)

    // tx.revokeOwner('ref', publicKey1)

    // Hash
    const hashJson = tx.getHashJson()
    const transactionHash = tx.getHash()
    const computedHash = computeHash(hashJson)
    expect(transactionHash).toEqual(computedHash)

    // Sign
    const signature = signHash(transactionHash)
    tx.setSignature(signature)

    // Validate
    const validObj = TransactionCarbonCredits.validateObject(tx)
    expect(validObj).toBeTruthy()

    const validJson = TransactionCarbonCredits.validateJson(tx.getJson())
    expect(validJson).toBeTruthy()
  })
})

describe('DatasetCarbonCredits', () => {
  it('DatasetCarbonCredits', async () => {
    const ds = new DatasetCarbonCredits('QmeAEhExTiNjp7cr2CxUSyDmMMp74xzB2Zwr6aDtFKYUYV')
    await ds.fetchDataset()

    const dataset = ds.getDatasetInfo()
    console.log(dataset)

    const nonces = ds.getNonces()
    console.log(nonces)

    const owners = ds.getOwners()
    console.log(owners)

    const metadata = ds.getMetadata()
    console.log(metadata)

    const batches = ds.getBatches()
    console.log(batches)

    const assets = ds.getAssets()
    console.log(assets)

    const balances = ds.getBalances()
    console.log(balances)

    const events = ds.getEvents()
    console.log(events)

    const verifications = ds.getVerifications()
    console.log(verifications)
    expect(verifications).toEqual(
      expect.arrayContaining([
        {
          transactionHash: 'c6daf85cd5deca5204f69bb8bf537207589ecff84baa44249cc60008b8be2e35',
          timestamp: 1649360485927,
          status: 'success',
          message: 'All assets verified correctly',
        },
      ]),
    )

    const tokensOwner = ds.assetsOf('owner')
    expect(tokensOwner).toEqual(
      expect.arrayContaining([
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
          batchId: 1,
          tokenId: 4,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 1,
          tokenId: 5,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 1,
          tokenId: 6,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 1,
          tokenId: 7,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 1,
          tokenId: 8,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 1,
          tokenId: 9,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 1,
          tokenId: 10,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 2,
          tokenId: 11,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit',
            status: 'carbonCredit',
            vcu: 'VCU-2-TEST',
          },
        },
        {
          batchId: 2,
          tokenId: 12,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 2,
          tokenId: 13,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 2,
          tokenId: 14,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 2,
          tokenId: 15,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 2,
          tokenId: 16,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 2,
          tokenId: 17,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 2,
          tokenId: 18,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 2,
          tokenId: 19,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 2,
          tokenId: 20,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
        {
          batchId: 0,
          tokenId: 21,
          owner: 'owner',
          metadata: {
            description: 'Airimpact Carbon Credit',
            status: 'carbonCredit',
            vcu: 'VCU-3-TEST',
          },
        },
      ]),
    )

    const tokensUser1 = ds.assetsOf(publicKey1)
    expect(tokensUser1).toEqual(
      expect.arrayContaining([
        {
          batchId: 1,
          tokenId: 1,
          owner:
            '0459def4fe9d584d115e5cfa1fc9d428ff5a8b23023c094cafb745ad7e53bacc5f184123456558db7168ca7122c5e21348fa4ea4af7a61c9eb4c8ca8c6461b59ac',
          metadata: {
            description: 'Airimpact Carbon Credit',
            status: 'carbonCredit',
            vcu: 'VCU-1-TEST',
          },
        },
      ]),
    )

    const tokensUser2 = ds.assetsOf(publicKey2)
    expect(tokensUser2).toEqual(
      expect.arrayContaining([
        {
          batchId: 1,
          tokenId: 2,
          owner:
            '04c50af7c47a927ba40162144890561a601436f5719cfd5f256a5fd8601d5232b05df1f95a7445ca2290ba9b6b97b686b8c0ab4be8c2109124bdb0af42488debc6',
          metadata: {
            description: 'Airimpact Carbon Credit Foward',
            status: 'forward',
            vcu: '',
          },
        },
      ]),
    )

    const balanceOwner = ds.balanceOf('owner')
    expect(balanceOwner).toEqual(19)

    const balanceUser1 = ds.balanceOf(publicKey1)
    expect(balanceUser1).toEqual(1)

    const balanceUser2 = ds.balanceOf(publicKey2)
    expect(balanceUser2).toEqual(1)

    const ownerToken1 = ds.ownerOf(1)
    expect(ownerToken1).toEqual(
      '0459def4fe9d584d115e5cfa1fc9d428ff5a8b23023c094cafb745ad7e53bacc5f184123456558db7168ca7122c5e21348fa4ea4af7a61c9eb4c8ca8c6461b59ac',
    )

    const ownerToken2 = ds.ownerOf(2)
    expect(ownerToken2).toEqual(
      '04c50af7c47a927ba40162144890561a601436f5719cfd5f256a5fd8601d5232b05df1f95a7445ca2290ba9b6b97b686b8c0ab4be8c2109124bdb0af42488debc6',
    )

    const ownerToken3 = ds.ownerOf(3)
    expect(ownerToken3).toEqual('owner')

    const metadataToken1 = ds.metadataOf(1)
    expect(metadataToken1).toEqual({
      description: 'Airimpact Carbon Credit',
      status: 'carbonCredit',
      vcu: 'VCU-1-TEST',
    })

    const metadataToken2 = ds.metadataOf(2)
    expect(metadataToken2).toEqual({
      description: 'Airimpact Carbon Credit Foward',
      status: 'forward',
      vcu: '',
    })

    const metadataToken3 = ds.metadataOf(3)
    expect(metadataToken3).toEqual({
      description: 'Airimpact Carbon Credit Foward',
      status: 'forward',
      vcu: '',
    })

    // await ds.fetchDatasetHistory()

    // const claims = ds.getClaims()
    // expect(claims).toEqual(
    //   expect.arrayContaining([
    //     {
    //       timestamp: 1683789818,
    //       claimCID: 'bafyreihzlmrvmfqennjtn7myhgkjinyj6bzd7jm64c5biokchk6vcshtpy',
    //       submitter:
    //         '0xa28574a2fe648da4e38fff3b8666dd0e8807c3a34de7a27c639d8a26f8d454c2f35bf321cba02ca13d6e75f35714a384',
    //       canSeal: true,
    //       isPermanentlyUnsealable: false,
    //     },
    //     {
    //       timestamp: 1683790126,
    //       claimCID: 'bafyreifv4tfabgm746twhmjjmuxa4pmdf5nt5w4gvylaxohc5t4cxucpdi',
    //       submitter:
    //         '0xa28574a2fe648da4e38fff3b8666dd0e8807c3a34de7a27c639d8a26f8d454c2f35bf321cba02ca13d6e75f35714a384',
    //       canSeal: true,
    //       isPermanentlyUnsealable: false,
    //     },
    //   ]),
    // )

    // const ethereumTransactionData = ds.getEthereumTransactionData()
    // expect(ethereumTransactionData).toEqual(
    //   expect.arrayContaining([
    //     {
    //       transactionHashL2: '0x5ebee3a9686f06bffb448133eeffa6f267520ec131bd10b3ed1e84e010f1b838',
    //       batchNumberL2: 59361,
    //       blockNumberL2: 19361821,
    //       transactionHashL1: '0xbcb2bf0dd7884f77bbf890900689ef209a503f6e1eb1a238ef5704da31b4e366',
    //       blockNumberL1: 8980139,
    //     },
    //     {
    //       transactionHashL2: '0x0bd7136c7f568856912a5eaf47b1e48142987ae91a605c51b80e07ac61df3cca',
    //       batchNumberL2: 59363,
    //       blockNumberL2: 19362910,
    //       transactionHashL1: '0xfd8518a4c0802350d26d507cde690025ff4c0d668e69d439fe35d54aa3e73f84',
    //       blockNumberL1: 8980167,
    //     },
    //   ]),
    // )

    // const datasetHistory = ds.getDatasetHistory()
    // expect(datasetHistory).toEqual(
    //   expect.arrayContaining([
    //     {
    //       verification: {
    //         transactionHash: '',
    //         timestamp: 1683789758371,
    //         status: 'success',
    //         message: 'All assets verified correctly',
    //       },
    //       claim: {
    //         timestamp: 1683789818,
    //         claimCID: 'bafyreihzlmrvmfqennjtn7myhgkjinyj6bzd7jm64c5biokchk6vcshtpy',
    //         submitter:
    //           '0xa28574a2fe648da4e38fff3b8666dd0e8807c3a34de7a27c639d8a26f8d454c2f35bf321cba02ca13d6e75f35714a384',
    //         canSeal: true,
    //         isPermanentlyUnsealable: false,
    //       },
    //       ethereumTransactionData: {
    //         transactionHashL2: '0x5ebee3a9686f06bffb448133eeffa6f267520ec131bd10b3ed1e84e010f1b838',
    //         batchNumberL2: 59361,
    //         blockNumberL2: 19361821,
    //         transactionHashL1: '0xbcb2bf0dd7884f77bbf890900689ef209a503f6e1eb1a238ef5704da31b4e366',
    //         blockNumberL1: 8980139,
    //       },
    //     },
    //     {
    //       verification: {
    //         transactionHash: '1b6f0fd9a8d35f2cee1a4e607baa816cdb61f97ff222d2c79a6446d229e3e310',
    //         timestamp: 1683790111848,
    //         status: 'success',
    //         message: 'All assets verified correctly',
    //       },
    //       claim: {
    //         timestamp: 1683790126,
    //         claimCID: 'bafyreifv4tfabgm746twhmjjmuxa4pmdf5nt5w4gvylaxohc5t4cxucpdi',
    //         submitter:
    //           '0xa28574a2fe648da4e38fff3b8666dd0e8807c3a34de7a27c639d8a26f8d454c2f35bf321cba02ca13d6e75f35714a384',
    //         canSeal: true,
    //         isPermanentlyUnsealable: false,
    //       },
    //       ethereumTransactionData: {
    //         transactionHashL2: '0x0bd7136c7f568856912a5eaf47b1e48142987ae91a605c51b80e07ac61df3cca',
    //         batchNumberL2: 59363,
    //         blockNumberL2: 19362910,
    //         transactionHashL1: '0xfd8518a4c0802350d26d507cde690025ff4c0d668e69d439fe35d54aa3e73f84',
    //         blockNumberL1: 8980167,
    //       },
    //     },
    //   ]),
    // )
  })
})
