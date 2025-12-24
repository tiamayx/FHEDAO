import { expect } from "chai";
import { ethers } from "hardhat";
import { FHEVoting } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * FHEVoting Unit Tests
 * 
 * NOTE: Tests involving FHE operations (createProposal, vote, etc.) require 
 * the FHEVM precompiles which are only available on Sepolia testnet.
 * 
 * These tests validate:
 * 1. Contract deployment
 * 2. Input validation (revert conditions)
 * 3. View function behavior for non-existent data
 * 
 * For full FHE integration testing, deploy to Sepolia and test via frontend.
 */
describe("FHEVoting", function () {
  let voting: FHEVoting;
  let owner: HardhatEthersSigner;
  let voter1: HardhatEthersSigner;
  let voter2: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, voter1, voter2] = await ethers.getSigners();
    
    const FHEVoting = await ethers.getContractFactory("FHEVoting");
    voting = await FHEVoting.deploy();
    await voting.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await voting.getAddress()).to.be.properAddress;
    });

    it("Should initialize with zero proposals", async function () {
      expect(await voting.proposalCount()).to.equal(0);
    });
  });

  describe("Input Validation", function () {
    it("Should reject empty title", async function () {
      await expect(voting.createProposal("", 3600))
        .to.be.revertedWith("Empty title");
    });

    it("Should reject zero duration", async function () {
      await expect(voting.createProposal("Test", 0))
        .to.be.revertedWith("Invalid duration");
    });
  });

  describe("View Functions (No FHE)", function () {
    it("getProposal: Should return exists=false for non-existent proposal", async function () {
      const proposal = await voting.getProposal(999);
      expect(proposal.exists).to.be.false;
      expect(proposal.title).to.equal("");
    });

    it("canDecrypt: Should return false for non-existent proposal", async function () {
      expect(await voting.canDecrypt(999)).to.be.false;
    });

    it("hasVoted: Should return false for any address on non-existent proposal", async function () {
      expect(await voting.hasVoted(999, voter1.address)).to.be.false;
    });

    it("proposalCount: Should be readable", async function () {
      const count = await voting.proposalCount();
      expect(count).to.be.a("bigint");
    });
  });

  describe("Contract Interface", function () {
    it("Should expose all expected functions", async function () {
      expect(voting.createProposal).to.be.a("function");
      expect(voting.vote).to.be.a("function");
      expect(voting.requestDecryptAccess).to.be.a("function");
      expect(voting.getProposal).to.be.a("function");
      expect(voting.getVoteHandles).to.be.a("function");
      expect(voting.canDecrypt).to.be.a("function");
      expect(voting.hasVoted).to.be.a("function");
      expect(voting.proposalCount).to.be.a("function");
    });
  });

  /**
   * FHE Integration Tests (Require Sepolia)
   * 
   * The following tests are skipped in local environment because they require
   * FHEVM precompiles. Run these tests on Sepolia testnet.
   * 
   * To test on Sepolia:
   * 1. Deploy contract: npm run deploy
   * 2. Test via frontend or scripts with real FHE operations
   */
  describe.skip("FHE Operations (Require Sepolia)", function () {
    it("Should create proposal with encrypted vote counters", async function () {
      // Requires FHE.asEuint64() precompile
      await voting.createProposal("Test Proposal", 3600);
      expect(await voting.proposalCount()).to.equal(1);
    });

    it("Should accept encrypted votes", async function () {
      // Requires FHE.fromExternal() precompile
      // Test via frontend with real encryption
    });

    it("Should allow decryption access after proposal ends", async function () {
      // Requires FHE.allow() precompile
    });

    it("Should emit VoteCast event on vote", async function () {
      // Requires full FHE flow
    });
  });
});
