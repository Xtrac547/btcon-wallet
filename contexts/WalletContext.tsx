import { useEffect, useState, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import * as bip39 from 'bip39';
import { BIP32Factory } from 'bip32';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from '@bitcoinerlab/secp256k1';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { EsploraService, UTXO } from '@/services/esplora';

bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);

const STORAGE_KEYS = {
  MNEMONIC: 'btcon_mnemonic',
  IS_TESTNET: 'btcon_is_testnet',
  HAS_WALLET: 'btcon_has_wallet',
};

interface WalletState {
  mnemonic: string | null;
  address: string | null;
  balance: number;
  utxos: UTXO[];
  isTestnet: boolean;
  isLoading: boolean;
  hasWallet: boolean;
}

export const [WalletProvider, useWallet] = createContextHook(() => {
  const [state, setState] = useState<WalletState>({
    mnemonic: null,
    address: null,
    balance: 0,
    utxos: [],
    isTestnet: false,
    isLoading: true,
    hasWallet: false,
  });

  const [esploraService] = useState(() => new EsploraService(false));

  const secureStorageAvailable = Platform.OS !== 'web';

  const storeSecurely = async (key: string, value: string) => {
    if (secureStorageAvailable) {
      await SecureStore.setItemAsync(key, value);
    } else {
      const encrypted = btoa(value);
      await AsyncStorage.setItem(key, encrypted);
    }
  };

  const getSecurely = async (key: string): Promise<string | null> => {
    if (secureStorageAvailable) {
      return await SecureStore.getItemAsync(key);
    } else {
      const encrypted = await AsyncStorage.getItem(key);
      if (encrypted) {
        try {
          return atob(encrypted);
        } catch {
          return null;
        }
      }
      return null;
    }
  };

  const deleteSecurely = async (key: string) => {
    if (secureStorageAvailable) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  };

  const getNetwork = (isTestnet: boolean) => {
    return isTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
  };

  const deriveAddressFromMnemonic = (mnemonic: string, isTestnet: boolean): string => {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const network = getNetwork(isTestnet);
    const root = bip32.fromSeed(seed, network);
    
    const path = isTestnet ? "m/84'/1'/0'/0/0" : "m/84'/0'/0'/0/0";
    const child = root.derivePath(path);
    
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: child.publicKey,
      network,
    });

    if (!address) {
      throw new Error('Failed to derive address');
    }

    return address;
  };

  const createWallet = async (): Promise<string> => {
    console.log('Creating new wallet...');
    const mnemonic = bip39.generateMnemonic(128);
    const address = deriveAddressFromMnemonic(mnemonic, state.isTestnet);

    await storeSecurely(STORAGE_KEYS.MNEMONIC, mnemonic);
    await AsyncStorage.setItem(STORAGE_KEYS.HAS_WALLET, 'true');

    setState(prev => ({
      ...prev,
      mnemonic,
      address,
      hasWallet: true,
    }));

    console.log('Wallet created:', { address });
    return mnemonic;
  };

  const restoreWallet = async (mnemonic: string): Promise<void> => {
    console.log('Restoring wallet...');
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    const address = deriveAddressFromMnemonic(mnemonic, state.isTestnet);

    await storeSecurely(STORAGE_KEYS.MNEMONIC, mnemonic);
    await AsyncStorage.setItem(STORAGE_KEYS.HAS_WALLET, 'true');

    setState(prev => ({
      ...prev,
      mnemonic,
      address,
      hasWallet: true,
    }));

    console.log('Wallet restored:', { address });
    await refreshBalance();
  };

  const deleteWallet = async (): Promise<void> => {
    console.log('Deleting wallet...');
    await deleteSecurely(STORAGE_KEYS.MNEMONIC);
    await AsyncStorage.removeItem(STORAGE_KEYS.HAS_WALLET);

    setState(prev => ({
      ...prev,
      mnemonic: null,
      address: null,
      balance: 0,
      utxos: [],
      hasWallet: false,
    }));
  };

  const refreshBalance = useCallback(async () => {
    if (!state.address) return;

    console.log('Refreshing balance for:', state.address);
    try {
      const utxos = await esploraService.getAddressUTXOs(state.address);
      const balance = utxos.reduce((sum, utxo) => sum + utxo.value, 0);

      setState(prev => ({
        ...prev,
        balance,
        utxos,
      }));

      console.log('Balance updated:', { balance, utxoCount: utxos.length });
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  }, [state.address]);

  const switchNetwork = async (isTestnet: boolean) => {
    console.log('Switching network to:', isTestnet ? 'testnet' : 'mainnet');
    
    esploraService.setNetwork(isTestnet);
    await AsyncStorage.setItem(STORAGE_KEYS.IS_TESTNET, isTestnet ? 'true' : 'false');

    setState(prev => ({
      ...prev,
      isTestnet,
    }));

    if (state.mnemonic) {
      const newAddress = deriveAddressFromMnemonic(state.mnemonic, isTestnet);
      setState(prev => ({
        ...prev,
        address: newAddress,
      }));

      setTimeout(() => refreshBalance(), 100);
    }
  };

  const signAndBroadcastTransaction = async (
    toAddress: string,
    amountSats: number,
    feeRate?: number
  ): Promise<string> => {
    if (!state.mnemonic || !state.address) {
      throw new Error('Wallet not initialized');
    }

    console.log('Creating transaction:', { toAddress, amountSats, feeRate });

    const utxos = await esploraService.getAddressUTXOs(state.address);
    if (utxos.length === 0) {
      throw new Error('No UTXOs available');
    }

    const network = getNetwork(state.isTestnet);
    const psbt = new bitcoin.Psbt({ network });

    const seed = bip39.mnemonicToSeedSync(state.mnemonic);
    const root = bip32.fromSeed(seed, network);
    const path = state.isTestnet ? "m/84'/1'/0'/0/0" : "m/84'/0'/0'/0/0";
    const child = root.derivePath(path);

    let inputSum = 0;
    for (const utxo of utxos) {
      const tx = await esploraService.getTransaction(utxo.txid);
      if (!tx) continue;

      const nonWitnessUtxo = await fetch(`${state.isTestnet ? 'https://blockstream.info/testnet/api' : 'https://blockstream.info/api'}/tx/${utxo.txid}/hex`)
        .then(res => res.text())
        .then(hex => Buffer.from(hex, 'hex'));

      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        nonWitnessUtxo,
      });

      inputSum += utxo.value;

      if (inputSum >= amountSats + 1000) break;
    }

    const estimatedFee = feeRate ? psbt.txInputs.length * 68 + 2 * 31 + 10 * feeRate : 1000;
    const change = inputSum - amountSats - estimatedFee;

    if (change < 0) {
      throw new Error('Insufficient funds');
    }

    psbt.addOutput({
      address: toAddress,
      value: BigInt(amountSats),
    });

    if (change > 546) {
      psbt.addOutput({
        address: state.address,
        value: BigInt(change),
      });
    }

    for (let i = 0; i < psbt.txInputs.length; i++) {
      psbt.signInput(i, child);
    }

    psbt.finalizeAllInputs();

    const txHex = psbt.extractTransaction().toHex();
    console.log('Transaction signed:', { txHex });

    const txid = await esploraService.broadcastTransaction(txHex);
    console.log('Transaction broadcast:', { txid });

    setTimeout(() => refreshBalance(), 2000);

    return txid;
  };

  const loadWallet = async () => {
    console.log('Loading wallet from storage...');
    try {
      const hasWallet = await AsyncStorage.getItem(STORAGE_KEYS.HAS_WALLET);
      const isTestnetStr = await AsyncStorage.getItem(STORAGE_KEYS.IS_TESTNET);
      const isTestnet = isTestnetStr === 'true';

      esploraService.setNetwork(isTestnet);

      if (hasWallet === 'true') {
        const mnemonic = await getSecurely(STORAGE_KEYS.MNEMONIC);
        
        if (mnemonic) {
          const address = deriveAddressFromMnemonic(mnemonic, isTestnet);

          setState(prev => ({
            ...prev,
            mnemonic,
            address,
            isTestnet,
            hasWallet: true,
            isLoading: false,
          }));

          console.log('Wallet loaded:', { address, isTestnet });
          
          setTimeout(async () => {
            const utxos = await esploraService.getAddressUTXOs(address);
            const balance = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
            setState(prev => ({ ...prev, balance, utxos }));
          }, 100);

          return;
        }
      }

      setState(prev => ({
        ...prev,
        isTestnet,
        isLoading: false,
      }));

      console.log('No wallet found');
    } catch (error) {
      console.error('Error loading wallet:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  return {
    ...state,
    createWallet,
    restoreWallet,
    deleteWallet,
    refreshBalance,
    switchNetwork,
    signAndBroadcastTransaction,
    esploraService,
  };
});
