import structuredClone from "@ungap/structured-clone";
import { Buffer } from "buffer";
import { getRandomValues as expoCryptoGetRandomValues } from "expo-crypto";

global.Buffer = Buffer;
Buffer.prototype.subarray = function subarray(
  begin: number | undefined,
  end: number | undefined
) {
  const result = Uint8Array.prototype.subarray.apply(this, [begin, end]);
  Object.setPrototypeOf(result, Buffer.prototype); // Explicitly add the `Buffer` prototype (adds `readUIntLE`!)
  return result;
};
global.TextEncoder = require("text-encoding").TextEncoder;

class Crypto {
  getRandomValues = expoCryptoGetRandomValues;
}

if (!("structuredClone" in globalThis)) {
  globalThis.structuredClone = structuredClone as any;
}

const webCrypto = typeof crypto !== "undefined" ? crypto : new Crypto();

(() => {
  if (typeof crypto === "undefined") {
    Object.defineProperty(window, "crypto", {
      configurable: true,
      enumerable: true,
      get: () => webCrypto,
    });
  }
})();
