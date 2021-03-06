// Copyright 2017-2018 @polkadot/client-db authors & contributors
// This software may be modified and distributed under the terms
// of the ISC license. See the LICENSE file for details.

import { Section } from '@polkadot/params/types';
import { Storages } from '@polkadot/storage/types';
import { TxDb } from '@polkadot/db/types';
import { TrieDb } from '@polkadot/trie-db/types';
import { StateDb } from '../types';

import storage from '@polkadot/storage';

import createAcc from '../db/account';
import createArrAcc from '../db/arrayAccount';
import createArrU8a from '../db/arrayU8a';
import createBn from '../db/bn';
import createBool from '../db/bool';
import createU8a from '../db/u8a';

const BALANCE_SIZE = 128;
const BLOCKNUM_SIZE = 64;

const consensus = (db: TxDb, { public: { authorityAt, authorityCount, code } }: Section<Storages, any, any>) => ({
  authorityAt: createAcc(db, authorityAt),
  authorityCount: createBn(db, authorityCount, 32),
  code: createU8a(db, code)
});

const council = (db: TxDb, { public: { activeCouncil, candidacyBond, carryCount, desiredSeats, inactiveGracePeriod, presentationDuration, presentSlashPerVoter, termDuration, votingBond, votingPeriod } }: Section<Storages, any, any>) => ({
  activeCouncil: createArrU8a(db, activeCouncil),
  candidacyBond: createBn(db, candidacyBond, BALANCE_SIZE),
  carryCount: createBn(db, carryCount, 32),
  desiredSeats: createBn(db, desiredSeats, 32),
  inactiveGracePeriod: createBn(db, inactiveGracePeriod, 32),
  presentationDuration: createBn(db, presentationDuration, BLOCKNUM_SIZE),
  presentSlashPerVoter: createBn(db, presentSlashPerVoter, BALANCE_SIZE),
  termDuration: createBn(db, termDuration, BLOCKNUM_SIZE),
  votingBond: createBn(db, votingBond, BALANCE_SIZE),
  votingPeriod: createBn(db, votingPeriod, BLOCKNUM_SIZE)
});

const councilVoting = (db: TxDb, { public: { cooloffPeriod, votingPeriod } }: Section<Storages, any, any>) => ({
  cooloffPeriod: createBn(db, cooloffPeriod, BLOCKNUM_SIZE),
  votingPeriod: createBn(db, votingPeriod, BLOCKNUM_SIZE)
});

const democracy = (db: TxDb, { public: { launchPeriod, minimumDeposit, votingPeriod } }: Section<Storages, any, any>) => ({
  launchPeriod: createBn(db, launchPeriod, BLOCKNUM_SIZE),
  minimumDeposit: createBn(db, minimumDeposit, BALANCE_SIZE),
  votingPeriod: createBn(db, votingPeriod, BLOCKNUM_SIZE)
});

const parachains = (db: TxDb, { public: { didUpdate } }: Section<Storages, any, any>) => ({
  didUpdate: createBool(db, didUpdate)
});

const session = (db: TxDb, { public: { length, validators } }: Section<Storages, any, any>) => ({
  length: createBn(db, length, BLOCKNUM_SIZE),
  validators: createArrAcc(db, validators)
});

const staking = (db: TxDb, { public: { bondingDuration, currentEra, freeBalanceOf, intentions, sessionsPerEra, transactionBaseFee, transactionByteFee, validatorCount } }: Section<Storages, any, any>) => ({
  bondingDuration: createBn(db, bondingDuration, BLOCKNUM_SIZE),
  currentEra: createBn(db, currentEra, BLOCKNUM_SIZE),
  freeBalanceOf: createBn(db, freeBalanceOf, BALANCE_SIZE),
  intentions: createArrAcc(db, intentions),
  sessionsPerEra: createBn(db, sessionsPerEra, BLOCKNUM_SIZE),
  transactionBaseFee: createBn(db, transactionBaseFee, BALANCE_SIZE),
  transactionByteFee: createBn(db, transactionByteFee, BALANCE_SIZE),
  validatorCount: createBn(db, validatorCount, 32)
});

const system = (db: TxDb, { public: { accountIndexOf, blockHashAt } }: Section<Storages, any, any>) => ({
  accountIndexOf: createBn(db, accountIndexOf, 32),
  blockHashAt: createU8a(db, blockHashAt)
});

const timestamp = (db: TxDb, { public: { didUpdate } }: Section<Storages, any, any>) => ({
  didUpdate: createBool(db, didUpdate)
});

export default function createState (db: TrieDb): StateDb {
  return {
    db,
    consensus: consensus(db, storage.consensus),
    council: council(db, storage.council),
    councilVoting: councilVoting(db, storage.councilVoting),
    democracy: democracy(db, storage.democracy),
    parachains: parachains(db, storage.parachains),
    session: session(db, storage.session),
    staking: staking(db, storage.staking),
    system: system(db, storage.system),
    timestamp: timestamp(db, storage.timestamp)
  };
}
