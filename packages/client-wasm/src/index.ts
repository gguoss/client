// Copyright 2017-2018 @polkadot/client-wasm authors & contributors
// This software may be modified and distributed under the terms
// of the ISC license. See the LICENSE file for details.

import { Config } from '@polkadot/client/types';
import { BlockDb, StateDb } from '@polkadot/client-db/types';
import { RuntimeInterface } from '@polkadot/client-runtime/types';
import { UncheckedRaw } from '@polkadot/primitives/extrinsic';
import { ExecutorInterface, Executor$BlockImportResult } from './types';

import decodeRaw from '@polkadot/primitives/codec/block/decodeRaw';
import createHeader from '@polkadot/primitives/create/header';
import decodeHeader from '@polkadot/primitives/codec/header/decode';
import encodeBlock from '@polkadot/primitives/codec/block/encode';
import encodeHeader from '@polkadot/primitives/codec/header/encode';
import encodeLength from '@polkadot/extrinsics/codec/encode/length';
import extrinsics from '@polkadot/extrinsics';
import encodeUnchecked from '@polkadot/extrinsics/codec/encode/unchecked';
import storage from '@polkadot/storage';
import key from '@polkadot/storage/key';
import assert from '@polkadot/util/assert';
import u8aToHex from '@polkadot/util/u8a/toHex';
import logger from '@polkadot/util/logger';
import testingKeypairs from '@polkadot/util-keyring/testingPairs';
import blake2Asu8a from '@polkadot/util-crypto/blake2/asU8a';

import createWasm from './create';
import proxy from './wasm/proxy_substrate_wasm';

type CallResult = {
  bool: boolean,
  lo: number,
  hi: number
};

type Call = (...data: Array<Uint8Array>) => CallResult;

type CallU8a = (...data: Array<Uint8Array>) => Uint8Array;

const CODE_KEY = key(storage.consensus.public.code)();
const keyring = testingKeypairs();
const timestampSet = extrinsics.timestamp.public.set;
const parachainsSet = extrinsics.parachains.public.setHeads;

const l = logger('executor');

export default class Executor implements ExecutorInterface {
  private blockDb: BlockDb;
  private config: Config;
  private runtime: RuntimeInterface;
  private stateDb: StateDb;

  // 0xefbfbd2065efbfbdefbfbd33efbfbdefbfbdc6b21aefbfbd592157efbfbdefbfbdefbfbdefbfbd1defbfbdefbfbdefbfbd77efbfbdefbfbd4befbfbd0fefbfbd22efbfbd41346b63efbfbd1eefbfbd2011efbfbd25efbfbdddb9d2a51021

  constructor (config: Config, blockDb: BlockDb, stateDb: StateDb, runtime: RuntimeInterface) {
    this.blockDb = blockDb;
    this.config = config;
    this.stateDb = stateDb;
    this.runtime = runtime;
  }

  applyExtrinsic (extrinsic: UncheckedRaw): boolean {
    const start = Date.now();

    l.debug(() => 'Apply extrinsic');

    const result = this.call('apply_extrinsic')(
      encodeLength(extrinsic)
    );

    l.debug(() => `Apply extrinsic completed (${Date.now() - start}ms)`);

    return result.bool;
  }

  applyExtrinsics (extrinsics: Array<UncheckedRaw>): void {
    extrinsics.forEach((extrinsic) =>
      this.applyExtrinsic(extrinsic)
    );
  }

  executeBlock (block: Uint8Array, forceNew: boolean = false): boolean {
    const start = Date.now();

    l.debug(() => 'Executing block');

    const result = this.call('execute_block', forceNew)(block);

    l.debug(() => `Block execution completed (${Date.now() - start}ms)`);

    return result.bool;
  }

  finaliseBlock (header: Uint8Array): Uint8Array {
    const start = Date.now();

    l.debug(() => 'Finalising block');

    const result = this.callAsU8a('finalise_block')(header);

    l.debug(() => `Block finalised (${Date.now() - start}ms)`);

    return result;
  }

