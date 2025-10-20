export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  status: {
    confirmed: boolean;
    block_height?: number;
  };
}

export interface Transaction {
  txid: string;
  version: number;
  locktime: number;
  vin: Array<{
    txid: string;
    vout: number;
    prevout: {
      scriptpubkey: string;
      scriptpubkey_address: string;
      value: number;
    };
  }>;
  vout: Array<{
    scriptpubkey: string;
    scriptpubkey_address: string;
    value: number;
  }>;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_time?: number;
  };
}

export class EsploraService {
  private baseUrl: string;

  constructor(isTestnet: boolean = false) {
    this.baseUrl = isTestnet
      ? 'https://blockstream.info/testnet/api'
      : 'https://blockstream.info/api';
  }

  setNetwork(isTestnet: boolean) {
    this.baseUrl = isTestnet
      ? 'https://blockstream.info/testnet/api'
      : 'https://blockstream.info/api';
  }

  async getAddressUTXOs(address: string): Promise<UTXO[]> {
    try {
      const response = await fetch(`${this.baseUrl}/address/${address}/utxo`);
      if (!response.ok) {
        throw new Error(`Failed to fetch UTXOs: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching UTXOs:', error);
      return [];
    }
  }

  async getAddressTransactions(address: string): Promise<Transaction[]> {
    try {
      const response = await fetch(`${this.baseUrl}/address/${address}/txs`);
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  async getTransaction(txid: string): Promise<Transaction | null> {
    try {
      const response = await fetch(`${this.baseUrl}/tx/${txid}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch transaction: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }
  }

  async broadcastTransaction(txHex: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/tx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: txHex,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Broadcast failed: ${errorText}`);
      }

      return await response.text();
    } catch (error) {
      console.error('Error broadcasting transaction:', error);
      throw error;
    }
  }

  async getFeeEstimate(): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/fee-estimates`);
      if (!response.ok) {
        return 2;
      }
      const fees = await response.json();
      return fees['6'] || 2;
    } catch (error) {
      console.error('Error fetching fee estimate:', error);
      return 2;
    }
  }

  getExplorerUrl(txid: string): string {
    return this.baseUrl.replace('/api', '') + `/tx/${txid}`;
  }

  getAddressExplorerUrl(address: string): string {
    return this.baseUrl.replace('/api', '') + `/address/${address}`;
  }
}
