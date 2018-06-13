// Copyright 2017-2018 @polkadot/client-p2p authors & contributors
// This software may be modified and distributed under the terms
// of the ISC license. See the LICENSE file for details.
// @flow

import type { P2pNodes } from '../types';

const PeerBook = require('peer-book');

const createPeerInfo = require('./peerInfo');

module.exports = async function createPeerBook (peers: P2pNodes = []): Promise<PeerBook> {
  const peerBook = new PeerBook();
  const peerInfos = await Promise.all(
    peers.map((peer) => createPeerInfo([peer]))
  );

  peerInfos.forEach((peerInfo) => {
    peerBook.put(peerInfo);
  });

  return peerBook;
};
