// ISC, Copyright 2017 Jaco Greeff

const PeerId = require('peer-id');
const PeerInfo = require('peer-info');

const isInstanceOf = require('@polkadot/util/is/instanceOf');

const StatusMessage = require('./message/status');
const { streamReader, streamWriter } = require('./stream');
const { PROTOCOL } = require('./defaults');
const Server = require('./index');

describe('Server', () => {
  let config;
  let state;
  let origPeerInfoCreate;
  let count = 0;
  let server;

  beforeEach(() => {
    config = {
      p2p: {
        address: '127.0.0.1',
        port: 36677,
        peers: []
      }
    };
    state = {
      chain: {}
    };

    origPeerInfoCreate = PeerInfo.create;
    PeerInfo.create = (callback) => {
      origPeerInfoCreate(new PeerId(Buffer.from([count++])), callback);
    };
    server = new Server(config, state, false);
  });

  afterEach(() => {
    PeerInfo.create = origPeerInfoCreate;

    return server.stop();
  });

  it('creates the instance', () => {
    expect(
      server
    ).toBeDefined();
  });

  describe('peers', () => {
    it('returns the peers via .peers', () => {
      server._peers = { 'peers': 'something' };

      expect(
        server.peers
      ).toEqual(server._peers);
    });
  });

  describe('isStarted', () => {
    it('returns the started status (false)', () => {
      expect(
        server.isStarted
      ).toEqual(false);
    });

    it('returns the started status (true)', () => {
      return server.start().then(() => {
        expect(
          server.isStarted
        ).toEqual(true);
      });
    });
  });

  describe('start', () => {
    let stopSpy;

    beforeEach(() => {
      stopSpy = jest.spyOn(server, 'stop');
    });

    it('stops any started servers', () => {
      return server.start().then(() => {
        expect(stopSpy).toHaveBeenCalled();
      });
    });

    it('returns true when started', () => {
      return server.start().then((result) => {
        expect(result).toEqual(true);
      });
    });

    it('emits the started event', (done) => {
      server.on('started', () => {
        done();
      });

      server.start();
    });
  });

  describe('stop', () => {
    let stopSpy;

    beforeEach(() => {
      stopSpy = jest.fn((cb) => cb());
      server._peers = {};
      server._node = {
        stop: stopSpy
      };
    });

    afterEach(() => {
      server._node = null;
    });

    it('calls stop() on the internal server', () => {
      return server.stop().then(() => {
        expect(stopSpy).toHaveBeenCalled();
      });
    });

    it('resets the connected peers', () => {
      return server.stop().then(() => {
        expect(server._peers).toEqual(null);
      });
    });

    it('resets the server', () => {
      return server.stop().then(() => {
        expect(server._node).toEqual(null);
      });
    });

    it('emits the stopped event', (done) => {
      server.on('stopped', () => {
        done();
      });

      server.stop();
    });

    it('returns true when completed', () => {
      return server.stop().then((result) => {
        expect(result).toEqual(true);
      });
    });

    it('returns false when internal server not started', () => {
      server._node = null;

      return server.stop().then((result) => {
        expect(result).toEqual(false);
      });
    });
  });

  describe('_dialPeer', () => {
    let connection;
    let peer;

    beforeEach(() => {
      connection = { 'some': 'connection' };
      peer = {
        isConnecting: false,
        peerInfo: 'peerInfo'
      };

      server._send = jest.fn(() => true);
      server._node = {
        dial: jest.fn((peerInfo, protocol, cb) => cb(null, connection))
      };
    });

    afterEach(() => {
      server._node = null;
    });

    it('returns false when peer is not found', () => {
      return server._dialPeer().then((result) => {
        expect(result).toEqual(false);
      });
    });

    it('returns false when peer isConnecting', () => {
      return server._dialPeer({ isConnecting: true }).then((result) => {
        expect(result).toEqual(false);
      });
    });

    it('returns true when completed', () => {
      return server._dialPeer(peer).then((result) => {
        expect(result).toEqual(true);
      });
    });

    it('returns false when error ocurred', () => {
      server._send = () => {
        throw new Error('error');
      };

      return server._dialPeer(peer).then((result) => {
        expect(peer.isConnecting).toEqual(false);
        expect(peer.isConnected).toEqual(false);
        expect(result).toEqual(false);
      });
    });

    it('dials the peer', () => {
      return server._dialPeer(peer).then((result) => {
        expect(server._node.dial).toHaveBeenCalledWith(
          peer.peerInfo, PROTOCOL, expect.anything()
        );
      });
    });

    it('sends the status to the peer', (done) => {
      server._send = (_connection, message) => {
        expect(connection).toEqual(connection);
        expect(
          isInstanceOf(message, StatusMessage)
        ).toEqual(true);
        done();
      };

      server._dialPeer(peer);
    });
  });

  describe('_handleMessage', () => {
    it('emits the message as received', (done) => {
      const message = new StatusMessage();

      server.on('message', (_message) => {
        expect(_message).toEqual(message);
        done();
      });

      server._handleMessage(message);
    });
  });

  describe('_receive', () => {
    it('reads the stream, handles the message', (done) => {
      const message = new StatusMessage();

      server.on('message', (_message) => {
        expect(JSON.stringify(_message)).toEqual(JSON.stringify(message));
        done();
      });

      server._receive(PROTOCOL, streamWriter(message));
    });
  });

  describe('_send', () => {
    it('sends the message', (done) => {
      const message = new StatusMessage();

      server._send(streamReader((_message) => {
        expect(JSON.stringify(_message)).toEqual(JSON.stringify(message));
        done();
      }), message);
    });
  });
});