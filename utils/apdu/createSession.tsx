import {AUTHENTICATION_ID} from '../consts';

export const createSession = [
  0x80,
  0x04,
  0x00,
  0x1b,
  0x06,
  0x41,
  0x04,
  ...AUTHENTICATION_ID,
  0x08,
];
