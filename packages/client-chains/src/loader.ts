// Copyright 2017-2018 @polkadot/client-chains authors & contributors
// This software may be modified and distributed under the terms
// of the ISC license. See the LICENSE file for details.

import { Config } from '@polkadot/client/types';
import { ChainJson, ChainLoader } from './types';

import trieRoot from '@polkadot/trie-hash/root';
import assert from '@polkadot/util/assert';
import hexToU8a from '@polkadot/util/hex/toU8a';

import chains from './chains';

export default class Loader implements ChainLoader {
  readonly chain: ChainJson;
  readonly id: string;
  readonly genesisRoot: Uint8Array;

  constructor ({ chain }: Config) {
    this.chain = chains[chain];

    assert(this.chain, `Unable to find builtin chain '${chain}'`);

    this.genesisRoot = this.calculateGenesisRoot();
    this.id = this.chain.id;
  }

  private calculateGenesisRoot (): Uint8Array {
    const { genesis: { raw } } = this.chain;

    return trieRoot(
      Object.keys(raw).map((key) => ({
        k: hexToU8a(key),
        v: hexToU8a(raw[key])
      }))
    );
  }
}
