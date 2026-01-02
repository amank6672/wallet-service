import Big from 'big.js';

export const toDecimal = (value) =>
  Big(value).round(4).toString();
