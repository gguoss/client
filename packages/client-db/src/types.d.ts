// Copyright 2017-2018 @polkadot/client-db authors & contributors
// This software may be modified and distributed under the terms
// of the ISC license. See the LICENSE file for details.

import BN from 'bn.js';
import { BaseDb, TxDb } from '@polkadot/db/types';
import { TrieDb } from '@polkadot/trie-db/types';
import { Storage$Key$Value } from '@polkadot/storage/types';

export type DbPathPrefix = 'database';

export type DbConfig$Type = 'disk' | 'memory';

export type DbConfig = {
  compact: boolean,
  isTrieDb: boolean,
  path: string,
  snapshot: boolean,
  type: DbConfig$Type
};

export type StorageMethod<P, R> = {
  del: (...params: Array<Storage$Key$Value>) => void,
  get: (...params: Array<Storage$Key$Value>) => R,
  set: (value: P, ...params: Array<Storage$Key$Value>) => void,
  onUpdate: (callback: (value: P) => void) => void
}

export type StorageMethod$Account = StorageMethod<Uint8Array, Uint8Array>;

export type StorageMethod$Bn = StorageMethod<BN | number, BN>;

export type StorageMethod$Bool = StorageMethod<boolean, boolean>;

export type StorageMethod$U8a = StorageMethod<Uint8Array, Uint8Array>;

export type StorageMethod$ArrayAccount = StorageMethod<Array<Uint8Array>, Array<Uint8Array>>;

export type StorageMethod$ArrayU8a = StorageMethod<Array<Uint8Array>, Array<Uint8Array>>;

export type StorageMethods = StorageMethod$Account | StorageMethod$Bn | StorageMethod$Bool | StorageMethod$U8a | StorageMethod$ArrayU8a | StorageMethod$ArrayAccount;

export type BlockDb = {
  db: BaseDb,
  bestHash: StorageMethod$U8a,
  bestNumber: StorageMethod$Bn,
  block: StorageMethod$U8a,
  header: StorageMethod$U8a
};

export type StateDb$Consensus = {
  authorityAt: StorageMethod$Account,
  authorityCount: StorageMethod$Bn,
  code: StorageMethod$U8a
};

export type StateDb$Council = {
  activeCouncil: StorageMethod$ArrayU8a,
  candidacyBond: StorageMethod$Bn,
  carryCount: StorageMethod$Bn,
  desiredSeats: StorageMethod$Bn,
  inactiveGracePeriod: StorageMethod$Bn,
  presentationDuration: StorageMethod$Bn,
  presentSlashPerVoter: StorageMethod$Bn,
  termDuration: StorageMethod$Bn,
  votingBond: StorageMethod$Bn,
  votingPeriod: StorageMethod$Bn
};

export type StateDb$CouncilVoting = {
  cooloffPeriod: StorageMethod$Bn,
  votingPeriod: StorageMethod$Bn
};

export type StateDb$Democracy = {
  launchPeriod: StorageMethod$Bn,
  minimumDeposit: StorageMethod$Bn,
  votingPeriod: StorageMethod$Bn
};

export type StateDb$Governance = {
  approvalsRatio: StorageMethod$Bn
};

export type StateDb$Parachains = {
  didUpdate: StorageMethod$Bool
};

export type StateDb$Session = {
  length: StorageMethod$Bn,
  validators: StorageMethod$ArrayAccount
};

export type StateDb$Staking = {
  bondingDuration: StorageMethod$Bn,
  currentEra: StorageMethod$Bn,
  freeBalanceOf: StorageMethod$Bn,
  intentions: StorageMethod$ArrayAccount,
  sessionsPerEra: StorageMethod$Bn,
  transactionBaseFee: StorageMethod$Bn,
  transactionByteFee: StorageMethod$Bn,
  validatorCount: StorageMethod$Bn
};

export type StateDb$System = {
  accountIndexOf: StorageMethod$Bn,
  blockHashAt: StorageMethod$U8a
};

export type StateDb$Timestamp = {
  didUpdate: StorageMethod$Bool
};

export type StateDb = {
  db: TrieDb,
  consensus: StateDb$Consensus,
  council: StateDb$Council,
  councilVoting: StateDb$CouncilVoting,
  democracy: StateDb$Democracy,
  parachains: StateDb$Parachains,
  session: StateDb$Session,
  staking: StateDb$Staking,
  system: StateDb$System,
  timestamp: StateDb$Timestamp
};

export interface ChainDbs {
  readonly blocks: BlockDb,
  readonly state: StateDb,

  snapshotState (): void;
}
