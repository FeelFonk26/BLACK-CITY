export type StoredRoundOutcome = { headline: string; detail: string; multiplier: number };

export type StoredRoundRow = {
  id: string;
  mode: string;
  stake: string | number;
  payout: string | number | null;
  status: string;
  outcome: StoredRoundOutcome | null;
};

export function serializeStoredRound(row: StoredRoundRow) {
  const { outcome, ...round } = row;
  return {
    ...round,
    stake: Number(round.stake),
    payout: Number(round.payout ?? 0),
    ...(outcome ? { outcome } : {}),
  };
}
