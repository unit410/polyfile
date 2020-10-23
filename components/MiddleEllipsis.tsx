import type { ReactElement } from 'react';

export default function MiddleEllipsis(props: { text: string }): ReactElement {
  const splitIdx = Math.max(0, props.text.length - 8);
  const first = props.text.slice(0, splitIdx);
  const second = props.text.slice(splitIdx);
  return (
    <>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{first}</span>
      <span
        style={{
          direction: 'rtl',
        }}
      >
        {second}
      </span>
    </>
  );
}
