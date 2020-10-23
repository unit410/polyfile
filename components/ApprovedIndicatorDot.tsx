import { makeStyles } from '@material-ui/core';
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

type ApprovedIndicatorDotProps = {
  value: boolean;
};

export default function ApprovedIndicatorDot(props: ApprovedIndicatorDotProps): ReactElement {
  const classes = useStyle();
  const color = props.value ? 'green' : 'orange';
  return <div className={classes.root} style={{ backgroundColor: color }}></div>;
}
