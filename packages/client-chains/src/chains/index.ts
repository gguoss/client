// Copyright 2017-2018 @polkadot/client-chains authors & contributors
// This software may be modified and distributed under the terms
// of the ISC license. See the LICENSE file for details.

import { ChainJson } from '../types';

const dev = (require('./dev.json') as ChainJson);
const krummelanke = (require('./krummelanke.json') as ChainJson);

export default ({
  dev,
  krummelanke,
  test: krummelanke
} as { [index: string]: ChainJson });
