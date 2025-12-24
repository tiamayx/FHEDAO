"use client";

let instance: any = null;
let isInitialized = false;
let isInitializing = false;
let initError: string | null = null;

function toHex(arr: Uint8Array): `0x${string}` {
  return `0x${Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;
}

function withTimeout<T>(promise: Promise<T>, ms: number, msg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(msg)), ms)
    ),
  ]);
}

export async function initFhevm(): Promise<any> {
  if (typeof window === "undefined") {
    throw new Error("FHEVM can only be initialized in browser");
  }

  if (instance && isInitialized) return instance;
  if (initError) throw new Error(initError);

  if (isInitializing) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Init timeout"));
      }, 30000);
      
      const check = setInterval(() => {
        if (isInitialized && instance) {
          clearInterval(check);
          clearTimeout(timeout);
          resolve(instance);
        }
        if (initError) {
          clearInterval(check);
          clearTimeout(timeout);
          reject(new Error(initError));
        }
      }, 100);
    });
  }

  isInitializing = true;

  try {
    const { initSDK, createInstance, SepoliaConfig } = await import(
      "@zama-fhe/relayer-sdk/web"
    );
    
    await withTimeout(
      initSDK({ thread: 0 }),
      15000,
      "initSDK timeout"
    );
    
    instance = await withTimeout(
      createInstance(SepoliaConfig),
      15000,
      "createInstance timeout"
    );
    
    isInitialized = true;
    return instance;
  } catch (error: any) {
    initError = error.message || "Failed to initialize FHEVM";
    throw error;
  } finally {
    isInitializing = false;
  }
}

export async function encryptVote(
  contractAddress: string,
  userAddress: string,
  isYes: boolean
): Promise<{ handle: `0x${string}`; inputProof: `0x${string}` }> {
  const fhevm = await initFhevm();
  const input = fhevm.createEncryptedInput(contractAddress, userAddress);
  input.addBool(isYes);

  const encrypted = await input.encrypt();
  return {
    handle: toHex(encrypted.handles[0]),
    inputProof: toHex(encrypted.inputProof),
  };
}

export async function userDecryptMultiple(
  handles: string[],
  contractAddress: string,
  signer: any
): Promise<bigint[]> {
  const fhevm = await initFhevm();

  const userAddress =
    typeof signer.getAddress === "function"
      ? await signer.getAddress()
      : signer.account?.address;

  if (!userAddress) {
    throw new Error("Cannot get user address from signer");
  }

  const { publicKey, privateKey } = fhevm.generateKeypair();
  const eip712 = fhevm.createEIP712(publicKey, [contractAddress]);

  const startTimestamp = eip712.message.startTimestamp ?? Math.floor(Date.now() / 1000);
  const durationDays = eip712.message.durationDays ?? 1;

  const message = {
    ...eip712.message,
    startTimestamp: BigInt(startTimestamp),
    durationDays: BigInt(durationDays),
  };

  const signature = await signer.signTypedData({
    domain: eip712.domain,
    types: eip712.types,
    primaryType: eip712.primaryType,
    message: message,
  });

  const publicKeyStr = publicKey instanceof Uint8Array ? toHex(publicKey) : publicKey;
  const privateKeyStr = privateKey instanceof Uint8Array ? toHex(privateKey) : privateKey;

  const handleContractPairs = handles.map(handle => ({ handle, contractAddress }));

  const results = await fhevm.userDecrypt(
    handleContractPairs,
    privateKeyStr,
    publicKeyStr,
    signature,
    [contractAddress],
    userAddress,
    String(startTimestamp),
    String(durationDays)
  );

  return handles.map(handle => {
    const value = results[handle];
    if (value === undefined) {
      throw new Error(`No decrypted value found for handle ${handle}`);
    }
    return BigInt(value);
  });
}

export async function userDecrypt(
  handle: string,
  contractAddress: string,
  signer: any
): Promise<bigint> {
  const [value] = await userDecryptMultiple([handle], contractAddress, signer);
  return value;
}

export function isFhevmReady(): boolean {
  return isInitialized && instance !== null;
}

export function getFhevmError(): string | null {
  return initError;
}

export function resetFhevm(): void {
  instance = null;
  isInitialized = false;
  isInitializing = false;
  initError = null;
}
