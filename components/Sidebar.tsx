import {
  makeStyles,
  List,
  ListItem,
  Typography,
  Button,
  ListItemSecondaryAction,
  IconButton,
  Link,
} from '@material-ui/core';
import React, { ReactElement, useCallback } from 'react';
import { useDialog } from 'muibox';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import NextLink from 'next/link';
import { useRouter } from 'next/dist/client/router';
import { Gitlab } from 'mdi-material-ui';

import MiddleEllipsis from '~/components/MiddleEllipsis';
import useIsMounted from '~/hooks/useIsMounted';
import useFavAddresses from '~/hooks/useFavAddresses';

const useStyle = makeStyles((theme) => ({
  root: {
    overflow: 'auto',
    backgroundColor: '#5065d8',
    boxShadow: '1px 0px 2px rgba(0, 0, 0, 0.25)',
    width: '300px',
    minWidth: '300px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  spacer: {
    flexGrow: 1,
  },
  footer: {
    padding: theme.spacing(1),
    textAlign: 'center',
    color: 'white',
  },
}));

export default function Sidebar(): ReactElement {
  const classes = useStyle();
  const dialog = useDialog();

  const router = useRouter();
  const [favAddresses, addFavAddress, removeFavAddress] = useFavAddresses();
  const isMounted = useIsMounted();

  const handleRemoveActor = useCallback(
    (address) => {
      removeFavAddress(address);
    },
    [removeFavAddress],
  );

  const handleAddActor = useCallback(async () => {
    const address = await dialog
      .prompt({
        title: 'Add Multisig Address',
        message: 'Enter a multisig address save in your favorites.',
        placeholder: 'f2...',
        required: true,
      })
      // error thrown if dialog is canceled
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .catch(() => {});

    if (!address || !isMounted.current) {
      return;
    }

    addFavAddress(address);
    router.push({
      pathname: '/msig',
      query: {
        actor: address,
      },
    });
  }, [addFavAddress, dialog, isMounted, router]);

  return (
    <div className={classes.root}>
      <div style={{ width: '100%' }}>
        <List>
          {favAddresses.map((address) => (
            <NextLink
              key={address}
              href={{ pathname: '/msig', query: { actor: address } }}
              passHref
            >
              <ListItem button>
                <Typography
                  style={{ color: 'white', display: 'flex', width: '100%' }}
                  component="div"
                >
                  <MiddleEllipsis text={address} />
                </Typography>
                <ListItemSecondaryAction>
                  <IconButton
                    size="small"
                    edge="end"
                    aria-label="remove"
                    color="primary"
                    onClick={() => handleRemoveActor(address)}
                  >
                    <HighlightOffIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </NextLink>
          ))}
        </List>
        <div style={{ textAlign: 'right' }}>
          <Button style={{ color: 'white' }} color="primary" onClick={handleAddActor}>
            Add Multisig Address
          </Button>
        </div>
      </div>
      <div className={classes.spacer}></div>
      <div className={classes.footer}>
        <Link
          href="https://gitlab.com/polychainlabs/polyfile"
          target="_blank"
          title="source code"
          color="inherit"
        >
          <Gitlab />
        </Link>
      </div>
    </div>
  );
}
