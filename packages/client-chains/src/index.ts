// Copyright 2017-2018 @polkadot/client-chains authors & contributors
// This software may be modified and distributed under the terms
// of the ISC license. See the LICENSE file for details.

import { Header } from '@polkadot/primitives/header';
import { Config } from '@polkadot/client/types';
import { BlockDb, StateDb } from '@polkadot/client-db/types';
import { ExecutorInterface } from '@polkadot/client-wasm/types';
import { ChainInterface, ChainGenesis, ChainJson } from './types';

import ChainDbs from '@polkadot/client-db/index';
import createRuntime from '@polkadot/client-runtime/index';
import Executor from '@polkadot/client-wasm/index';
import createBlock from '@polkadot/primitives/create/block';
import decodeBlock from '@polkadot/primitives/codec/block/decode';
import encodeBlock from '@polkadot/primitives/codec/block/encode';
import encodeHeader from '@polkadot/primitives/codec/header/encode';
import storage from '@polkadot/storage';
import key from '@polkadot/storage/key';
import assert from '@polkadot/util/assert';
import hexToU8a from '@polkadot/util/hex/toU8a';
import u8aToHex from '@polkadot/util/u8a/toHex';
import logger from '@polkadot/util/logger';
import blake2Asu8a from '@polkadot/util-crypto/blake2/asU8a';
import trieRoot from '@polkadot/trie-hash/root';

import Loader from './loader';

type BlockResult = {
  block: Uint8Array,
  header: Header,
  headerHash: Uint8Array
};

const l = logger('chain');

export default class Chain implements ChainInterface {
  readonly blocks: BlockDb;
  readonly chain: ChainJson;
  readonly executor: ExecutorInterface;
  readonly genesis: ChainGenesis;
  readonly state: StateDb;

  constructor (config: Config) {
    const chain = new Loader(config);
    const dbs = new ChainDbs(config, chain);

    const runtime = createRuntime(dbs.state.db);

    this.chain = chain.chain;
    this.blocks = dbs.blocks;
    this.state = dbs.state;
    this.executor = new Executor(config, dbs.blocks, dbs.state, runtime);
    this.genesis = this.initGenesis();

    const bestHash = dbs.blocks.bestHash.get();
    const bestNumber = dbs.blocks.bestNumber.get();

    l.log(`${this.chain.name}, #${bestNumber.toString()}, ${u8aToHex(bestHash, 48)}`);

    dbs.snapshotState();
  }

  private initGenesis (): ChainGenesis {
    const bestHash = this.blocks.bestHash.get();

    if (!bestHash || !bestHash.length) {
      return this.createGenesis();
    }

    const bestBlock = this.getBlock(bestHash);

    return this.initGenesisFromBest(bestBlock.header);
  }

  private initGenesisFromBest (bestHeader: Header, rollback: boolean = true): ChainGenesis {
    const hexState = u8aToHex(bestHeader.stateRoot, 48);

    l.debug(`Initialising from state ${hexState}`);

    this.state.db.setRoot(bestHeader.stateRoot);

    assert(u8aToHex(this.state.db.getRoot(), 48) === hexState, `Unable to move state to ${hexState}`);

    const genesisHash = this.state.system.blockHashAt.get(0);

    if (!genesisHash || !genesisHash.length) {
      return this.rollbackBlock(bestHeader, rollback);
    }

    const genesisBlock = this.getBlock(genesisHash);

    return {
      ...genesisBlock,
      code: this.getCode()
    };
  }

  private rollbackBlock (bestHeader: Header, rollback: boolean = true): ChainGenesis {
    const prevHash = bestHeader.parentHash;
    const prevNumber = bestHeader.number.subn(1);

    if (rollback && prevNumber.gtn(1)) {
      l.warn(`Unable to validate root, moving to block #${prevNumber.toString()}, ${u8aToHex(prevHash, 48)}`);

      const prevBlock = this.getBlock(prevHash);

      this.blocks.bestHash.set(prevHash);
      this.blocks.bestNumber.set(prevBlock.header.number);

      return this.initGenesisFromBest(prevBlock.header, false);
    }

    throw new Error('Unable to retrieve genesis hash, aborting');
  }

  private getBlock (headerHash: Uint8Array): BlockResult {
    const block = this.blocks.block.get(headerHash);

    if (!block || !block.length) {
      throw new Error(`Unable to retrieve block ${u8aToHex(headerHash)}`);
    }

    const decoded = decodeBlock(block);

    return {
      block,
      header: decoded.header,
      headerHash
    };
  }

  private getCode (): Uint8Array {
    const code = this.state.db.get(
      key(storage.consensus.public.code)()
    );

    if (!code || !code.length) {
      throw new Error('Unable to retrieve genesis code');
    }

    return code;
  }

  private createGenesis (): ChainGenesis {
    this.createGenesisState();

    const genesis = this.createGenesisBlock();

    this.blocks.bestHash.set(genesis.headerHash);
    this.blocks.bestNumber.set(0);
    this.blocks.block.set(genesis.block, genesis.headerHash);

    return genesis;
  }

  private createGenesisBlock (): ChainGenesis {
    const block = createBlock({
      header: {
        stateRoot: this.state.db.getRoot(),
        extrinsicsRoot: trieRoot([])
      }
    });
    const header = encodeHeader(block.header);
    const headerHash = blake2Asu8a(header, 256);

    return {
      block: encodeBlock(block),
      code: this.getCode(),
      header: block.header,
      headerHash
    };
  }

  private createGenesisState (): void {
    const { genesis: { raw } } = this.chain;

    this.state.db.transaction((): boolean => {
      Object
        .keys(raw)
        .forEach((key) =>
          this.state.db.put(
            hexToU8a(key),
            hexToU8a(raw[key])
          )
        );

      return true;
    });
  }
}
