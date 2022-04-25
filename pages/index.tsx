import { Divider, Grid, Typography, Link } from '@material-ui/core';
import React, { ReactElement } from 'react';

export default function Index(): ReactElement {
  return (
    <Grid container direction="column" spacing={2}>
      <Grid item>
        <Typography variant="h2" align="right">
          Welcome to Polyfile!
        </Typography>
      </Grid>
      <Grid item>
        <Typography>
          Polyfile is a tool to propose, review, and approve{' '}
          <Link href="https://www.filecoin.com/" target="_blank">
            Filecoin
          </Link>{' '}
          multisig transactions. Polyfile works with the Filecoin App on{' '}
          <Link href="https://www.ledger.com/" target="_blank">
            Ledger
          </Link>{' '}
          hardware wallets .
        </Typography>
      </Grid>
      <Grid item>
        <Typography>
          Click <strong>Add Multisig Address</strong> in the sidebar to add a multisig address to
          your favorites and get started proposing and reviewing transactions.
        </Typography>
      </Grid>
      <Grid item>
        <Divider />
      </Grid>
      <Grid item>
        <Typography>
          Polyfile is open-source and welcomes contributions.{' '}
          <Link
            href="https://gitlab.com/unit410/polyfile"
            target="_blank"
            title="source code"
            color="inherit"
          >
            gitlab.com/unit410/polyfile
          </Link>
        </Typography>
      </Grid>
      <Grid item>
        <Typography variant="caption">
          <em>
            As far as the law allows, this software comes as is, without any warranty or condition,
            and no contributor will be liable to anyone for any damages related to this software or
            this license, under any kind of legal claim.
          </em>
        </Typography>
      </Grid>
    </Grid>
  );
}
