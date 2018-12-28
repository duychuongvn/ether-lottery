// var ScheduleContract = artifacts.require("./ScheduleContract.sol");
// var EtherLotteryContract = artifacts.require("./EtherLotteryContract.sol");
var Dice2Win = artifacts.require("./Dice2Win.sol");
module.exports = function(deployer) {

   // deployer.deploy(ScheduleContract).then(function () {
   //     return  deployer.deploy(EtherLotteryContract, ScheduleContract.address);
   // });

    deployer.deploy(Dice2Win);
};
// var Test1 = artifacts.require("./Test1.sol");
// var Test2 = artifacts.require("./Test2.sol");
// module.exports = function(deployer) {
//
//     deployer.deploy(Test1).then(function () {
//         return  deployer.deploy(Test2, Test1.address);
//     });
//
//     // deployer.deploy(Dice2Win);
// };
