// Copyright 2017-2018 @polkadot/client authors & contributors
// This software may be modified and distributed under the terms
// of the ISC license. See the LICENSE file for details.

import keyToCamel from './keyToCamel';

describe('keyToCamel', () => {
  it('formats everything by default', () => {
    expect(
      keyToCamel('foo-bar-baz-doh')
    ).toEqual('fooBarBazDoh');
  });

  it('returns multi"-" formatted (offset specified)', () => {
    expect(
      keyToCamel('foo-bar-baz-doh', 1)
    ).toEqual('barBazDoh');
  });
});
