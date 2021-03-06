// Copyright 2017-2018 @polkadot/client-p2p-messages authors & contributors
// This software may be modified and distributed under the terms
// of the ISC license. See the LICENSE file for details.

import { BlockNumber, HeaderHash } from '@polkadot/primitives/base';
import { Role } from '@polkadot/primitives/role';
import { MessageInterface, StatusMessage } from './types';

import rolesToId from '@polkadot/primitives/role/toId';
import rolesFromId from '@polkadot/primitives/role/fromId';
import u8aConcat from '@polkadot/util/u8a/concat';
import u8aToBn from '@polkadot/util/u8a/toBn';
import bnToU8a from '@polkadot/util/bn/toU8a';
import bnToHex from '@polkadot/util/bn/toHex';
import u8aToHex from '@polkadot/util/u8a/toHex';

import BaseMessage from './BaseMessage';

const ROLES_OFF = 4;
const BEST_OFF = ROLES_OFF + 1;
const HASH_OFF = BEST_OFF + 8;
const GEN_OFF = HASH_OFF + 32;
const CHAIN_OFF = GEN_OFF + 32;

export default class Status extends BaseMessage implements MessageInterface, StatusMessage {
  static type = 0;

  bestHash: HeaderHash;
  bestNumber: BlockNumber;
  chainStatus: Uint8Array;
  genesisHash: HeaderHash;
  roles: Array<Role>;
  version: number;

  constructor ({ bestHash, bestNumber, genesisHash, roles, version }: StatusMessage) {
    super(Status.type);

    this.bestHash = bestHash;
    this.bestNumber = bestNumber;
    this.chainStatus = new Uint8Array([1]);
    this.genesisHash = genesisHash;
    this.roles = roles;
    this.version = version;
  }

  encode (): Uint8Array {
    return u8aConcat(
      super.encode(),
      bnToU8a(this.version, 32, true),
      bnToU8a(rolesToId(this.roles), 8, true),
      bnToU8a(this.bestNumber, 64, true),
      this.bestHash,
      this.genesisHash,
      bnToU8a(this.chainStatus.length, 32, true),
      this.chainStatus
    );
  }

  toJSON (): any {
    return {
      bestNumber: bnToHex(this.bestNumber),
      bestHash: u8aToHex(this.bestHash),
      genesisHash: u8aToHex(this.genesisHash),
      roles: this.roles
    };
  }

  static decode (u8a: Uint8Array): Status {
    return new Status({
      version: u8aToBn(u8a.subarray(0, ROLES_OFF), true).toNumber(),
      roles: rolesFromId(u8a[ROLES_OFF]),
      bestNumber: u8aToBn(u8a.subarray(BEST_OFF, HASH_OFF), true),
      bestHash: u8a.slice(HASH_OFF, GEN_OFF),
      genesisHash: u8a.slice(GEN_OFF, CHAIN_OFF)
      // ignoring chainStatus for now
    });
  }
}
