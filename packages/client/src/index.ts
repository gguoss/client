// Copyright 2017-2018 @polkadot/client authors & contributors
// This software may be modified and distributed under the terms
// of the ISC license. See the LICENSE file for details.

import { Config } from './types';
import { ChainInterface } from '@polkadot/client-chains/types';
import { P2pInterface } from '@polkadot/client-p2p/types';
import { RpcInterface } from '@polkadot/client-rpc/types';
import { TelemetryInterface } from '@polkadot/client-telemetry/types';

import './license';

import BN from 'bn.js';
import Chain from '@polkadot/client-chains/index';
import Telemetry from '@polkadot/client-telemetry/index';
import logger from '@polkadot/util/logger';
import Rpc from '@polkadot/client-rpc/index';
import P2p from '@polkadot/client-p2p/index';
import isUndefined from '@polkadot/util/is/undefined';
import u8aToHex from '@polkadot/util/u8a/toHex';

import * as clientId from './clientId';
import defaults from './defaults';
import cli from './cli';

const l = logger('client');

class Client {
  private chain?: ChainInterface;
  private informantId?: NodeJS.Timer;
  private p2p?: P2pInterface;
  private rpc?: RpcInterface;
  private telemetry?: TelemetryInterface;
  private prevBest?: BN;
  private prevTime: number;

  constructor () {
    this.prevTime = Date.now();
  }

  async start (config: Config) {
    const verStatus = await clientId.getNpmStatus();

    l.log(`Running version ${clientId.version} (${verStatus})`);
    l.log(`Initialising for roles=${config.roles.join(',')} on chain=${config.chain}`);

    this.chain = new Chain(config);
    this.p2p = new P2p(config, this.chain);
    this.rpc = new Rpc(config, this.chain);
    this.telemetry = new Telemetry(config, this.chain);

    await this.p2p.start();
    await this.rpc.start();
    await this.telemetry.start();

    this.startInformant();
  }

  stop () {
    this.stopInformant();

    // TODO We need to destroy/stop the p2p, rpc, etc interfaces created in the start()
    // here as well.
  }

  private startInformant () {
    this.informantId = setInterval(this.runInformant, defaults.INFORMANT_DELAY);

    if (isUndefined(this.p2p)) {
      return;
    }

    this.p2p.sync.on('imported', () => {
      if (!isUndefined(this.telemetry)) {
        this.telemetry.blockImported();
      }
    });
  }

  private stopInformant () {
    if (!isUndefined(this.informantId)) {
      clearInterval(this.informantId);
    }

    this.informantId = undefined;
  }

  private runInformant = () => {
    if (isUndefined(this.chain) || isUndefined(this.p2p) || isUndefined(this.rpc)) {
      this.stopInformant();

      return;
    }

    const now = Date.now();
    const elapsed = now - this.prevTime;
    const numPeers = this.p2p.getNumPeers();
    const bestHash = this.chain.blocks.bestHash.get();
    const bestNumber = this.chain.blocks.bestNumber.get();
    const status = this.p2p.sync.status;
    const isSync = status === 'Sync';
    const hasBlocks = this.prevBest && this.prevBest.lt(bestNumber);
    const numBlocks = hasBlocks && this.prevBest ? bestNumber.sub(this.prevBest) : new BN(1);
    const newSpeed = isSync
      ? ` (${(elapsed / numBlocks.toNumber()).toFixed(0)} ms/block)`
      : '';
    const newBlocks = hasBlocks && this.prevBest
      ? `, +${numBlocks.toString()} blocks${newSpeed}`
      : '';
    const target = isSync
      ? `, target #${this.p2p.sync.bestSeen.toString()}`
      : '';

    l.log(`${status} (${numPeers} peers)${target}, current #${bestNumber.toNumber()}, ${u8aToHex(bestHash, 48)}${newBlocks}`);

    this.prevBest = bestNumber;
    this.prevTime = now;

    if (!isUndefined(this.telemetry)) {
      this.telemetry.intervalInfo(numPeers, status);
    }
  }
}

new Client()
  .start(cli())
  .catch((error) => {
    console.error('Failed to start client', error);
  });
