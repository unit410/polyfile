import {
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
  InputAdornment,
  Input,
  CardContent,
  Card,
  CardActions,
  Typography,
} from '@material-ui/core';
import Big from 'big.js';
import { useSnackbar } from 'notistack';
import React, { ChangeEvent, ReactElement, useCallback, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { StringParam, useQueryParam } from 'use-query-params';

import Address, { Protocol } from '~/common/Address';
import Message from '~/common/Message';
import { MsigMethod } from '~/common/MsigMethod';
import MsigProposeParams from '~/common/MsigProposeParams';
import MsigSerialization from '~/common/MsigSerialization';
import { useLoadingIndicator } from '~/components/LoadingIndicatorProvider';
import useAsync from '~/hooks/useAsync';
import useIsMounted from '~/hooks/useIsMounted';
import useLotusRpc from '~/hooks/useLotusRpc';
import useSignAndPublish from '~/hooks/useSignAndPublish';
import useWallet from '~/hooks/useWallet';

interface FormFields {
  msig: string;
  to: string;
  amount: string;
  signer: string;
}

export default function MsigPropose(): ReactElement {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [method, setMethod] = useState(MsigMethod.Send);
  const [actorQuery] = useQueryParam('actor', StringParam);
  const [error, setError] = useState<string | undefined>(undefined);
  const isMounted = useIsMounted();
  const showLoadingIndicator = useLoadingIndicator();
  const [disableActions, setDisableActions] = useState(false);
  const { register, handleSubmit, control } = useForm<FormFields>({
    defaultValues: {
      msig: actorQuery ?? '',
      signer: '',
    },
  });

  const wallet = useWallet();
  const lotusClient = useLotusRpc();

  const [actorState] = useAsync(async () => {
    if (!actorQuery) {
      return null;
    }

    const head = await lotusClient.chainHead();
    return lotusClient.stateReadState(Address.FromString(actorQuery), head.Cids);
  }, [lotusClient, actorQuery]);

  const [actorSigners] = useAsync(async () => {
    if (!actorState) {
      return [];
    }

    const head = await lotusClient.chainHead();
    return Promise.all(
      // If a signer has not appeared in a chain-tx the signers list will contain their public address
      // Their ID address will only be set later once they appear in a chain message.
      actorState.state.signers.map(async (address) => {
        if (address.protocol() === Protocol.ID) {
          return await lotusClient.stateAccountKey(address, head.Cids);
        }
        return address;
      }),
    );
  }, [actorState, lotusClient]);

  const [walletAddresses] = useAsync(async () => {
    if (!wallet) {
      return [];
    }

    return wallet.addresses();
  }, [wallet]);

  const eligibleSigningAddress = useMemo(() => {
    if (!actorSigners || !walletAddresses) {
      return [];
    }

    return walletAddresses.filter((walletAddress) =>
      actorSigners.find(
        (actorSigner) => actorSigner.toString() === walletAddress.address.toString(),
      ),
    );
  }, [actorSigners, walletAddresses]);

  const handleMethodChange = useCallback((ev: ChangeEvent<{ value: unknown }>) => {
    setMethod(ev.target.value as MsigMethod);
  }, []);

  const signAndPublish = useSignAndPublish();

  const onSubmit = useCallback(
    async (data: FormFields) => {
      const decimals = Big(10).pow(18); // filecoin number of decimals for bigint
      const amount = new Big(data.amount).times(decimals);

      const signer = eligibleSigningAddress.find((walletAddress) => {
        return walletAddress.address.toString() === data.signer;
      });

      if (!signer) {
        setError('Unable to find suitable signer address');
        return;
      }

      const proposeParams: MsigProposeParams = {
        to: Address.FromString(data.to),
        value: BigInt(amount.toFixed(0)),
        method: MsigMethod.Send,
        params: Buffer.alloc(0),
      };

      const from = Address.FromString(data.signer);

      const message: Message = {
        version: 0,
        to: Address.FromString(data.msig),
        from: from,
        nonce: 0,
        value: BigInt('0'),
        method: MsigMethod.Propose,
        params: MsigSerialization.ProposeParams.ToBuffer(proposeParams),
        gasfeecap: BigInt('1000'),
        gaspremium: BigInt('1000'),
        gaslimit: 0,
      };

      showLoadingIndicator();
      setDisableActions(true);

      try {
        const cid = await signAndPublish(signer, message);

        enqueueSnackbar(cid['/'], {
          variant: 'success',
          persist: true,
          preventDuplicate: true,
          action: (key) => <Button onClick={() => closeSnackbar(key)}>Dismiss</Button>,
        });
      } catch (err) {
        if (isMounted.current) {
          setError(err.message);
        }
      } finally {
        if (isMounted.current) {
          showLoadingIndicator(false);
          setDisableActions(false);
        }
      }
    },
    [
      closeSnackbar,
      enqueueSnackbar,
      signAndPublish,
      eligibleSigningAddress,
      isMounted,
      showLoadingIndicator,
    ],
  );

  return (
    <Grid container direction="column" spacing={2}>
      <Grid item>
        <Typography variant="h5">Multisig Propose</Typography>
      </Grid>
      <Grid item>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardContent>
              <Grid container direction="column" spacing={2}>
                <Grid item>
                  <TextField
                    label="Multisig Actor"
                    name="msig"
                    fullWidth
                    placeholder="f..."
                    inputRef={register}
                  />
                </Grid>
                <Grid item>
                  <FormControl fullWidth>
                    <InputLabel>Signer</InputLabel>
                    <Controller
                      as={
                        <Select displayEmpty>
                          {eligibleSigningAddress.map((address) => (
                            <MenuItem
                              key={address.address.toString()}
                              value={address.address.toString()}
                            >
                              {address.address.toString()}
                            </MenuItem>
                          ))}
                        </Select>
                      }
                      name="signer"
                      control={control}
                      defaultValue=""
                    />
                  </FormControl>
                </Grid>
                <Grid item>
                  <FormControl>
                    <InputLabel>Method</InputLabel>
                    <Select displayEmpty value={method} onChange={handleMethodChange}>
                      <MenuItem value={MsigMethod.Send}>Send</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item>
                  <TextField
                    label="To"
                    name="to"
                    fullWidth
                    placeholder="f..."
                    inputRef={register}
                  />
                </Grid>
                <Grid item>
                  <FormControl>
                    <InputLabel>Amount</InputLabel>
                    <Input
                      name="amount"
                      type="number"
                      inputProps={{ step: 'any' }}
                      inputRef={register}
                      endAdornment={<InputAdornment position="end">FIL</InputAdornment>}
                    />
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>

            <CardActions style={{ borderTop: '1px solid #eee' }}>
              <Grid container>
                <Grid item xs style={{ display: 'flex' }}>
                  <Typography
                    color="error"
                    component="div"
                    style={{ marginTop: 'auto', marginBottom: 'auto' }}
                  >
                    {error}
                  </Typography>
                </Grid>
                <Grid item xs={4} style={{ textAlign: 'right' }}>
                  <Button color="primary" disabled={disableActions} type="submit">
                    Propose
                  </Button>
                </Grid>
              </Grid>
            </CardActions>
          </Card>
        </form>
      </Grid>
    </Grid>
  );
}
