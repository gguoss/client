// Copyright 2017-2018 @polkadot/client-p2p authors & contributors
// This software may be modified and distributed under the terms
// of the ISC license. See the LICENSE file for details.

import { P2pInterface, PeerInterface } from '../types';
import { Handler } from './types';

import Transactions from '@polkadot/client-p2p-messages/Transactions';

// TODO Propagate
function handleTransactions (self: P2pInterface, peer: PeerInterface, message: Transactions): void {
  self.l.debug(() => [peer.shortId, 'Transactions', JSON.stringify(message)]);
}

(handleTransactions as Handler).type = Transactions.type;

export default (handleTransactions as Handler);
