import { useSnackbar } from 'notistack';
import { useCallback } from 'react';

import Cid from '~/common/Cid';
import Message from '~/common/Message';
import MsigSerialization from '~/common/MsigSerialization';
import SignedMessage from '~/common/SignedMessage';
import { WalletAddress } from '~/common/Wallet';
import useLotusRpc from './useLotusRpc';
import useWallet from './useWallet';

type PoolPushFn = (address: WalletAddress, message: Message) => Promise<Cid>;

/**
 * Lifecycle hook for getting a message signed and published
 * 1. calculate gas
 * 2. sign
 * 3. publish
 */
export default function useSignAndPublish(): PoolPushFn {
  const lotusClient = useLotusRpc();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const wallet = useWallet();

  return useCallback(
    async (address: WalletAddress, message: Message) => {
      if (!wallet) {
        throw new Error('Wallet required to sign');
      }

      const nonce = await lotusClient.mpoolGetNonce(message.from);
      message.nonce = nonce;

      const head = await lotusClient.chainHead();
      const gasEstimate = await lotusClient.gasEstimateMessageGas(message, head.Cids);

      message.gaspremium = BigInt(gasEstimate.GasPremium);
      message.gasfeecap = BigInt(gasEstimate.GasFeeCap);
      message.gaslimit = gasEstimate.GasLimit;

      const signSnackbarKey = enqueueSnackbar('Review transaction on ledger', {
        variant: 'info',
        persist: true,
        anchorOrigin: { horizontal: 'center', vertical: 'top' },
      });

      const serializedMessage = MsigSerialization.Message.ToBuffer(message);
      const signResponse = await wallet.sign(address, serializedMessage).finally(() => {
        closeSnackbar(signSnackbarKey);
      });

      const signedMessage: SignedMessage = {
        message,
        signature: {
          type: 1,
          data: Buffer.from(signResponse.signatureCompact),
        },
      };

      return lotusClient.mpoolPush(signedMessage);
    },
    [closeSnackbar, enqueueSnackbar, lotusClient, wallet],
  );
}
