import React, { ReactElement, useCallback, useMemo, useState } from 'react';
import {
  Card,
  Button,
  CardActions,
  CardContent,
  CardHeader,
  Divider,
  Typography,
  Grid,
  Chip,
} from '@material-ui/core';

import MsigPendingTxn from '~/common/MsigPendingTxn';
import { MsigMethodToString } from '~/common/MsigMethod';
import Address from '~/common/Address';
import TokenAmount from './TokenAmount';
import { useLoadingIndicator } from './LoadingIndicatorProvider';
import ApprovedIndicatorDot from './ApprovedIndicatorDot';
import useIsMounted from '~/hooks/useIsMounted';

type PendingTxnCardProps = {
  txn: MsigPendingTxn;
  approvers: Map<Address, Address>;
  onApproveRequest: (txn: MsigPendingTxn) => Promise<void>;
  onCancelRequest: (txn: MsigPendingTxn) => Promise<void>;
};

export type { PendingTxnCardProps };
export default function PendingTxnCard(props: PendingTxnCardProps): ReactElement {
  const txn = props.txn;
  const showLoadingIndicator = useLoadingIndicator();
  const [disableActions, setDisableActions] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const isMounted = useIsMounted();

  const handleApprove = useCallback(async () => {
    showLoadingIndicator();
    setDisableActions(true);
    props
      .onApproveRequest(props.txn)
      .catch((err) => {
        isMounted.current && setError(err.message);
      })
      .finally(() => {
        showLoadingIndicator(false);
        setDisableActions(false);
      });
  }, [showLoadingIndicator, props, isMounted]);

  const handleCancel = useCallback(async () => {
    showLoadingIndicator();
    setDisableActions(true);
    props
      .onCancelRequest(props.txn)
      .catch((err) => {
        isMounted.current && setError(err.message);
      })
      .finally(() => {
        showLoadingIndicator(false);
        setDisableActions(false);
      });
  }, [showLoadingIndicator, props, isMounted]);

  const approvalsList = useMemo(() => {
    const approved = new Set<string>(txn.approved.map((addr) => addr.toString()));

    const list = new Array<{ approved: boolean; idAddress: Address; address: Address }>();
    for (const [key, value] of props.approvers.entries()) {
      const alreadyApproved = approved.has(key.toString());

      list.push({
        approved: alreadyApproved,
        idAddress: key,
        address: value,
      });
    }

    list.sort((a, b) => {
      const aAddr = a.idAddress.toString();
      const bAddr = b.idAddress.toString();

      if (aAddr < bAddr) {
        return -1;
      } else if (aAddr > bAddr) {
        return 1;
      }

      return 0;
    });

    return list;
  }, [props.approvers, txn.approved]);

  return (
    <Card raised>
      <CardHeader
        style={{ borderBottom: '1px solid #eee' }}
        title={
          <Grid container>
            <Grid item>
              <Typography variant="h6">#{txn.id.toString()}</Typography>
            </Grid>
            <Grid item xs>
              <Typography variant="h6" align="right">
                {MsigMethodToString(txn.method)}
              </Typography>
            </Grid>
          </Grid>
        }
      />
      <CardContent>
        <Grid container spacing={2} direction="column">
          <Grid item>
            <Typography component="div">
              <div>To: {txn.to.toString()}</div>
              <div>
                Amount: <TokenAmount amount={txn.value} /> FIL
              </div>
              {txn.params.length > 0 && <div>Params: {txn.params.toString('base64')}</div>}
            </Typography>
          </Grid>
          <Divider />
          <Grid item>
            <Typography variant="subtitle1">Signers</Typography>
            <Typography component="div">
              {approvalsList.map((entry, idx) => {
                return (
                  <div key={entry.idAddress.toString()}>
                    <ApprovedIndicatorDot value={entry.approved} /> {entry.address.toString()}{' '}
                    {idx === 0 && <Chip label="proposer" size="small" />}
                  </div>
                );
              })}
            </Typography>
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
            <Button color="secondary" disabled={disableActions} onClick={handleCancel}>
              Cancel
            </Button>
            <Button color="primary" disabled={disableActions} onClick={handleApprove}>
              Approve
            </Button>
          </Grid>
        </Grid>
      </CardActions>
    </Card>
  );
}
