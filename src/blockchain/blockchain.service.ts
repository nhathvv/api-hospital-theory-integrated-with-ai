import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ethers } from 'ethers';
import * as crypto from 'crypto';
import { HOSPITAL_PAYMENT_REGISTRY_ABI } from './contracts';
import { EnvService } from '../configs/envs/env-service';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private paymentContract: ethers.Contract | null = null;
  private isEnabled = false;

  async onModuleInit() {
    await this.initialize();
  }

  private async initialize() {
    const envService = EnvService.getInstance();
    const rpcUrl = envService.getPolygonRpcUrl();
    const privateKey = envService.getBlockchainPrivateKey();
    const contractAddress = envService.getPaymentRegistryContract();

    if (!rpcUrl || !privateKey || !contractAddress) {
      this.logger.warn(
        'Blockchain configuration incomplete. Blockchain features will be disabled.',
      );
      return;
    }

    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.paymentContract = new ethers.Contract(
        contractAddress,
        HOSPITAL_PAYMENT_REGISTRY_ABI,
        this.wallet,
      );
      this.isEnabled = true;

      const network = await this.provider.getNetwork();
      this.logger.log(
        `Blockchain connected: Network=${network.name}, ChainId=${network.chainId}`,
      );
    } catch (error) {
      this.logger.error('Failed to initialize blockchain connection', error);
    }
  }

  isBlockchainEnabled(): boolean {
    return this.isEnabled;
  }

  getPaymentContract(): ethers.Contract | null {
    return this.paymentContract;
  }

  getWallet(): ethers.Wallet | null {
    return this.wallet;
  }

  generateHash(data: object): string {
    const sortedKeys = Object.keys(data).sort();
    const sortedData: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      sortedData[key] = (data as Record<string, unknown>)[key];
    }
    const jsonString = JSON.stringify(sortedData);
    return crypto.createHash('sha256').update(jsonString).digest('hex');
  }

  stringToBytes32(str: string): string {
    const bytes = ethers.toUtf8Bytes(str);
    if (bytes.length > 32) {
      return ethers.keccak256(bytes);
    }
    return ethers.zeroPadValue(bytes, 32);
  }

  async getBalance(): Promise<string> {
    if (!this.wallet || !this.provider) {
      return '0';
    }
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }
}

