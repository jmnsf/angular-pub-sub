[ ![Codeship Status for jmnsf/angular-pub-sub](https://codeship.com/projects/21821710-cb2c-0132-2298-7aebcd9a20f5/status?branch=master)](https://codeship.com/projects/75679)

# angular-pub-sub

Straightforward Publish-Subscribe module for AngularJS. Supports messages with multiple parameters and supports keeping a message history and rewinding upon subscription.

## Documentation

This README and plenty of JSDOC comments if you feel like messing around with the code. Feel free to reach out here or on twitter (@jmnsferreira) if anything's unclear.

## Install

### 1st: Get the code:

* From distribution file
  1. Download `angular-pub-sub.js` (or the `-min` version);
  2. Include after AngularJS.
* From npm:
  1. `npm install angular-pub-sub`

### 2nd: Add Module Dependency

```javascript
...
var myApp = angular.module('myApp', ['PubSubModule']);
...
```

## Configuration

### setMaxHistory

Set the maximum number of messages to store in the history for playback upon subscription. **Default is 10**.

```javascript
app.config(['pubSubProvider', function(pubSubProvider) {
  pubSubProvider.setMaxHistory(5);
}]);
```

## Usage

### `publish`

Publish a message to a channel.

**Args**:

* `channel` - A String that identifies a channel (can be a new channel).
* `message`* - Any number of arguments, can be zero for a simple "ping", of any data type to pass onto subscribers.

**Return**: `undefined`

**Example**:

```javascript
myApp.controller('ItemsCtrl', function($scope, pubSub) {
  var nextPage = function () {
    ...
    pubSub.publish('nav-analytics', 'items', $scope.currentPage);
    ...
  };
});
```

### `subscribe`

Subscribe to a channel to receive future messages and, optionally, previous ones.

**Args**:

* `channel` - A String that identifies a channel. Same string as used in `publish`.
* `callback` - A Function that will be executed with each `message` that is published on the selected channel.
* `playback` - (Optional) When `true`, messages previously published on channel will be played back (applied on `callback`). Doesn't playback by default.
* `maxPlayback` - (Optional) An Integer; the maximum number of messages to play back. Default is all available.

**Return**: A Function that will unsubscribe from channel when called.

**Example**:

```javascript
myApp.controller('AnalyticsCtrl', function($scope, pubSub) {
  var killAnalytics = null;

  var trackPageView = function (name, page) {
    _analytics.track(name, page);
  };

  var setUp = function () {
    ...
    killAnalytics = pubSub.subscribe('nav-analytics', trackPageView, true, 1);
    ...
  };

  var setDown = function () { killAnalytics(); };
});
```

## Contributing

* Fork it.
* Create an issue before adding a feature.
* Keep the code style as possible (or change it if it's an improvement).
* **Add tests** for what you do.

#### Developing:

Clone the project:

```
$ git clone https://github.com/<your-repo>/angular-pub-sub.git
$ cd angular-pub-sub
$ npm install
$ bower install
```

Run the tests:

```
$ grunt test
```

#### Deploying:

```
$ grunt dist
```


