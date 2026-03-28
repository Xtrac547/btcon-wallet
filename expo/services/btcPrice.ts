import { useState, useEffect } from 'react';

let cachedPrice = 100000;
let lastFetch = 0;
const CACHE_DURATION = 60000;

export const fetchBtcPrice = async (): Promise<number> => {
  const now = Date.now();
  if (now - lastFetch < CACHE_DURATION && cachedPrice > 0) {
    return cachedPrice;
  }

  try {
    const response = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=BTC');
    const data = await response.json();
    const eurRate = parseFloat(data.data.rates.EUR);
    cachedPrice = eurRate;
    lastFetch = now;
    return eurRate;
  } catch (error) {
    console.error('Error fetching BTC price:', error);
    return cachedPrice;
  }
};

export const useBtcPrice = () => {
  const [btcPrice, setBtcPrice] = useState(cachedPrice);

  useEffect(() => {
    const updatePrice = async () => {
      const price = await fetchBtcPrice();
      setBtcPrice(price);
    };

    updatePrice();
    const interval = setInterval(updatePrice, CACHE_DURATION);
    return () => clearInterval(interval);
  }, []);

  return btcPrice;
};

export const btconToEuro = (btcon: number, btcPrice: number = cachedPrice): string => {
  const satoshis = (btcon / 100000000) * 100000000;
  const btc = satoshis / 100000000;
  const euro = btc * btcPrice;
  return euro.toFixed(2);
};

export const formatBtconWithEuro = (btcon: number, btcPrice: number = cachedPrice): string => {
  return `${Math.floor(btcon)} Btcon (≈ ${btconToEuro(btcon, btcPrice)} €)`;
};
