import type { Config } from 'jest'

export default async (): Promise<Config> => {
  return {
    verbose: true,
    testTimeout: 60000,
  }
}
