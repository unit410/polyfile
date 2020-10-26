import React, { ReactElement } from 'react';
import {
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@material-ui/core';

import { useLedger } from '~/components/LedgerProvider';
import useAsync from '~/hooks/useAsync';
import { WalletAddress } from '~/common/Wallet';
import Address from '~/common/Address';

export default function Settings(): ReactElement {
  const ledger = useLedger();

  const [version] = useAsync(async () => {
    if (!ledger) {
      return;
    }

    const resp = await ledger.appInfo();
    if (resp.appName !== 'Filecoin') {
      return;
    }

    return resp.appVersion;
  }, [ledger]);

  const [addresses, addressesErr] = useAsync(async () => {
    const addresses = new Array<WalletAddress>();

    if (!ledger) {
      return addresses;
    }

    // Load the first 5 addresses from the ledger
    // This path is compatible with glif wallet addresses when using ledger
    const pathBase = "m/44'/461'/0'/0";
    for (let i = 0; i < 5; ++i) {
      const path = `${pathBase}/${i}`;
      const addrResponse = await ledger.getAddressAndPubKey(path);
      if (addrResponse.error_message !== 'No errors') {
        console.error(new Error(`Error loading address at ${path}: ${addrResponse.error_message}`));
        continue;
      }

      addresses.push({
        path,
        address: Address.FromString(addrResponse.addrString),
      });
    }
    return addresses;
  }, [ledger]);

  return (
    <Grid container direction="column" spacing={2}>
      <Grid item>
        <Typography>Ledger App Version: {version}</Typography>
      </Grid>
      {addressesErr && <Grid item>{addressesErr.message}</Grid>}
      <Grid item>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Address</TableCell>
                <TableCell align="right">Path</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {addresses?.map((address) => (
                <TableRow key={address.path}>
                  <TableCell component="th" scope="row">
                    {address.address.toString()}
                  </TableCell>
                  <TableCell align="right">{address.path}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
}
