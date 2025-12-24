# FHEDAO

Private voting for DAOs using Fully Homomorphic Encryption.

Votes are encrypted in-browser, tallied by the smart contract without decryption, and revealed only after the poll ends. No one — including validators — can see how you voted.

## Tech Stack

| Layer | Tech |
|-------|------|
| Contract | Solidity + FHEVM v0.9 |
| Frontend | Next.js 14 + wagmi + RainbowKit |
| FHE SDK | @zama-fhe/relayer-sdk |
| UI | TailwindCSS + Framer Motion |

## Quick Start

```bash
# Frontend
cd frontend && npm i && npm run dev

# Contract (optional - already deployed)
cd contracts && npm i && npm run deploy
```

Open http://localhost:3000

## Contract

| Network | Address | Status |
|---------|---------|--------|
| Sepolia | [`0x73CDEbc0dB65E4468dA8FEE97E546BCF24155C9b`](https://sepolia.etherscan.io/address/0x73CDEbc0dB65E4468dA8FEE97E546BCF24155C9b#code) | ✅ Verified |

## Tests

```bash
cd contracts && npm test
```

```
  FHEVoting
    Deployment
      ✓ Should deploy with zero proposal count
      ✓ Should be at a valid address
    Input Validation
      ✓ Should reject empty title
      ✓ Should reject zero duration
    View Functions
      ✓ Should return false for non-existent proposal
      ✓ Should return empty data for non-existent proposal
      ✓ Should return false for hasVoted on non-existent proposal
      ✓ Should return false for canDecrypt on non-existent proposal
    Contract Interface
      ✓ Should have all expected functions

  9 passing
```

## How It Works

```
User votes YES
      ↓
Browser encrypts → ebool(true)
      ↓
Contract: FHE.select(vote, yesCount+1, yesCount)
      ↓
Stored as euint64 (encrypted)
      ↓
Poll ends → User signs EIP-712
      ↓
Relayer decrypts → "YES: 42, NO: 18"
```

## License

MIT
