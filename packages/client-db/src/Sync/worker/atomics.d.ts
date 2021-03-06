// Copyright 2017-2018 @polkadot/client-db authors & contributors
// This software may be modified and distributed under the terms
// of the ISC license. See the LICENSE file for details.

declare type Notifiers = {
  notify (state: Int32Array, command: number): void,
  notifyOnDone (state: Int32Array, fn: () => Promise<any>): Promise<void>,
  notifyOnValue (state: Int32Array, buffer: Uint8Array, fn: () => Promise<Uint8Array | null>): Promise<void>,
  wait (state: Int32Array, command: number): void
}

declare const notifiers: Notifiers;

export = notifiers;
