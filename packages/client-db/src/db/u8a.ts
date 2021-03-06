// Copyright 2017-2018 @polkadot/client-db authors & contributors
// This software may be modified and distributed under the terms
// of the ISC license. See the LICENSE file for details.

import { SectionItem } from '@polkadot/params/types';
import { Storage$Key$Value } from '@polkadot/storage/types';
import { BaseDb } from '@polkadot/db/types';
import { StorageMethod$U8a } from '../types';

import creator from '../key';
import createBase from './base';

export default function decodeU8a <T> (db: BaseDb, key: SectionItem<T>): StorageMethod$U8a {
  const createKey = creator(key);
  const base = createBase<Uint8Array>(db);

  return {
    del: (...keyParams: Array<Storage$Key$Value>): void =>
      base.del(createKey(keyParams)),
    get: (...keyParams: Array<Storage$Key$Value>): Uint8Array =>
      base.get(createKey(keyParams)),
    set: (value: Uint8Array, ...keyParams: Array<Storage$Key$Value>): void =>
      base.set(createKey(keyParams), value, value),
    onUpdate: (updater: (value: Uint8Array, raw: Uint8Array) => void): void =>
      base.onUpdate(updater)
  };
}
