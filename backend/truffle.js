var RpcProvider = require('./wallet-provider/RpcProvider.js');
    // const admin_key = '<>';

/*
 * NB: since truffle-hdwallet-provider 0.0.5 you must wrap HDWallet providers in a
 * function when declaring them. Failure to do so will cause commands to hang. ex:
 * ```
 * mainnet: {
 *     provider: function() {
 *       return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/<infura-key>')
 *     },
 *     network_id: '1',
 *     gas: 4500000,
 *     gasPrice: 10000000000,
 *   },
 */

module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // to customize your Truffle configuration!
    networks: {
        development: {
            host: "127.0.0.1",
            port: 9545,
            network_id: "*", // Match any network id,
            gasPrice:3000000000

        },
        mocha: {
            useColors: true
        },

        etz: {
            provider:function () {
                return new RpcProvider(admin_key,"https://etzrpc.org:443")

            },
            port:9646,
            network_id: 90,
            gasPrice:20000000000,
            gasLimit:4000000

        },
        rinkeby: {
            provider: function() {
                return new  RpcProvider(admin_key,"https://rinkeby.infura.io")
            },
            network_id: 4,
            gasPrice:3000000000
        },
        clo: {
            provider: function() {
                return new  RpcProvider(admin_key,"https://clo-geth.0xinfra.com")
            },
            network_id: 1,
            gasPrice:3000000000
        },
        ganache: {
            host: "127.0.0.1", //start ganache-cli
            port: 7545,
            network_id: "*" // Match any network id
        }
    }
};
