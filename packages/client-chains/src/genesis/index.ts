// Copyright 2017-2018 @polkadot/client-chains authors & contributors
// This software may be modified and distributed under the terms
// of the ISC license. See the LICENSE file for details.

import { ChainState, ChainGenesis, ChainGenesisState } from '../types';

import initBlock from './block';
import initState from './state';

export default function initGenesis (self: ChainState, initialState: ChainGenesisState): ChainGenesis {
  initState(self, initialState);

  const genesis = initBlock(self);

  self.blockDb.bestHash.set(genesis.headerHash);
  self.blockDb.bestNumber.set(0);
  self.blockDb.block.set(genesis.block, genesis.headerHash);

  self.stateDb.system.blockHashAt.set(genesis.headerHash, 0);
  self.stateDb.db.commit();

  return genesis;
}