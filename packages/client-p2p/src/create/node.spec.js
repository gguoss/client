// Copyright 2017-2018 @polkadot/client-p2p authors & contributors
// This software may be modified and distributed under the terms
// of the ISC license. See the LICENSE file for details.

import LibP2P from 'libp2p';
import PeerId from 'peer-id';
import PeerInfo from 'peer-info';

import isInstanceOf from '@polkadot/util/is/instanceOf';
import logger from '@polkadot/util/logger';

import createNode from './node';

const l = logger('test');

describe('createNode', () => {
  let origPeerInfoCreate;
  let count = 0;

  beforeEach(() => {
    origPeerInfoCreate = PeerInfo.create;
    PeerInfo.create = (callback) => {
      origPeerInfoCreate(new PeerId(Buffer.from([count++])), callback);
    };
  });

  afterEach(() => {
    PeerInfo.create = origPeerInfoCreate;
  });

  it('creates a valid LibP2p instance', async () => {
    const libp2p = await createNode({ p2p: { address: '127.0.0.1', port: 36789 } }, { chain: { bootNodes: [] } }, l);

    expect(
      isInstanceOf(libp2p, LibP2P)
    ).toEqual(true);
  });
});
