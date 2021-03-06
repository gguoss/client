// Copyright 2017-2018 @polkadot/client-rpc authors & contributors
// This software may be modified and distributed under the terms
// of the ISC license. See the LICENSE file for details.

import createKoa from './koa';

describe('createKoa', () => {
  it('creates an HTTP interface', () => {
    expect(
      createKoa({
        handlers: {
          http: () => true,
          ws: () => true
        },
        path: '/',
        types: ['http']
      })
    ).toHaveLength(1);
  });

  it('creates an WS interface', () => {
    expect(
      createKoa({
        handlers: {
          http: () => true,
          ws: () => true
        },
        path: '/',
        types: ['ws']
      })
    ).toHaveLength(1);
  });

  it('creates an HTTP + WS interface', () => {
    expect(
      createKoa({
        handlers: {
          http: () => true,
          ws: () => true
        },
        path: '/',
        types: ['http', 'ws']
      })
    ).toHaveLength(2);
  });
});
