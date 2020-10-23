import {
  makeStyles,
  List,
  ListItem,
  Typography,
  Button,
  ListItemSecondaryAction,
  IconButton,
} from '@material-ui/core';
import React, { ReactElement, useCallback } from 'react';
import { useDialog } from 'muibox';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';

import MiddleEllipsis from '~/components/MiddleEllipsis';
import useIsMounted from '~/hooks/useIsMounted';
import useFavAddresses from '~/hooks/useFavAddresses';
import Link from '~/components/Link';

const useStyle = makeStyles(() => ({
  root: {
    overflow: 'auto',
    backgroundColor: '#5065d8',
    boxShadow: '1px 0px 2px rgba(0, 0, 0, 0.25)',
    width: '300px',
    minWidth: '300px',
    flexShrink: 0,
  },
}));

export default function Sidebar(): ReactElement {
  const classes = useStyle();
  const dialog = useDialog();

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
  }, [addFavAddress, dialog, isMounted]);

  return (
    <div className={classes.root}>
      <List>
        {favAddresses.map((address) => (
          <ListItem
            button
            key={address}
            component={Link}
            href={{ pathname: '/msig', query: { actor: address } }}
          >
            <Typography style={{ color: 'white', display: 'flex', width: '100%' }} component="div">
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
        ))}
        ;
      </List>
      <div style={{ textAlign: 'right' }}>
        <Button style={{ color: 'white' }} color="primary" onClick={handleAddActor}>
          Add
        </Button>
      </div>
    </div>
  );
}
