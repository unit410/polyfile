import { ReactElement } from 'react';

type TokenAmountProps = {
  amount: BigInt;
};

export type { TokenAmountProps };
export default function TokenAmount(props: TokenAmountProps): ReactElement {
  const str = props.amount.toString();

  let decimal = str.slice(Math.max(0, str.length - 18));
  const whole = str.slice(0, Math.max(0, str.length - 18));

  // leaves one zero after the first decimal value
  decimal = decimal.replace(/(0{3})+$/, '');

  const wholeBigInt = BigInt(whole);
  return (
    <>
      {wholeBigInt.toLocaleString()}.{decimal}
    </>
  );
}
