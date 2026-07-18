// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title PropertyToken
/// @notice ERC-20 token koji predstavlja frakciono vlasništvo nad jednom
/// nekretninom registrovanom u PropertyNFT ugovoru. Ukupna emisija tokena
/// predstavlja 100% vlasništva nad tom nekretninom. Prihod (npr. zakupnina)
/// se unosi kroz depositRevenue() i raspodjeljuje proporcionalno broju
/// tokena koje svaki investitor posjeduje, koristeći "pull" model isplate
/// (withdrawEarnings) radi sigurnosti i optimizacije gas troškova.
contract PropertyToken is ERC20, Ownable {
    uint256 public immutable propertyId; // referenca na tokenId u PropertyNFT ugovoru

    uint256 public totalRevenueDeposited;
    uint256 private _revenuePerTokenScaled; // skalirano sa 1e18 radi preciznosti

    mapping(address => uint256) private _revenuePerTokenPaid;
    mapping(address => uint256) private _pendingWithdrawal;

    uint256 private constant PRECISION = 1e18;

    event RevenueDeposited(uint256 amount, uint256 newTotalRevenue);
    event EarningsWithdrawn(address indexed investor, uint256 amount);

    constructor(
        uint256 _propertyId,
        string memory name_,
        string memory symbol_,
        uint256 totalShares,
        address initialOwner
    ) ERC20(name_, symbol_) Ownable(initialOwner) {
        propertyId = _propertyId;
        _mint(initialOwner, totalShares);
    }

    /// @notice Administrator/vlasnik nekretnine unosi prihod (npr. zakupninu) u sistem.
    /// Iznos se šalje kao ETH uz transakciju.
    function depositRevenue() external payable onlyOwner {
        require(msg.value > 0, "PropertyToken: iznos mora biti > 0");
        require(totalSupply() > 0, "PropertyToken: nema izdatih tokena");

        _revenuePerTokenScaled += (msg.value * PRECISION) / totalSupply();
        totalRevenueDeposited += msg.value;

        emit RevenueDeposited(msg.value, totalRevenueDeposited);
    }

    /// @notice Vraća iznos koji investitor može podići u ovom trenutku.
    function earningsOf(address investor) public view returns (uint256) {
        uint256 owed = (balanceOf(investor) *
            (_revenuePerTokenScaled - _revenuePerTokenPaid[investor])) / PRECISION;
        return _pendingWithdrawal[investor] + owed;
    }

    /// @notice Investitor povlači svoj akumulirani prihod.
    function withdrawEarnings() external {
        _settleAccount(msg.sender);

        uint256 amount = _pendingWithdrawal[msg.sender];
        require(amount > 0, "PropertyToken: nema sredstava za povlacenje");

        _pendingWithdrawal[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "PropertyToken: transfer neuspjesan");

        emit EarningsWithdrawn(msg.sender, amount);
    }

    /// @dev Prije svakog transfera tokena, "obračunava" prihod dosadašnjeg
    /// vlasnika da ne izgubi svoj udio u prihodu prilikom prodaje tokena.
    function _update(address from, address to, uint256 value) internal override {
        if (from != address(0)) _settleAccount(from);
        if (to != address(0)) _settleAccount(to);
        super._update(from, to, value);
    }

    function _settleAccount(address account) private {
        uint256 owed = (balanceOf(account) *
            (_revenuePerTokenScaled - _revenuePerTokenPaid[account])) / PRECISION;
        _pendingWithdrawal[account] += owed;
        _revenuePerTokenPaid[account] = _revenuePerTokenScaled;
    }
}