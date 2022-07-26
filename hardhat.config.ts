import "@typechain/hardhat";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ethers";
import "hardhat-gas-reporter";
import "dotenv/config";
import "solidity-coverage";
import "hardhat-deploy";
import "solidity-coverage";
import { HardhatUserConfig } from "hardhat/config";

const RINKEBY_RPC_URL = <string>process.env.RINKEBY_RPC_URL;
const PRIVATE_KEY = <string>process.env.PRIVATE_KEY;
const MAINNET_RPC_URL = <string>process.env.MAINNET_RPC_URL;

const config: HardhatUserConfig = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            forking: {
                url: MAINNET_RPC_URL,
            },
        },
        rinkeby: {
            chainId: 4,
            url: RINKEBY_RPC_URL,
            accounts: [PRIVATE_KEY!],
        },
    },
    solidity: {
        compilers: [{ version: "0.8.9" }, { version: "0.6.12" }, { version: "0.4.19" }],
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        player: {
            default: 1,
        },
    },
    gasReporter: {
        enabled: false,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
    },
    mocha: {
        timeout: 200000, // 200 seconds
    },
};

export default config;
