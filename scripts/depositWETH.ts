import { TransactionResponse } from "@ethersproject/abstract-provider";
import { getNamedAccounts, ethers } from "hardhat";
import { IWeth } from "../typechain-types/contracts/interfaces/IWeth";

export const AMOUNT = ethers.utils.parseEther("0.02");

export async function depositWeth(): Promise<void> {
    const { deployer } = await getNamedAccounts();
    const iWeth = await ethers.getContractAt<IWeth>(
        "IWeth",
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        deployer
    );
    const tx: TransactionResponse = await iWeth.deposit({ value: AMOUNT });
    await tx.wait(1);
    const wethBalance = await iWeth.balanceOf(deployer);
    console.log(`Got ${wethBalance.toString()} WETH`);
}
