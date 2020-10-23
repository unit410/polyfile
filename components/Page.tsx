import { makeStyles } from '@material-ui/core';
import { PropsWithChildren, ReactElement } from 'react';

const useStyle = makeStyles((theme) => ({
  root: {
    overflow: 'auto',
    flexGrow: 1,
    padding: theme.spacing(2),
  },
}));

export default function Page(props: PropsWithChildren<unknown>): ReactElement {
  const classes = useStyle();

  return <div className={classes.root}>{props.children}</div>;
}
