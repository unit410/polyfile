import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { StringParam, useQueryParam } from 'use-query-params';
import Address, { Protocol } from '~/common/Address';
import Message from '~/common/Message';
import { MsigMethod } from '~/common/MsigMethod';
import { RefreshRounded } from '@material-ui/icons';
import { useSnackbar } from 'notistack';
import { Button, Grid, IconButton, Typography } from '@material-ui/core';

import MsigSerialization from '~/common/MsigSerialization';
import MsigPendingTxn from '~/common/MsigPendingTxn';
import PendingTxnCard from '~/components/PendingTxnCard';
import useAsync from '~/hooks/useAsync';
import useLotusRpc from '~/hooks/useLotusRpc';
import useWallet from '~/hooks/useWallet';
import TokenAmount from '~/components/TokenAmount';
import { useLoadingIndicator } from '~/components/LoadingIndicatorProvider';
import useSignAndPublish from '~/hooks/useSignAndPublish';
import Link from '~/components/Link';

export default function MsigInspect(): ReactElement {
  const [actorQuery] = useQueryParam('actor', StringParam);
  const [activeActor, setActiveActor] = useState<string | undefined>(undefined);

  // The useAsync methods leverage stale-while-refresh. To avoid showing incorrect data on actor change
  // we temporarily reset the active actor to undefined. This causes them to clear their state.
  useEffect(() => {
    if (actorQuery) {
      setActiveActor(undefined);
      setTimeout(() => {
        setActiveActor(actorQuery);
      }, 0);
    } else {
      setActiveActor(undefined);
    }
  }, [actorQuery]);

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const wallet = useWallet();
  const lotusClient = useLotusRpc();
  const signAndPublish = useSignAndPublish();

  const [head, headErr, headLoading, refreshHead] = useAsync(async () => {
    return lotusClient.chainHead();
  }, [lotusClient]);

  const [actorState, actorStateErr, actorStateLoading] = useAsync(async () => {
    if (!activeActor || !head) {
      return null;
    }

    return lotusClient.stateReadState(Address.FromString(activeActor), head.Cids);
  }, [activeActor, lotusClient, head]);

  const [spendable, spendableErr, spendableLoading] = useAsync(async () => {
    if (!activeActor || !head) {
      return null;
    }

    return lotusClient.msigGetAvailableBalance(Address.FromString(activeActor), head.Cids);
  }, [activeActor, head, lotusClient]);

  const [pendingTxns, pendingTxnsErr, pendingTxnsLoading] = useAsync(async () => {
    if (!actorState) {
      return null;
    }

    const pendingObj = await lotusClient.chainReadObj(actorState.state.pendingTxns);
    const txns = MsigSerialization.PendingTxns.FromBuffer(pendingObj);
    return txns.sort((a, b) => {
      return a.id - b.id;
    });
  }, [actorState, lotusClient]);

  const [allApprovers, allApproversErr, allApproversLoading] = useAsync(async () => {
    if (!actorState || !head) {
      return;
    }

    const allApprovers = new Map<Address, Address>();

    await Promise.all(
      // If a signer has not appeared in a chain-tx the signers list will contain their public address
      // Their ID address will only be set later once they appear in a chain message.
      actorState.state.signers.map(async (address) => {
        if (address.protocol() === Protocol.ID) {
          const accountAddress = await lotusClient.stateAccountKey(address, head.Cids);
          allApprovers.set(address, accountAddress);
        } else {
          allApprovers.set(address, address);
        }
      }),
    );

    return allApprovers;
  }, [actorState, lotusClient, head]);

  const approveOrCancel = useCallback(
    async (method: MsigMethod.Approve | MsigMethod.Cancel, txn: MsigPendingTxn) => {
      if (!activeActor || !allApprovers) {
        return;
      }

      // identify the from address we will approve with
      const key = enqueueSnackbar('Loading addresses from ledger...', {
        variant: 'info',
        persist: true,
        anchorOrigin: { horizontal: 'center', vertical: 'top' },
      });
      const myAddresses = await wallet.addresses().finally(() => {
        closeSnackbar(key);
      });

      const approvedIdAddrs = new Set<string>(txn.approved.map((addr) => addr.toString()));

      const approvers = new Array<Address>();
      for (const [idAddress, address] of allApprovers.entries()) {
        // keep only the approvers that have not approved
        // this is a special case for using multiple addresses from one wallet
        // Note: we only do this when invoking the approve operation to allow an approver to cancel
        if (method === MsigMethod.Approve && approvedIdAddrs.has(idAddress.toString())) {
          continue;
        }

        approvers.push(address);
      }

      const myAddress = myAddresses.find((walletAddress) => {
        return approvers.find(
          (approverAddress) => walletAddress.address.toString() === approverAddress.toString(),
        );
      });

      // we don't own any of the signing addresses
      if (!myAddress) {
        enqueueSnackbar('Nothing to sign', {
          variant: 'info',
          anchorOrigin: { horizontal: 'center', vertical: 'top' },
        });
        return;
      }

      const msig = Address.FromString(activeActor);

      const txnIdParams = {
        txid: txn.id,
      };

      const message: Message = {
        version: 0,
        to: msig,
        from: myAddress.address,
        nonce: 0,
        value: BigInt('0'),
        method,
        params: MsigSerialization.TxnIdParams.ToBuffer(txnIdParams),
        gasfeecap: BigInt('1000'),
        gaspremium: BigInt('1000'),
        gaslimit: 0,
      };

      const cid = await signAndPublish(myAddress, message);

      enqueueSnackbar(cid['/'], {
        variant: 'success',
        persist: true,
        preventDuplicate: true,
        action: (key) => <Button onClick={() => closeSnackbar(key)}>Dismiss</Button>,
      });
    },
    [activeActor, allApprovers, closeSnackbar, enqueueSnackbar, signAndPublish, wallet],
  );

  const handleApproveRequest = useCallback(
    (txn: MsigPendingTxn) => {
      return approveOrCancel(MsigMethod.Approve, txn);
    },
    [approveOrCancel],
  );

  const handleCancelRequest = useCallback(
    (txn: MsigPendingTxn) => {
      return approveOrCancel(MsigMethod.Cancel, txn);
    },
    [approveOrCancel],
  );

  // all loading indicators
  const showLoadingIndicator = useLoadingIndicator();

  const isLoading =
    headLoading ||
    actorStateLoading ||
    spendableLoading ||
    pendingTxnsLoading ||
    allApproversLoading;

  useEffect(() => {
    showLoadingIndicator(isLoading);
  }, [isLoading, showLoadingIndicator]);

  // all async errors collected here
  useEffect(() => {
    const possibleErrs = [headErr, actorStateErr, spendableErr, pendingTxnsErr, allApproversErr];
    for (const err of possibleErrs) {
      if (err) {
        enqueueSnackbar(err.message, { variant: 'error' });
      }
    }
  }, [actorStateErr, allApproversErr, enqueueSnackbar, headErr, pendingTxnsErr, spendableErr]);

  // auto-refresh
  useEffect(() => {
    const handle = setInterval(() => {
      refreshHead();
    }, 1000 * 30);

    return () => {
      clearInterval(handle);
    };
  });

  return (
    <>
      {actorState && (
        <Grid
          container
          direction="column"
          spacing={2}
          style={{ flexWrap: 'inherit' /* weird display sizing in chrome without this */ }}
        >
          <Grid item>
            <Grid container>
              <Grid item xs={1}>
                <Typography variant="h5">
                  {actorState.state.numApprovalsThreshold} / {actorState.state.signers.length}
                </Typography>
              </Grid>
              <Grid item xs={11}>
                <Typography variant="h5" align="right" component="div">
                  <IconButton
                    size="small"
                    title="refresh"
                    onClick={refreshHead}
                    disabled={isLoading}
                  >
                    <RefreshRounded />
                  </IconButton>
                  {activeActor}
                </Typography>
              </Grid>
            </Grid>
            <Grid item>
              <Typography variant="h6" align="right" component="div">
                <div>
                  <TokenAmount amount={BigInt(actorState.balance)} /> FIL
                </div>
                <div>{spendable && <TokenAmount amount={BigInt(spendable)} />} FIL</div>
              </Typography>
            </Grid>
            <Grid item style={{ textAlign: 'right' }}>
              <Button variant="contained" color="primary" component={Link} href="/msig-propose">
                Propose
              </Button>
            </Grid>
          </Grid>
          {pendingTxns?.map((txn) => (
            <Grid item key={`${txn.id}`}>
              <PendingTxnCard
                approvers={allApprovers ?? new Map()}
                txn={txn}
                onApproveRequest={handleApproveRequest}
                onCancelRequest={handleCancelRequest}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );
}
