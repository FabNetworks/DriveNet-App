import FabricCAServices from 'fabric-ca-client';
import { FileSystemWallet, Gateway, Transaction, TransientMap, X509WalletMixin } from 'fabric-network';
import * as path from 'path';
import * as ConnectionProfile from '../../drivenet-gateway.json';
import { HashSalt } from './constants';
import * as crypto from 'crypto';

const NetworkName = 'drivenet';
const ContractName = 'fabcar';

export class FabricProxy {
    private wallet: FileSystemWallet | undefined;
    private gateways: Map<string, Gateway>;

    constructor() {
      this.wallet = undefined;
      this.gateways = new Map<string, Gateway>();
    }

    public async ensureIdentity(user: string, secret: string): Promise<string> {
      const wallet = await this.getWallet();
      const walletKey = crypto.createHash('sha512').update(user + secret + HashSalt).digest('hex');

      if (!(await wallet.exists(walletKey))) {
        await this.enrollUser(user, secret, walletKey);
      }

      return walletKey;
    }

    public async evaluate(functionName: string, args: string[], walletKey: string): Promise<Buffer> {
      const contract = await this.getContract(walletKey);

      return await contract.evaluateTransaction(functionName, ...args);
    }

    public async evaluateWithTransient(functionName: string, args: string[], transient: TransientMap, walletKey: string): Promise<Buffer> {
      const transaction = await this.createTransientTransaction(functionName, transient, walletKey);

      return await transaction.evaluate(...args);
    }

    public async submit(functionName: string, args: string[], walletKey: string): Promise<void> {
      const contract = await this.getContract(walletKey);

      try {
        await contract.submitTransaction(functionName, ...args);
      } catch (err) {
        if (err.endorsements && err.endorsements.length > 0) {
          throw new Error(err.endorsements[0].message.split('Error: ')[1]);
        }

        throw err;
      }
    }

    public async submitWithTransient(functionName: string, args: string[], transient: TransientMap, walletKey: string): Promise<void> {
      const transaction = await this.createTransientTransaction(functionName, transient, walletKey);

      await transaction.submit(...args);
    }

    private async createTransientTransaction(functionName: string, transient: TransientMap, walletKey: string): Promise<Transaction> {
      const contract = await this.getContract(walletKey);

      const transaction = contract.createTransaction(functionName);
      transaction.setTransient(transient);

      return transaction;
    }

    private async getWallet(): Promise<FileSystemWallet> {
      if (!this.wallet) {
        const walletPath = path.join(__dirname, 'wallet');
        this.wallet = new FileSystemWallet(walletPath);
      }

      return this.wallet;
    }

    private async enrollUser(user: string, secret: string, walletKey: string): Promise<void> {
      const wallet = await this.getWallet();

      const caInfo = ConnectionProfile.certificateAuthorities['Community CA'];
      const caTLSCACerts = Buffer.from(caInfo.tlsCACerts.pem[0]);
      const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

      const enrollment = await ca.enroll({ enrollmentID: user, enrollmentSecret: secret });

      const x509Identity = X509WalletMixin.createIdentity(ConnectionProfile.organizations['Community Org'].mspid, enrollment.certificate, enrollment.key.toBytes());

      await wallet.import(walletKey, x509Identity);
    }


    private async getGateway(walletKey: string): Promise<Gateway> {
      if (this.gateways.has(walletKey)) {
        return this.gateways.get(walletKey) as Gateway;
      }

      const wallet = await this.getWallet();

      if (!wallet.exists(walletKey)) {
        throw new Error(`Identity not found in wallet for key ${walletKey}`);
      }

      const gateway = new Gateway();
      const gatewayOptions = {
        wallet: wallet,
        identity: walletKey,
        discovery: {
          enabled: true,
          asLocalHost: false
        }
      };

      await gateway.connect(ConnectionProfile, gatewayOptions);

      this.gateways.set(walletKey, gateway);

      return gateway;
    }

    private async getNetwork(walletKey: string) {
      return (await this.getGateway(walletKey)).getNetwork(NetworkName);
    }

    private async getContract(walletKey: string) {
      return (await this.getNetwork(walletKey)).getContract(ContractName);
    }
}