  generateBlock (utxs: Array<UncheckedRaw>, timestamp: number = Math.ceil(Date.now() / 1000)): Uint8Array {
    const start = Date.now();
    const bestNumber = this.blockDb.bestNumber.get();
    const nextNumber = bestNumber.addn(1);
    let block = new Uint8Array();

    l.debug(() => `Generating block #${nextNumber.toString()}`);

    this.stateDb.db.transaction((): boolean => {
      const extrinsics = this.withInherent(timestamp, utxs);
      const header = createHeader({
        number: nextNumber,
        parentHash: this.blockDb.bestHash.get()
      }, extrinsics);
      const headerRaw = encodeHeader(header);

      this.initialiseBlock(headerRaw);
      this.applyExtrinsics(extrinsics);

      const { stateRoot } = decodeHeader(
        this.finaliseBlock(headerRaw)
      );
      block = encodeBlock({
        extrinsics,
        header: { ...header, stateRoot }
      });

      l.log(() => `Block #${nextNumber.toString()} generated (${Date.now() - start}ms)`);

      return false;
    });

    return block;
  }

  importBlock (block: Uint8Array): Executor$BlockImportResult {
    const start = Date.now();

    // tslint:disable-next-line:variable-name
    const { body, extrinsics, header, number } = decodeRaw(block);
    const headerHash = blake2Asu8a(header, 256);

    l.debug(() => `Importing block #${number.toString()}, ${u8aToHex(headerHash, 48)}`);

    try {
      this.stateDb.db.transaction(() =>
        this.executeBlock(block)
      );
    } catch (error) {
      l.error(`Failed importing #${number.toString()}, ${u8aToHex(headerHash, 48)}`);

      throw error;
    }

    this.blockDb.bestHash.set(headerHash);
    this.blockDb.bestNumber.set(number);
    this.blockDb.block.set(block, headerHash);

    l.debug(() => `Imported block #${number.toString()} (${Date.now() - start}ms)`);

    return {
      body,
      extrinsics,
      headerHash,
      header
    };
  }

  initialiseBlock (header: Uint8Array): boolean {
    const start = Date.now();

    l.debug(() => 'Initialising block');

    const result = this.call('initialise_block')(header);

    l.debug(() => `Block initialised (${Date.now() - start}ms)`);

    return result.bool;
  }

  private call (name: string, forceNew: boolean = false): Call {
    const code = this.stateDb.db.get(CODE_KEY);

    assert(code, 'Expected to have code available in runtime');

    // @ts-ignore code check above
    const instance = createWasm({ config: this.config, l }, this.runtime, code, proxy, forceNew);
    const { heap } = this.runtime.environment;

    return (...data: Array<Uint8Array>): CallResult => {
      const start = Date.now();

      l.debug(() => ['preparing', name]);
      // runtime.instrument.start();

      const params = data.reduce((params, data) => {
        l.debug(() => ['storing', u8aToHex(data)]);

        params.push(heap.set(heap.allocate(data.length), data));
        params.push(data.length);

        return params;
      }, ([] as number[]));

      l.debug(() => ['executing', name, params]);

      const lo: number = instance[name].apply(null, params);
      const hi: number = instance['get_result_hi']();

      // l.debug(() => runtime.instrument.stop());
      l.debug(() => [name, 'returned', [lo, hi], `(${Date.now() - start}ms)`]);

      return {
        bool: hi === 0 && lo === 1,
        hi,
        lo
      };
    };
  }

  private callAsU8a (name: string): CallU8a {
    const fn = this.call(name);
    const { heap } = this.runtime.environment;

    return (...data: Array<Uint8Array>): Uint8Array => {
      const { hi, lo } = fn.apply(null, data);
      const result = heap.get(lo, hi).slice();

      l.debug(() => ['received', u8aToHex(result)]);

      return result;
    };
  }

  private withInherent (timestamp: number, _extrinsics: Array<UncheckedRaw>): Array<UncheckedRaw> {
    return [
      encodeUnchecked(keyring.nobody, 0)(
        timestampSet,[timestamp]
      ),
      encodeUnchecked(keyring.nobody, 0)(
        parachainsSet, [[]]
      )
    ].concat(_extrinsics);
  }
}
