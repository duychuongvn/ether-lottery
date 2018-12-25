const Dice2WinContract = artifacts.require("Dice2Win");


toGwei = (wei) => {
    return parseInt(wei / 1000000000000);
}

toWei = (ether) =>{
    return ether*1000000000000000000;
}
toEther =(wei) => {
    return wei/1000000000000000000;
}

var assertThrow = async (fn, args) => {
    try {
        await fn.apply(null, args)
        assert(false, 'the contract should throw here')
    } catch (error) {
        assert(
            /invalid opcode/.test(error) || /revert/.test(error),
            `the error message should be invalid opcode or revert, the error was ${error}`
        )
    }
}
sleep = () => {
    setTimeout(function () {

    }, 5000);
}

describe('Test', async () => {

    contract("Dice2WinContract", accounts => {
        const [firstAccount] = accounts;
        const contractOwner = accounts[0]
        const feeOwner = contractOwner;

        let contract;


        beforeEach('setup contract for each test', async () => {
            contract = await Dice2WinContract.new();
            //
            //
            //
            // contract.Commit().watch((err, res)=>{
            //     console.log("Number: "+res.args.commit.toNumber());
            //
            // }) ;
            // contract.CheckLog().watch((err, res)=>{
            //     console.log("Block: "+res.args.reveal.toNumber());
            //     console.log("Commit: "+res.args.commit.toNumber());
            //     console.log("Hash: "+res.args.hash);
            //
            // }) ;

            // contract.Payment().watch((err, res)=>{
            //     console.log("beneficiary: "+res.args.beneficiary);
            //     console.log("amount: "+res.args.amount.toNumber());
            // })


        })


        it('should query', async () => {


// function placeBet(uint[] betMask, uint[] modulo, uint[] partAmount, uint40 commitLastBlock, uint commit, bytes32 r, bytes32 s) external payable {
//
            web3.eth.sendTransaction({from: accounts[0], to: contract.address, value: 10000000000000000});
            contract.setMaxProfit(100000000000000000);
            console.log(contract.address, " - ", web3.eth.getBalance(contract.address).toNumber());

              // contract.fallback({value: 1000000000000000000});
           try {


               await contract.placeBet([15,51], [37,37], [10000000000000000, 10000000000000000], 1000, '0xb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf6', 0xc, 0xa, {value: 20000000000000000});
               contract.getBetInfo('0xb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf6').then(r=>{
                   for(let i = 0; i<r[0].length;i++) {
                       console.log("Amount: ", r[0][i].toNumber());
                       console.log("Modulo: ", r[1][i].toNumber());
                       console.log("Mask: ", r[2][i].toNumber());
                       console.log("Rollunder: ", r[3][i].toNumber());
                   }
                   console.log("Gambler", r[4])
                   console.log("Placed block", r[5].toNumber())

                   let blockHash = web3.eth.getBlock(r[5].toNumber()).hash;

                   console.log(blockHash)
                   contract.settleBet(1, blockHash)
               })
           }catch (e) {
               console.log(e)
           }
        });
    })
})
