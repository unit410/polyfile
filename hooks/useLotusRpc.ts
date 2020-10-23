import { useState } from 'react';

import LotusRpc from '~/services/LotusRpc';

export default function useLotusRpc(): LotusRpc {
  const [rpc] = useState(new LotusRpc('https://api.node.glif.io/rpc/v0'));
  return rpc;
}
