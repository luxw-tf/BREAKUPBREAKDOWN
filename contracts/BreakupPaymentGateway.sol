// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BreakupPaymentGateway
 * @notice x402-compatible payment gateway for BreakupBreakdown AI agent services.
 *         Users pay MON to unlock smart contract vulnerability scanning.
 */
contract BreakupPaymentGateway {
    address public owner;
    uint256 public scanPrice;

    struct Payment {
        address payer;
        uint256 amount;
        uint256 timestamp;
    }

    Payment[] public payments;
    mapping(address => uint256) public totalPaidBy;

    event PaymentReceived(
        address indexed payer,
        uint256 amount,
        uint256 timestamp,
        uint256 paymentIndex
    );

    event ScanPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event FundsWithdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor(uint256 _scanPrice) {
        owner = msg.sender;
        scanPrice = _scanPrice;
    }

    /**
     * @notice Pay for an AI agent scan. Called by the frontend when the x402
     *         402 Payment Required response is received.
     */
    function payForScan() external payable {
        require(msg.value >= scanPrice, "Insufficient payment");

        uint256 idx = payments.length;
        payments.push(Payment({
            payer: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp
        }));

        totalPaidBy[msg.sender] += msg.value;

        emit PaymentReceived(msg.sender, msg.value, block.timestamp, idx);
    }

    /**
     * @notice Update the price required per scan.
     */
    function setScanPrice(uint256 _newPrice) external onlyOwner {
        uint256 oldPrice = scanPrice;
        scanPrice = _newPrice;
        emit ScanPriceUpdated(oldPrice, _newPrice);
    }

    /**
     * @notice Withdraw collected funds to the owner wallet.
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdrawal failed");

        emit FundsWithdrawn(owner, balance);
    }

    /**
     * @notice Get total number of payments recorded.
     */
    function getPaymentCount() external view returns (uint256) {
        return payments.length;
    }

    /**
     * @notice Transfer ownership of the gateway.
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }

    receive() external payable {
        // Accept direct transfers
    }
}
