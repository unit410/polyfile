import { makeStyles } from '@material-ui/core';
import { PropsWithChildren, ReactElement } from 'react';

const useStyle = makeStyles({
  root: {
    display: 'flex',
    position: 'absolute',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
  },
});

export default function ColumnLayout(props: PropsWithChildren<unknown>): ReactElement {
  const classes = useStyle();
  return <div className={classes.root}>{props.children}</div>;
}
