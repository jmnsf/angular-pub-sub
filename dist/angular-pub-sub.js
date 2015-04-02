/**
 * An Angular module that implements a Publish Subscribe service with support for message history.
 * @version v1.0.0 - 2015-04-02
 * @link https://github.com/jmnsf/angular-pub-sub
 * @author jmnsf <jmnsferreira@gmail.com>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
(function (window, angular, undefined) {
/*jshint globalstrict:true*/
'use strict';

var angularPubSub = angular.module('PubSubModule', []);

angularPubSub.provider('pubSub', function () {

    // The maximum number of messages stored in cache for late subscribers.
    this.maxHistory = 10;

    /**
     * Sets a new message history limit for the playback option upon subscribing.
     *
     * @param {Integer} newMax The new maximum number of messages to store.
     * @return {Object} This provider.
     */
    this.setMaxHistory = function (newMax) {
        this.maxHistory = newMax;
        return this;
    };

    this.$get = function () {
        var self = this;
        var channels = {};
        var id = 0;

        /**
         * Subscribes a callback to a channel.
         *
         * @param {Object}    channel  The channel being subscribed.
         * @param {Function}  callback The subscriber's callback.
         * @return {Function}          A function that, when called,
         *                               unsubscribes the callback from the
         *                               channel.
         */
        var addSubscriber = function (channel, callback) {
            var subscriberId = getUniqueId();

            channel[subscriberId] = callback;

            return createUnsubscribeFunction(channel, subscriberId);
        };

        /**
         * Adds a message to a channel's history, if maxHistory is greater than
         * 0. Trims the existing history if it goes over maxHistory.
         *
         * @param  {Object}    channel The channel being added to.
         * @param  {Array}     message The message to store.
         * @return {undefined}
         */
        var appendToHistory = function (channel, message) {
            if (self.maxHistory <= 0) { return; }

            channel.history.push(message);

            if (channel.history.length > self.maxHistory) {
                channel.history.shift();
            }
        };

        /**
         * Creates a new channel with an empty history.
         *
         * @return {Object} The new, empty channel.
         */
        var createChannel = function () {
            var channel = { };

            Object.defineProperty(
                channel, 'history', { value: [], enumerable: false });

            return channel;
        };

        /**
         * Creates an unsubscribe function for a given subscriber's ID. The
         * returned function, when called, removes the subscriber from the
         * channel.
         *
         * @param  {Object}  channel The channel object.
         * @param  {Integer} id      The subscriber's ID.
         * @return {Function}        The unsubscribing function.
         */
        var createUnsubscribeFunction = function (channel, id) {
            return function () { delete channel[id]; };
        };

        /**
         * Drops the first n arguments from an Arguments object and returns an
         * Array with the remaining arguments.
         *
         * @param  {Object}  args The Arguments Object to drop args from.
         * @param  {Integer} n    How many arguments to drop.
         * @return {Array}        A new Array with the remaining arguments.
         */
        var dropFromArguments = function (args, n) {
            var newArgs = [];

            for (var i = n; i < args.length; i++) {
                newArgs.push(args[i]);
            }

            return newArgs;
        };

        /**
         * Retrieves a channel object, creating it if it does not yet exist.
         *
         * @param  {String} channel The channel to retrieve.
         * @return {Object}         The channel's object.
         */
        var getOrCreateChannel = function (channel) {
            if (channels[channel] === undefined) {
                channels[channel] = createChannel();
            }

            return channels[channel];
        };

        /**
         * Generates a new subscriber ID.
         *
         * @return {Integer} An integer number for the subscriber
         */
        var getUniqueId = function () {
            id += 1;
            return id;
        };

        /**
         * Publish a message on the channel with the given name. Takes any
         * number of values as a message and passes them on to the subscribers'
         * callbacks.
         *
         * @param  {String}    channel The channel being published to.
         * @param  {[...]}     message Zero or more values to pass as a message.
         * @return {undefined}
         */
        var publish = function (channel) {
            var args = dropFromArguments(arguments, 1);
            channel = getOrCreateChannel(channel);

            publishOn(channel, args);
            appendToHistory(channel, args);
        };

        /**
         * Publishes the given message on the given channel. Expects a channel
         * object, _not its name_, and the values to publish.
         *
         * @param  {Object}    channel The channel being published to.
         * @param  {Array}     message Possibly empty array of message values.
         * @return {undefined}
         */
        var publishOn = function (channel, message) {
            var subscribers = Object.keys(channel);

            for (var i = 0; i < subscribers.length; i++) {
                channel[subscribers[i]].apply(undefined, message);
            }
        };

        /**
         * Rewinds and plays back the channel's messages. Searches the history
         * of the channel for up to {count} messages and calls the callback with
         * as many messages as were retrieved, in historical order (older first).
         *
         * @param  {Object}    channel  The channel being rewound.
         * @param  {Function}  callback The subscriber's callback.
         * @param  {[type]}    count    Max number of messages to play back.
         * @return {undefined}
         */
        var rewind = function (channel, callback, count) {
            var history = channel.history;
            var startIndex = 0;

            if (count !== undefined) {
                startIndex = Math.max(startIndex, history.length - count);
            }

            for (var i = startIndex; i < history.length; i++) {
                callback.apply(null, history[i]);
            }
        };

        /**
         * Subscribes to a channel to start receiving messages when publishes
         * are done. Can optionally 'rewind' the channel and pass the messages
         * received upon subscribing.
         *
         * @param  {String}   channel     The channel being subscribed to's name.
         * @param  {Function} callback    The callback to run upon any publish.
         * @param  {Boolean}  playback    Whether to playback previous messages.
         * @param  {Boolean}  maxPlayback Max number of messages to playback.
         * @return {Function}             A callback for unsubscribing from the
         *                                  channel.
         */
        var subscribe = function (channel, callback, playback, maxPlayback) {
            var unsubscribe;

            channel = getOrCreateChannel(channel);
            unsubscribe = addSubscriber(channel, callback);

            if (playback === true) {
                rewind(channel, callback, maxPlayback);
            }

            return unsubscribe;
        };

        return {
            publish: publish,
            subscribe: subscribe
        };
    };
});
})(window, window.angular);
