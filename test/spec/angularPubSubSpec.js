/*jshint globalstrict:true*/
'use strict';

describe('pubSub', function () {
  var ps, psProvider, dmp = {};
  var ezMsg = 'a cute message';

  var getCallback = function () {
    // can't use spies here, there's some weird issue with .apply
    var fn = function () {
      fn.called = true;
      fn.args = arguments;
      fn.callCount += 1;
    };

    fn.called = false;
    fn.callCount = 0;

    dmp.mySpy = fn;

    return fn;
  };

  beforeEach(module('PubSubModule', function (pubSubProvider) {
    psProvider = pubSubProvider;
  }));

  beforeEach(inject(['pubSub', function (pubSub) {
    ps = pubSub;
  }]));

  afterEach(function () {
    var vars = Object.getOwnPropertyNames(dmp);
    for (var i = 0; i < vars.length; i++) {
      delete dmp[vars[i]];
    }
  });

  describe('#publish', function () {
    describe('given an unsubscribed channel', function () {
      it('returns nothing', function () {
        expect(ps.publish('channel')).toBeUndefined();
      });
    });

    describe('given a previously subscribed channel', function () {
      beforeEach(function () {
        ps.subscribe('channel', getCallback());
      });

      it('still returns nothing', function () {
        expect(ps.publish('channel')).toBeUndefined();
      });

      it("calls the subscriber's callback", function () {
        ps.publish('channel');
        expect(dmp.mySpy.called).toEqual(true);
      });

      it("calls the subscriber's callback with the given message", function () {
        ps.publish('channel', ezMsg);
        expect(dmp.mySpy.args[0]).toEqual(ezMsg);
      });

      it('calls the callback only once', function () {
        ps.publish('channel', ezMsg);
        expect(dmp.mySpy.callCount).toEqual(1);
      });

      it('calls the subscriber twice if publishing twice', function () {
        ps.publish('channel', 1, 'sweet');
        expect(dmp.mySpy.args[0]).toEqual(1);
        expect(dmp.mySpy.args[1]).toEqual('sweet');
        ps.publish('channel', ezMsg);
        expect(dmp.mySpy.args[0]).toEqual(ezMsg);
      });

      describe('with multiple subscribers', function () {
        beforeEach(function () {
          dmp.subs = [getCallback(), getCallback(), getCallback()];

          for (var sub in dmp.subs) {
            ps.subscribe('channel', dmp.subs[sub]);
          }
        });

        it('calls each of the subscribers with the same arguments', function () {
          ps.publish('channel', ezMsg);

          for (var sub in dmp.subs) {
            expect(dmp.subs[sub].called).toEqual(true);
            expect(dmp.subs[sub].args[0]).toEqual(ezMsg);
          }
        });
      });
    });
  });

  describe('#subscribe', function () {
    describe('given an empty PubSub', function () {
      it('accepts a channel and a callback', function () {
        expect(ps.subscribe('channel', getCallback())).
          toEqual(jasmine.any(Function));
      });

      it('does not play back any messages if requested', function () {
        ps.subscribe('channel', getCallback(), true);
        expect(dmp.mySpy.called).toBe(false);
      });
    });

    describe('given a PubSub with a maxHistory of 5', function () {
      beforeEach(function () {
         psProvider.setMaxHistory(5);
      });

      describe('and five publishes on a channel', function () {
        beforeEach(function () {
          for (var i = 0; i < 5; i++) ps.publish('channel', i);
        });

        it('does not call a new subscriber if playback is false', function () {
          ps.subscribe('channel', getCallback());
          expect(dmp.mySpy.called).toBe(false);
        });

        it('rewinds all messages if playback is true', function () {
          ps.subscribe('channel', getCallback(), true);
          expect(dmp.mySpy.called).toBe(true);
          expect(dmp.mySpy.callCount).toEqual(5);
        });

        it('rewinds 1 message if maxPlayback is 1', function () {
          ps.subscribe('channel', getCallback(), true, 1);
          expect(dmp.mySpy.called).toBe(true);
          expect(dmp.mySpy.callCount).toEqual(1);
        });

        it('keeps no more than 5 messages', function () {
          ps.publish('channel', 6);
          ps.subscribe('channel', getCallback(), true);
          expect(dmp.mySpy.callCount).toEqual(5);
          expect(dmp.mySpy.args[0]).toEqual(6);
        });
      });
    });
  });

  describe('unsubscribe function', function () {
    describe('given a subscribed channel', function () {
      beforeEach(function () {
        ps.subscribe('channel', dmp.ocb = getCallback());
        dmp.unsub = ps.subscribe('channel', getCallback());
      });

      it('can be unsubscribed from', function () {
        dmp.unsub();
        ps.publish('channel');
        expect(dmp.mySpy.called).toBe(false);
      });

      it('does not affect the other subscribers', function () {
        dmp.unsub();
        ps.publish('channel');
        expect(dmp.ocb.called).toBe(true);
      });
    });
  });
});
