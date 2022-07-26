import { ethers, getNamedAccounts } from "hardhat";
import { depositWeth, AMOUNT } from "./depositWETH";
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { BigNumber } from "ethers";
import { IERC20 } from "../typechain-types/contracts/interfaces/IERC20";
import { ILendingPool } from "../typechain-types/contracts/interfaces/ILendingPool";
import { ILendingPoolAddressesProvider } from "../typechain-types/contracts/interfaces/ILendingPoolAddressesProvider";
import { AggregatorV3Interface } from "../typechain-types/contracts/interfaces/AggregatorV3Interface";

async function main(): Promise<void> {
    await depositWeth();
    const { deployer } = await getNamedAccounts();
    const lendingPool = await getLendingPool(deployer);
    console.log(`LendingPool address: ${lendingPool.address}`);

    const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    // approve
    await approveERC20(wethTokenAddress, lendingPool.address, AMOUNT, deployer);

    // deposit WETH into to pool
    console.log("Depositing...");

    await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0);
    console.log("Deposited!");

    // Conversion rate of DAI
    // How much DAI we can borrow against ETH
    let { availableBorrowsETH, totalDebtETH } = await getUserData(lendingPool, deployer);
    const daiPrice = await getDaiPrice();
    const amountDaiToBorrow = availableBorrowsETH.mul(95).div(100).div(daiPrice);
    const amountDaiToBorrowWei = ethers.utils.parseEther(amountDaiToBorrow.toString());
    console.log(`You can borrow ${amountDaiToBorrow} DAI tokens`);

    // Borrow asset
    await borrow(
        "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        lendingPool,
        amountDaiToBorrowWei,
        deployer
    );

    console.log("----------------------------------------------------------------------");
    await getUserData(lendingPool, deployer);
    console.log("----------------------------------------------------------------------");
    await repay(
        "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        amountDaiToBorrowWei,
        lendingPool,
        deployer
    );
    await getUserData(lendingPool, deployer);
}

async function getLendingPool(account: string): Promise<ILendingPool> {
    const lendingPoolAddressesProvider: ILendingPoolAddressesProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
        account
    );
    const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool();
    const lendingPool: ILendingPool = await ethers.getContractAt(
        "ILendingPool",
        lendingPoolAddress,
        account
    );
    return lendingPool;
}

async function approveERC20(
    erc20address: string,
    spenderAddress: string,
    amountToSpend: BigNumber,
    account: string
): Promise<void> {
    const erc20Token: IERC20 = await ethers.getContractAt("IERC20", erc20address, account);
    const tx: TransactionResponse = await erc20Token.approve(spenderAddress, amountToSpend);
    await tx.wait(1);
    console.log("Approved!");
}

async function getUserData(
    lendingPool: ILendingPool,
    account: string
): Promise<{
    totalDebtETH: BigNumber;
    availableBorrowsETH: BigNumber;
}> {
    const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
        await lendingPool.getUserAccountData(account);
    console.log(`You have ${totalCollateralETH} worth of ETH deposited`);
    console.log(`You have ${totalDebtETH} worth of ETH borrowed`);
    console.log(`You can borrow ${availableBorrowsETH} worth of ETH`);
    return { totalDebtETH, availableBorrowsETH };
}

async function getDaiPrice(): Promise<BigNumber> {
    const daiEthPriceFeed: AggregatorV3Interface = await ethers.getContractAt(
        "AggregatorV3Interface",
        "0x773616E4d11A78F511299002da57A0a94577F1f4"
    );
    const price = (await daiEthPriceFeed.latestRoundData())[1];
    console.log(`DAI/ETH price: ${price}`);
    return price;
}

async function borrow(
    assetAddress: string,
    lendingPool: ILendingPool,
    amount: BigNumber,
    account: string
): Promise<void> {
    const tx = await lendingPool.borrow(assetAddress, amount, 1, 0, account);
    await tx.wait(1);
    console.log("Borrowing done!");
}

async function repay(
    assetAddress: string,
    amount: BigNumber,
    lendingPool: ILendingPool,
    account: string
) {
    console.log("----------------------------------------------------------------------");
    await approveERC20(assetAddress, lendingPool.address, amount, account);
    const tx = await lendingPool.repay(assetAddress, amount, 1, account);
    await tx.wait(1);
    console.log(`Repaid!`);
}

main()
    .then(() => process.exit(0))
    .catch((error: any) => {
        console.error(error);
        process.exit(1);
    });
