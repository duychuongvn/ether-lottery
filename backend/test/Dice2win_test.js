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


            contract.Commit().watch((err, res)=>{
                // console.log(res);
                console.log("Commit",res.args.commit.toNumber());
            //  contract.settleBet('0x1', res.blockHash);

            }) ;

            contract.LogCommit().watch((err, res)=>{
                console.log("LogCommit",res.args.commit1.toNumber());
                // console.log('BlockHash:', res.blockHash)
                // contract.settleBet('0x1', res.blockHash);

            }) ;


            // contract.CheckParts().watch((err, res)=>{
            //     console.log("masks: "+res.args.masks);
            //     for(let i = 0;i< res.args.amounts.length;i++) {
            //         console.log("A: ", res.args.amounts[i].toNumber());
            //     }
            //
            //
            // }) ;
            // contract.CheckLog().watch((err, res)=>{
            //     console.log("Block: "+res.args.reveal.toNumber());
            //     console.log("Commit: "+res.args.commit.toNumber());
            //     console.log("Hash: "+res.args.hash);
            //
            // }) ;

            contract.SpinResult().watch((err, res)=>{
                console.log("SpinResult: "+res.args.result.toNumber());
                console.log("amount: "+res.args.amount.toNumber());
            })
            contract.Payment().watch((err, res)=>{
                console.log("win beneficiary: "+res.args.beneficiary);
                console.log("amount: "+res.args.amount.toNumber());
            })

            contract.FailedPayment().watch((err, res)=>{
                console.log("Fail beneficiary: "+res.args.beneficiary);
                console.log("amount: "+res.args.amount.toNumber());
            })



        })


        it('should query', async () => {


// function placeBet(uint[] betMask, uint[] modulo, uint[] partAmount, uint40 commitLastBlock, uint commit, bytes32 r, bytes32 s) external payable {
//
            web3.eth.sendTransaction({from: accounts[0], to: contract.address, value: 2110000000000000000});
            contract.setMaxProfit(100000000000000000);
            console.log(contract.address, " - ", web3.eth.getBalance(contract.address).toNumber());

              // contract.fallback({value: 1000000000000000000});
            // 0x000000000000000000000000000000000000000000000000000000000000;
            // let betMask = 0x000000000000000000000000000000000000000000000000000000000002;
            // let creditMask = 0x000000000000000000000000000000000000000000000000000000000281;
                              //0x3308b94d981fab385ba9d03825bfd6907a27849cd49a3d78de016e8ac622435b
            let betMask =    '0x0000000000000000000000000000000000000000000000007fffe7fffe000033';
            let creditMask = '0x0000000000000000000000000000000000000000000000000540001980004603';
                                                                        //     282000A0800282D0
           try {

             let rs =  await contract.placeBet(betMask,creditMask,101, 1000, '0xb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf6', 0xc, 0xa, {value: 30000000000000000});

             console.log('BlHask:', rs.receipt.blockHash);
             contract.settleBet('0x1', rs.receipt.blockHash);
              // await  contract.settleBet('0x1');
           }catch (e) {
               console.log(e)
           }
        });
    })
})
