import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class EthereumService {
  protected provider: ethers.JsonRpcProvider;
  protected subscription: ethers.JsonRpcProvider;

  constructor() {
    this.initProvider();
  }

  private initProvider = () => {
    this.provider = new ethers.JsonRpcProvider(
      process.env.RPC_PRIVIDER,
      Number(process.env.CHAIN_ID),
    );
  };

  public getSuscriptionStatus = async () => {
    const blockListeners = await this.provider.listeners('block');

    return { status: blockListeners.length > 0, count: blockListeners.length };
  };

  public ethBlockSubscribe = async (
    callback: (
      blockNumber: number,
    ) => (tx: ethers.TransactionResponse) => Promise<void>,
  ) => {
    return await this.provider.on('block', async (blockNumber) => {
      const block = await this.provider.getBlock(blockNumber, true);

      (
        block as ethers.Block &
          {
            prefetchedTransactions: ethers.TransactionResponse[]; // hack bad ethers types
          }[]
      ).prefetchedTransactions.forEach(callback(blockNumber));
    });
  };
}
