// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint64, ebool, externalEbool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract FHEVoting is ZamaEthereumConfig {
    struct Proposal {
        string title;
        address creator;
        uint256 endTime;
        euint64 yesVotes;
        euint64 noVotes;
        bool exists;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    uint256 public proposalCount;

    event ProposalCreated(uint256 indexed id, string title, address creator, uint256 endTime);
    event VoteCast(uint256 indexed id, address voter);
    event DecryptionAllowed(uint256 indexed id, address user);

    function createProposal(string calldata _title, uint256 _duration) external returns (uint256) {
        require(bytes(_title).length > 0, "Empty title");
        require(_duration > 0, "Invalid duration");

        uint256 id = proposalCount++;
        
        euint64 zero = FHE.asEuint64(0);
        FHE.allowThis(zero);
        
        proposals[id] = Proposal({
            title: _title,
            creator: msg.sender,
            endTime: block.timestamp + _duration,
            yesVotes: zero,
            noVotes: zero,
            exists: true
        });

        // Allow creator to decrypt results
        FHE.allow(proposals[id].yesVotes, msg.sender);
        FHE.allow(proposals[id].noVotes, msg.sender);

        emit ProposalCreated(id, _title, msg.sender, block.timestamp + _duration);
        return id;
    }

    function vote(uint256 _proposalId, externalEbool _encryptedVote, bytes calldata _inputProof) external {
        Proposal storage p = proposals[_proposalId];
        require(p.exists, "Not found");
        require(block.timestamp < p.endTime, "Ended");
        require(!hasVoted[_proposalId][msg.sender], "Voted");

        ebool isYes = FHE.fromExternal(_encryptedVote, _inputProof);
        
        // Conditional increment
        euint64 one = FHE.asEuint64(1);
        p.yesVotes = FHE.select(isYes, FHE.add(p.yesVotes, one), p.yesVotes);
        p.noVotes = FHE.select(isYes, p.noVotes, FHE.add(p.noVotes, one));

        FHE.allowThis(p.yesVotes);
        FHE.allowThis(p.noVotes);
        
        // Allow voter to decrypt results
        FHE.allow(p.yesVotes, msg.sender);
        FHE.allow(p.noVotes, msg.sender);

        hasVoted[_proposalId][msg.sender] = true;
        emit VoteCast(_proposalId, msg.sender);
    }

    // Allow anyone to request decryption permission after proposal ends
    function requestDecryptAccess(uint256 _proposalId) external {
        Proposal storage p = proposals[_proposalId];
        require(p.exists, "Not found");
        require(block.timestamp >= p.endTime, "Not ended");

        // Grant decryption access to caller
        FHE.allow(p.yesVotes, msg.sender);
        FHE.allow(p.noVotes, msg.sender);

        emit DecryptionAllowed(_proposalId, msg.sender);
    }

    function getProposal(uint256 _id) external view returns (
        string memory title,
        address creator,
        uint256 endTime,
        bool exists
    ) {
        Proposal storage p = proposals[_id];
        return (p.title, p.creator, p.endTime, p.exists);
    }

    function getVoteHandles(uint256 _id) external view returns (euint64 yesHandle, euint64 noHandle) {
        Proposal storage p = proposals[_id];
        require(p.exists, "Not found");
        return (p.yesVotes, p.noVotes);
    }

    function canDecrypt(uint256 _id) external view returns (bool) {
        return proposals[_id].exists && block.timestamp >= proposals[_id].endTime;
    }
}
