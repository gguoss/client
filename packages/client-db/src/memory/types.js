// Copyright 2017-2018 Jaco Greeff
// This software may be modified and distributed under the terms
// of the ISC license. See the LICENSE file for details.
// @flow

import type { Trie$Pair } from '@polkadot/util-triehash/types';

export type Memory$Storage = {
  [string]: Trie$Pair
};
