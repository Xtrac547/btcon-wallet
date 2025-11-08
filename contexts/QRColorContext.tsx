import { useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';

const DEVELOPER_ADDRESSES = [
  'bc1qdff8680vyy0qthr5vpe3ywzw48r8rr4jn4jvac',
  'bc1qh78w8awednuw3336fnwcnr0sr4q5jxu980eyyd',
];

const generateColorFromAddress = (address: string): string => {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  const saturation = 65 + (Math.abs(hash >> 8) % 20);
  const lightness = 45 + (Math.abs(hash >> 16) % 15);
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const getQRColors = (address: string | null) => {
  if (!address) {
    return { background: '#FFFFFF', qr: '#000000' };
  }
  
  if (DEVELOPER_ADDRESSES.includes(address)) {
    return { background: '#001F3F', qr: '#FFD700' };
  }
  
  const qrColor = generateColorFromAddress(address);
  return { background: '#FFFFFF', qr: qrColor };
};

export const [QRColorProvider, useQRColor] = createContextHook(() => {
  return useMemo(() => ({
    getQRColors,
  }), []);
});
