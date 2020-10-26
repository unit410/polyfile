import { makeStyles, useTheme } from '@material-ui/core';
import { ReactElement } from 'react';

const useStyle = makeStyles({
  root: {
    width: '8px',
    height: '8px',
    display: 'inline-block',
    backgroundColor: 'grey',
    borderRadius: '4px',
    margin: '1px',
  },
});

type StatusDotProps = {
  variant: 'ok' | 'warning' | 'error';
};

export default function StatusDot(props: StatusDotProps): ReactElement {
  const classes = useStyle();
  const theme = useTheme();

  const statusToColor = {
    ok: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.dark,
  };

  const color = statusToColor[props.variant];
  return <div className={classes.root} style={{ backgroundColor: color }}></div>;
}
