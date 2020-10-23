// https://github.com/filecoin-project/specs-actors/blob/master/actors/builtin/multisig/multisig_actor.go#L53
export enum MsigMethod {
  Send = 0,
  Propose = 2,
  Approve = 3,
  Cancel = 4,
  AddSigner = 5,
  RemoveSigner = 6,
  SwapSigner = 7,
  ChangeNumApprovalsThreshold = 8,
  LockBalance = 9,
}

export function MsigMethodToString(method: MsigMethod): string {
  switch (method) {
    case MsigMethod.Send:
      return 'Send';
    case MsigMethod.Propose:
      return 'Propose';
    case MsigMethod.Approve:
      return 'Approve';
    case MsigMethod.Cancel:
      return 'Cancel';
    case MsigMethod.AddSigner:
      return 'Add Signer';
    case MsigMethod.RemoveSigner:
      return 'Remove Signer';
    case MsigMethod.SwapSigner:
      return 'Swap Signer';
    case MsigMethod.ChangeNumApprovalsThreshold:
      return 'Change Threshold';
    case MsigMethod.LockBalance:
      return 'Lock Balance';
    default:
      return 'Unknown';
  }
}
