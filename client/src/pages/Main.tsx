import React, { useEffect, useState } from 'react';
import { VenomConnect } from 'venom-connect';
import { Address, ProviderRpcClient } from 'everscale-inpage-provider';
import { formatBalance, shortAddress } from '../utils/helpers';
import { useVenomWallet } from '../hooks/useVenomWallet';
import NftAuction from '../components/NftAuction';
import '../styles/main.css';
import fonImg from '../styles/img/decor.svg';
import LogOutImg from '../styles/img/log_out.svg';

// Do not forget about ABI. We need it to call our smart contracts!
import tokenRootAbi from '../abi/TokenRoot.abi.json';
import tokenWalletAbi from '../abi/TokenWallet.abi.json';
// Store it somwhere....for example in separate files for constants
import { TOKEN_ROOT_ADDRESS } from '../utils/constants';


type Props = {
  venomConnect: VenomConnect | undefined;
};
function Main({ venomConnect }: Props) {
  const [venomProvider, setVenomProvider] = useState<any>();
  const [standaloneProvider, setStandAloneProvider] = useState<ProviderRpcClient | undefined>();
  const { connect, disconnect, address } = useVenomWallet();
  const [add, setAdd] = useState(address);
  // User's token (TIP-3) balance
  const [balance, setBalance] = useState<string | undefined>();
  // User's TokenWallet (TIP-3) add
  const [tokenWalletAddress, setTokenWalletAddress] = useState<string | undefined>();
  // This method allows us to gen a wallet add from inpage provider
  const getAddress = async (provider: any) => {
    const providerState = await provider?.getProviderState?.();
    return providerState?.permissions.accountInteraction?.add.toString();
  };
  // This method calls balance function of deployed TokenWallet smart contract (can be called with standalone client as provider)
  const getTokenWalletAddress = async (
    provider: ProviderRpcClient,
    userWalletAddress: string
  ): Promise<string | undefined> => {
    const contract = new provider.Contract(tokenRootAbi, new Address(TOKEN_ROOT_ADDRESS));
    const tokenWallet = (await contract.methods
      .walletOf({
        answerId: 0,
        walletOwner: userWalletAddress,
      } as never)
      .call()) as any;
    if (!tokenWallet) return undefined;
    return tokenWallet.value0._address;
  };
  // updating of user's TIP-3 balance
  const updateBalance = async () => {
    if (!tokenWalletAddress || !standaloneProvider) return;
    try {
      const contract = new standaloneProvider.Contract(tokenWalletAbi, new Address(tokenWalletAddress));
      // We check a contract state here to acknowledge if TokenWallet already deployed
      // As you remember, wallet can be deployed with first transfer on it.
      // If our wallet isn't deployed, so it's balance is 0 :)
      const contractState = await venomProvider.rawApi.getFullContractState({ add: tokenWalletAddress });
      if (contractState.state) {
        // But if this deployed, just call a balance function
        const result = (await contract.methods.balance({ answerId: 0 } as never).call()) as any;
        const tokenBalance = result.value0;
        // formatBalance is just a beauty helper to divide our balance by 10 ** 9 (decimals...our TIP-3 decimals is 9)
        setBalance(formatBalance(tokenBalance));
      } else {
        setBalance('0');
      }
    } catch (e) {
      console.error(e);
    }
  };
  // updating of user's TokenWallet (TIP-3) add (placed in hook)
  const updateTokenWalletAddress = async (provider: ProviderRpcClient, userWalletAddress: string) => {
    if (tokenWalletAddress) return;
    const walletAddress = await getTokenWalletAddress(provider, userWalletAddress);
    setTokenWalletAddress(walletAddress);
  };
  // Any interaction with venom-wallet (add fetching is included) needs to be authentificated
  const checkAuth = async (_venomConnect: any) => {
    const auth = await _venomConnect?.checkAuth();
    if (auth) await getAddress(_venomConnect);
  };
  // Method for getting a standalone provider from venomConnect instance
  const initStandalone = async () => {
    const standalone = await venomConnect?.getStandalone();
    setStandAloneProvider(standalone);
  };
  
  // This handler will be called after venomConnect.login() action
  // connect method returns provider to interact with wallet, so we just store it in state
  const onConnect = async (provider: any) => {
    setVenomProvider(provider);
    await onProviderReady(provider);
  };
  // This handler will be called after venomConnect.disconnect() action
  // By click logout. We need to reset add and balance.
  const onDisconnect = async () => {
    venomProvider?.disconnect();
    setAdd(undefined);
    setBalance(undefined);
    setTokenWalletAddress(undefined);
  };
  // When our provider is ready, we need to get add and balance from.
  const onProviderReady = async (provider: any) => {
    const venomWalletAddress = provider ? await getAddress(provider) : undefined;
    setAdd(venomWalletAddress);
  };
  useEffect(() => {
    // connect event handler
    const off = venomConnect?.on('connect', onConnect);
    if (venomConnect) {
      initStandalone();
      checkAuth(venomConnect);
    }
    // just an empty callback, cuz we don't need it
    return () => {
      off?.();
    };
  }, [venomConnect]);
  // two hooks to init connected user's TokenWallet add and balance.
  useEffect(() => {
    if (add && standaloneProvider) {
      updateTokenWalletAddress(standaloneProvider, add);
    }
  }, [add]);
  useEffect(() => {
    if (tokenWalletAddress) updateBalance();
  }, [tokenWalletAddress]);
  // you can see a shortAddress() functions here. It is just a helper, that truncate part of our long add to something like 0:1234...1234
  return (
    <div className="box">
      <img className="decor" alt="fon" src={fonImg} />
      <NftAuction
        address={address}
        standaloneProvider={standaloneProvider}
        balance={balance}
        venomProvider={venomProvider}
        tokenWalletAddress={tokenWalletAddress}
        checkBalance={updateBalance}
      />
    </div>
  );
}

export default Main;
