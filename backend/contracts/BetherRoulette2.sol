pragma solidity ^0.4.24;

// * BetherRoulette.win - fair games that pay Ether. Version 5.
////
// * Uses hybrid commit-reveal + block hash random number generation that is immune
//   to tampering by players, house and miners. Apart from being fully transparent,
//   this also allows arbitrarily high bets.
//
contract BetherRoulette2 {
    /// *** Constants section

    // Each bet is deducted 1% in favour of the house, but no less than some minimum.
    // The lower bound is dictated by gas costs of the settleBet transaction, providing
    // headroom for up to 10 Gwei prices.
    uint constant HOUSE_EDGE_PERCENT = 1;
    uint constant HOUSE_EDGE_MINIMUM_AMOUNT = 0.0003 ether;

    // Bets lower than this amount do not participate in jackpot rolls (and are
    // not deducted JACKPOT_FEE).
    uint constant MIN_JACKPOT_BET = 0.1 ether;

    // Chance to win jackpot (currently 0.1%) and fee deducted into jackpot fund.
    uint constant JACKPOT_MODULO = 1000;
    uint constant JACKPOT_FEE = 0.001 ether;

    // There is minimum and maximum bets.
    uint constant MIN_BET = 0.01 ether;
    uint constant MAX_AMOUNT = 300000 ether;
    uint constant ROULETTE_CREDIT_DELTA = 10000000000000000;
    uint constant ROUTETTE_MAX_AMOUNT_PART = 655350000000000000000 wei;

    // Modulo is a number of equiprobable outcomes in a game:
    //  - 2 for coin flip
    //  - 6 for dice
    //  - 6*6 = 36 for double dice
    //  - 100 for etheroll
    //  - 36 for roulette
    //  - 101 for roulette multi play mode
    //  etc.
    // It's called so because 256-bit entropy is treated like a huge integer and
    // the remainder of its division by modulo is considered bet outcome.
    uint constant MAX_MODULO = 101;

    // For modulos below this threshold rolls are checked against a bit mask,
    // thus allowing betting on any combination of outcomes. For example, given
    // modulo 6 for dice, 101000 mask (base-2, big endian) means betting on
    // 4 and 6; for games with modulos higher than threshold (Etheroll), a simple
    // limit is used, allowing betting on any outcome in [0, N) range.
    //
    // The specific value is dictated by the fact that 256-bit intermediate
    // multiplication result allows implementing population count efficiently
    // for numbers that are up to 42 bits, and 40 is the highest multiple of
    // eight below 42.
    uint constant MAX_MASK_MODULO = 40;

    uint8 constant MODULO_ROULETTE_MULIMODE = 101;

    // This is a check on bet mask overflow.
    uint constant MAX_BET_MASK = 2 ** MAX_MASK_MODULO;

    // EVM BLOCKHASH opcode can query no further than 256 blocks into the
    // past. Given that settleBet uses block hash of placeBet as one of
    // complementary entropy sources, we cannot process bets older than this
    // threshold. On rare occasions dice2.win croupier may fail to invoke
    // settleBet in this timespan due to technical issues or extreme Ethereum
    // congestion; such bets can be refunded via invoking refundBet.
    uint constant BET_EXPIRATION_BLOCKS = 250;

    uint constant MASK_ROULETTE_MULTIPLAY = 0xffffffffff;
    // Standard contract ownership transfer.
    address public owner;
    address private nextOwner;

    // Adjustable max bet profit. Used to cap bets against dynamic odds.
    uint public maxProfit;

    // The address corresponding to a private key used to sign placeBet commits.
    address public secretSigner;

    // Accumulated jackpot fund.
    uint128 public jackpotSize;

    // Funds that are locked in potentially winning bets. Prevents contract from
    // committing to bets it cannot pay out.
    uint128 public lockedInBets;

    // A structure representing a single bet.
    struct Bet {

        // Modulo of a game.
        uint8 modulo;
        // Number of winning outcomes, used to compute winning payment (* modulo/rollUnder),
        // and used instead of mask for games with modulo > MAX_MASK_MODULO.
        uint8 rollUnder;
        // Block number of placeBet tx.
        uint40 placeBlockNumber;
        // Bit mask representing winning bet outcomes (see MAX_MASK_MODULO comment).
        uint mask;
        uint creditMask;
        // Wager amount in wei.
        uint amount;
        // Address of a gambler, used to pay out winning bets.
        address gambler;
    }

    // Mapping from commits to all currently active & processed bets.
    mapping (uint => Bet) bets;

    // Croupier account.
    address public croupier;

    // Events that are issued to make statistic recovery easier.
    event FailedPayment(address indexed beneficiary, uint amount);
    event Payment(address indexed beneficiary, uint amount);
    event JackpotPayment(address indexed beneficiary, uint amount);

    // This event is emitted in placeBet to record commit in the logs.
    event Commit(uint commit);
    event SpinResult(uint commit, uint result, uint amount);

    // Constructor. Deliberately does not take any parameters.
    constructor () public {
        owner = msg.sender;
        secretSigner = msg.sender;
        croupier = msg.sender;
    }

    // Standard modifier on methods invokable only by contract owner.
    modifier onlyOwner {
        require (msg.sender == owner, "OnlyOwner methods called by non-owner.");
        _;
    }

    // Standard modifier on methods invokable only by contract owner.
    modifier onlyCroupier {
        require (msg.sender == croupier, "OnlyCroupier methods called by non-croupier.");
        _;
    }

    // Standard contract ownership transfer implementation,
    function approveNextOwner(address _nextOwner) external onlyOwner {
        require     (_nextOwner != owner, "Cannot approve current owner.");
        nextOwner = _nextOwner;
    }

    function acceptNextOwner() external {
        require (msg.sender == nextOwner, "Can only accept preapproved new owner.");
        owner = nextOwner;
    }

    // Fallback function deliberately left empty. It's primary use case
    // is to top up the bank roll.
    function () public payable {
    }

    // See comment for "secretSigner" variable.
    function setSecretSigner(address newSecretSigner) external onlyOwner {
        secretSigner = newSecretSigner;
    }

    // Change the croupier address.
    function setCroupier(address newCroupier) external onlyOwner {
        croupier = newCroupier;
    }

    // Change max bet reward. Setting this to zero effectively disables betting.
    function setMaxProfit(uint _maxProfit) public onlyOwner {
        require (_maxProfit < MAX_AMOUNT, "maxProfit should be a sane number.");
        maxProfit = _maxProfit;
    }

    // This function is used to bump up the jackpot fund. Cannot be used to lower it.
    function increaseJackpot(uint increaseAmount) external onlyOwner {
        require (increaseAmount <= address(this).balance, "Increase amount larger than balance.");
        require (jackpotSize + lockedInBets + increaseAmount <= address(this).balance, "Not enough funds.");
        jackpotSize += uint128(increaseAmount);
    }

    // Funds withdrawal to cover costs of dice2.win operation.
    function withdrawFunds(address beneficiary, uint withdrawAmount) external onlyOwner {
        require (withdrawAmount <= address(this).balance, "Increase amount larger than balance.");
        require (jackpotSize + lockedInBets + withdrawAmount <= address(this).balance, "Not enough funds.");
        sendFunds(beneficiary, withdrawAmount, withdrawAmount);
    }

    // Contract may be destroyed only when there are no ongoing bets,
    // either settled or refunded. All funds are transferred to contract owner.
    function kill() external onlyOwner {
        require (lockedInBets == 0, "All bets should be processed (settled or refunded) before self-destruct.");
        selfdestruct(owner);
    }

    /// *** Betting logic

    // Bet states:
    //  amount == 0 && gambler == 0 - 'clean' (can place a bet)
    //  amount != 0 && gambler != 0 - 'active' (can be settled or refunded)
    //  amount == 0 && gambler != 0 - 'processed' (can clean storage)
    //
    //  NOTE: Storage cleaning is not implemented in this contract version; it will be added
    //        with the next upgrade to prevent polluting Ethereum state with expired bets.

    // Bet placing transaction - issued by the player.
    //  betMask         - bet outcomes bit mask for modulo <= MAX_MASK_MODULO,
    //                    [0, betMask) for larger modulos.
    //  creditMask      - mask to identify bet mask and credit numbers for roulette game.
    //  modulo          - game modulo.
    //  commitLastBlock - number of the maximum block where "commit" is still considered valid.
    //  commit          - Keccak256 hash of some secret "reveal" random number, to be supplied
    //                    by the dice2.win croupier bot in the settleBet transaction. Supplying
    //                    "commit" ensures that "reveal" cannot be changed behind the scenes
    //                    after placeBet have been mined.
    //  r, s            - components of ECDSA signature of (commitLastBlock, commit). v is
    //                    guaranteed to always equal 27.
    //
    // Commit, being essentially random 256-bit number, is used as a unique bet identifier in
    // the 'bets' mapping.
    //
    // Commits are signed with a block limit to ensure that they are used at most once - otherwise
    // it would be possible for a miner to place a bet with a known commit/reveal pair and tamper
    // with the blockhash. Croupier guarantees that commitLastBlock will always be not greater than
    // placeBet block number plus BET_EXPIRATION_BLOCKS. See whitepaper for details.
    function placeBet(uint betMask, uint creditMask, uint modulo, uint commitLastBlock, uint commit, bytes32 r, bytes32 s) external payable {
        // Check that the bet is in 'clean' state.
        Bet storage bet = bets[commit];
        require (bet.gambler == address(0), "Bet should be in a 'clean' state.");

        // Validate input data ranges.
        uint amount = msg.value;
        require (modulo > 1 && modulo <= MAX_MODULO, "Modulo should be within range.");
        require (amount >= MIN_BET && amount <= MAX_AMOUNT, "Amount should be within range.");
        if(modulo < MAX_MODULO) {
            require (betMask > 0 && betMask < MAX_BET_MASK, "Mask should be within range.");
        }


        // Check that commit is valid - it has not expired and its signature is valid.
        require (block.number <= commitLastBlock, "Commit has expired.");
        bytes32 signatureHash = keccak256(abi.encodePacked(uint40(commitLastBlock), commit));
        //  require (secretSigner == ecrecover(signatureHash, 27, r, s), "ECDSA signature is not valid.");

        uint rollUnder;

        // Winning amount and jackpot increase.
        uint possibleWinAmount;
        uint jackpotFee;

        if(uint8(modulo) == MODULO_ROULETTE_MULIMODE) {
            (possibleWinAmount, jackpotFee) = getDiceAmountRoulette(betMask, creditMask);

        } else  if (modulo <= MAX_MASK_MODULO) {
            // Small modulo games specify bet outcomes via bit mask.
            // rollUnder is a number of 1 bits in this mask (population count).
            // This magic looking formula is an efficient way to compute population
            // count on EVM for numbers below 2**40. For detailed proof consult
            // the dice2.win whitepaper.
            rollUnder = ((betMask * POPCNT_MULT) & POPCNT_MASK) % POPCNT_MODULO;
            (possibleWinAmount, jackpotFee) = getDiceWinAmount(amount, modulo, rollUnder);

        } else {
            // Larger modulos specify the right edge of half-open interval of
            // winning bet outcomes.
            require (betMask > 0 && betMask <= modulo, "High modulo range, betMask larger than modulo.");
            rollUnder = betMask;
            (possibleWinAmount, jackpotFee) = getDiceWinAmount(amount, modulo, rollUnder);

        }


        // Enforce max profit limit.
        //        require (possibleWinAmount <= amount + maxProfit, "maxProfit limit violation.");
        // Lock funds.
        lockedInBets += uint128(possibleWinAmount);
        jackpotSize += uint128(jackpotFee);

        // Check whether contract has enough funds to process this bet.
        //        require (jackpotSize + lockedInBets <= address(this).balance, "Cannot afford to lose this bet.");

        // Record commit in logs.
        emit Commit(commit);

        // Store bet parameters on blockchain.
        bet.amount = amount;
        bet.modulo = uint8(modulo);
        bet.rollUnder = uint8(rollUnder);
        bet.placeBlockNumber = uint40(block.number);
        bet.mask = betMask;
        bet.creditMask = creditMask;
        bet.gambler = msg.sender;
    }


    function getDiceAmountRoulette(uint betMask, uint creditMask) private returns (uint, uint) {
        uint possibleWinAmountPart;
        uint jackpotFeePart;
        uint possibleWinAmount;
        uint jackpotFee;
        uint40[] memory masks;
        uint[] memory  amounts;
        (masks, amounts) = getNumbers(betMask, creditMask);
        for(uint i=0;i< masks.length;i++) {
            (possibleWinAmountPart, jackpotFeePart) = getDiceWinAmount(amounts[i], 36, ((masks[i] * POPCNT_MULT) & POPCNT_MASK) % POPCNT_MODULO);
            possibleWinAmount+=possibleWinAmountPart;
            jackpotFee += jackpotFeePart;
        }
    }


    function getNumbers(uint betMask, uint creditMask) public view returns(uint40[],uint[]) {

        uint betAmount = msg.value;
        uint8 numberOfBets = uint8(creditMask);
        // first 8 bits: store number of credit and bets
        // next 22 bits: 6 bits indicate length of bet mask, 16  indicate credit number (max = 65535)
        creditMask = creditMask >> 8;

        uint40[] memory numbers = new uint40[](numberOfBets);
        uint[] memory amounts = new uint[](numberOfBets);

        uint24 betBlock;
        for(uint8 i = 0; i < numberOfBets; i++) {
            betBlock = uint24(creditMask) << 2;
            betBlock = betBlock >> 2;
            creditMask = creditMask >> 22;
            uint8 maskNumber = uint8(betBlock) << 2;
            maskNumber = maskNumber >> 2;
            uint24 amountPercent =  betBlock >> 6;

            uint40 number     =   uint40(betMask);
            number = number << (40 - maskNumber);
            number = number >> (40 - maskNumber);
            betMask = betMask >> maskNumber;
            numbers[i] = number;
            amounts[i] = uint(amountPercent) * ROULETTE_CREDIT_DELTA;

        }
        return (numbers, amounts);

    }


    // This is the method used to settle 99% of bets. To process a bet with a specific
    // "commit", settleBet should supply a "reveal" number that would Keccak256-hash to
    // "commit". "blockHash" is the block hash of placeBet block as seen by croupier; it
    // is additionally asserted to prevent changing the bet outcomes on Ethereum reorgs.
    event LogCommit(uint commit1);
    function settleBet(uint reveal, bytes32 blockHash) external onlyCroupier {
        uint commit = uint(keccak256(abi.encodePacked(reveal)));

        Bet storage bet = bets[commit];
        uint placeBlockNumber = bet.placeBlockNumber;

        // Check that bet has not expired yet (see comment to BET_EXPIRATION_BLOCKS).
        require (block.number > placeBlockNumber, "settleBet in the same block as placeBet, or before.");
        require (block.number <= placeBlockNumber + BET_EXPIRATION_BLOCKS, "Blockhash can't be queried by EVM.");
        require (blockhash(placeBlockNumber) == blockHash);
        //        emit LogCommit(commit);
        // Settle bet using reveal and blockHash as entropy sources.
        settleBetCommon(bet, reveal, blockHash);
    }



    // Common settlement code for settleBet & settleBetUncleMerkleProof.
    function settleBetCommon(Bet storage bet, uint reveal, bytes32 entropyBlockHash) private {
        // Fetch bet parameters into local variables (to save gas).
        uint modulo = bet.modulo;
        uint amount = bet.amount;
        uint rollUnder = bet.rollUnder;
        address gambler = bet.gambler;

        // Check that bet is in 'active' state.
        require (bet.amount != 0, "Bet should be in an 'active' state");

        // Move bet into 'processed' state already.


        // The RNG - combine "reveal" and blockhash of placeBet using Keccak256. Miners
        // are not aware of "reveal" and cannot deduce it from "commit" (as Keccak256
        // preimage is intractable), and house is unable to alter the "reveal" after
        // placeBet have been mined (as Keccak256 collision finding is also intractable).
        bytes32 entropy = keccak256(abi.encodePacked(reveal, entropyBlockHash));
        //
        //        // Do a roll by taking a modulo of entropy. Compute winning amount.

        uint dice = uint(entropy) % modulo;
        //
        uint diceWinAmount;
        uint _jackpotFee;
        //
        //
        uint diceWin = 0;
        uint jackpotWin = 0;

        if(uint8(modulo) == uint8(MAX_MODULO)) {
            //            emit LogCommit(0x1);
            dice = uint(entropy) % 36;
            // multi play roulette
            (diceWinAmount, _jackpotFee) = getWinningRouletteAmount(bet, dice);
            diceWin = diceWinAmount;

        } else if (modulo <= MAX_MASK_MODULO) {
            //            emit LogCommit(0x2);

            (diceWinAmount, _jackpotFee) = getDiceWinAmount(amount, modulo, rollUnder);
            // For small modulo games, check the outcome against a bit mask.
            if ((2 ** dice) & bet.mask != 0) {
                diceWin = diceWinAmount;
            }

        } else {
            (diceWinAmount, _jackpotFee) = getDiceWinAmount(amount, modulo, rollUnder);
            // For larger modulos, check inclusion into half-open interval.
            if (dice < rollUnder) {
                diceWin = diceWinAmount;
            }

        }
        bet.amount = 0;
        // Unlock the bet amount, regardless of the outcome.
        lockedInBets -= uint128(diceWinAmount);
        emit SpinResult(0xA,dice, diceWin + jackpotWin);
        //        emit Commit(dice);
        // Roll for a jackpot (if eligible).
        if (amount >= MIN_JACKPOT_BET) {
            // The second modulo, statistically independent from the "main" dice roll.
            // Effectively you are playing two games at once!
            uint jackpotRng = (uint(entropy) / modulo) % JACKPOT_MODULO;

            // Bingo!
            if (jackpotRng == 0) {
                jackpotWin = jackpotSize;
                jackpotSize = 0;
            }
        }

        // Log jackpot win.
        if (jackpotWin > 0) {
            emit JackpotPayment(gambler, jackpotWin);
        }

        // Send the funds to gambler.
        sendFunds(gambler, (diceWin + jackpotWin) == 0 ? 1 wei : diceWin + jackpotWin, diceWin);
    }

    function getWinningRouletteAmount(Bet storage bet, uint dice) private returns(uint diceWinAmount, uint _jackpotFee) {
        uint possibleWinAmountPart;
        uint jackpotFeePart;
        uint40[] memory masks;
        uint[] memory  amounts;
        (masks, amounts) = getNumbers(bet.mask, bet.creditMask);
        uint result = 2 ** dice;
        emit Commit(result);
        for(uint i= 0;i < masks.length;i++) {

            if (result & masks[i] != 0) {

                (possibleWinAmountPart, jackpotFeePart) = getDiceWinAmount(amounts[i], 36, ((masks[i] * POPCNT_MULT) & POPCNT_MASK) % POPCNT_MODULO);
                emit LogCommit(possibleWinAmountPart);
                emit LogCommit(amounts[i]);
                diceWinAmount += possibleWinAmountPart;
                _jackpotFee += jackpotFeePart;
            }
        }
        return (diceWinAmount, _jackpotFee);
    }
    // Refund transaction - return the bet amount of a roll that was not processed in a
    // due timeframe. Processing such blocks is not possible due to EVM limitations (see
    // BET_EXPIRATION_BLOCKS comment above for details). In case you ever find yourself
    // in a situation like this, just contact the dice2.win support, however nothing
    // precludes you from invoking this method yourself.
    function refundBet(uint commit) external {
        // Check that bet is in 'active' state.
        Bet storage bet = bets[commit];
        uint amount = bet.amount;

        require (amount != 0, "Bet should be in an 'active' state");

        // Check that bet has already expired.
        require (block.number > bet.placeBlockNumber + BET_EXPIRATION_BLOCKS, "Blockhash can't be queried by EVM.");

        // Move bet into 'processed' state, release funds.
        bet.amount = 0;

        uint diceWinAmount;
        uint jackpotFee;
        (diceWinAmount, jackpotFee) = getDiceWinAmount(amount, bet.modulo, bet.rollUnder);

        lockedInBets -= uint128(diceWinAmount);
        jackpotSize -= uint128(jackpotFee);

        // Send the refund.
        sendFunds(bet.gambler, amount, amount);
    }

    // Get the expected win amount after house edge is subtracted.
    function getDiceWinAmount(uint amount, uint modulo, uint rollUnder) private pure returns (uint winAmount, uint jackpotFee) {
        require (0 < rollUnder && rollUnder <= modulo, "Win probability out of range.");

        jackpotFee = amount >= MIN_JACKPOT_BET ? JACKPOT_FEE : 0;

        uint houseEdge = amount * HOUSE_EDGE_PERCENT / 100;

        if (houseEdge < HOUSE_EDGE_MINIMUM_AMOUNT) {
            houseEdge = HOUSE_EDGE_MINIMUM_AMOUNT;
        }

        require (houseEdge + jackpotFee <= amount, "Bet doesn't even cover house edge.");
        winAmount = (amount - houseEdge - jackpotFee) * modulo / rollUnder;
    }

    // Helper routine to process the payment.
    function sendFunds(address beneficiary, uint amount, uint successLogAmount) private {
        if (beneficiary.send(amount)) {
            emit Payment(beneficiary, successLogAmount);
        } else {
            emit FailedPayment(beneficiary, address(this).balance);
        }
    }

    // This are some constants making O(1) population count in placeBet possible.
    // See whitepaper for intuition and proofs behind it.
    uint constant POPCNT_MULT = 0x0000000000002000000000100000000008000000000400000000020000000001;
    uint constant POPCNT_MASK = 0x0001041041041041041041041041041041041041041041041041041041041041;
    uint constant POPCNT_MODULO = 0x3F;

}
