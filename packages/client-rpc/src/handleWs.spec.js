// Copyright 2017-2018 @polkadot/client-rpc authors & contributors
// This software may be modified and distributed under the terms
// of the ISC license. See the LICENSE file for details.

jest.mock('@polkadot/client-rpc-handlers/index', () => () => ({
  test: jest.fn(() => Promise.resolve('test'))
}));

import isFunction from '@polkadot/util/is/function';

import Rpc from './index';

describe('handleWs', () => {
  let context;
  let handler;
  let server;

  beforeEach(() => {
    const config = {
      rpc: {
        port: 9901,
        path: '/',
        types: ['ws']
      }
    };
    context = {
      websocket: {
        on: jest.fn((type, cb) => {
          if (type === 'message') {
            handler = cb;
          }
        }),
        send: jest.fn(() => true)
      }
    };

    server = new Rpc(config, {});
  });

  it('calls the socket with the result', () => {
    server.handleWs(context);

    return handler(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'test',
        params: ['a', 'b']
      })
    ).then(() => {
      expect(
        context.websocket.send
      ).toHaveBeenCalledWith('{"id":1,"jsonrpc":"2.0","result":"test"}');
    });
  });
});
