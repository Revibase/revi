import structuredClone from "@ungap/structured-clone";
import { Buffer } from "buffer";
import getRandomValues from "react-native-get-random-values";

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

if (!("structuredClone" in globalThis)) {
  globalThis.structuredClone = structuredClone as any;
}

global.Buffer = Buffer;

// getRandomValues polyfill
class Crypto {
  getRandomValues = getRandomValues;
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
