import { AID } from "utils/consts";

export const selectApplet = [
  0x00, // CLA
  0xa4, // INS
  0x04, // P1
  0x00, // P2
  0x10, // Lc (Payload length)
  ...AID,
  0x00,
];
