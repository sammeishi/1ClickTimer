/* 1-click-timer v8.3.1 (C) 2013-2015 Alex Ewelof. All rights reserved. */(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Static = require("./Static.js")["default"];

//You hackers!

console.info("alarm module");

var Alarm = (function () {
  function Alarm() {
    _classCallCheck(this, Alarm);

    //Set in background.html audio tag: autoplay = false and loop = true;
    this.audio = document.querySelector("audio");
    this._volume = new Static("alarm.volume", 100);
    this._signalIndex = new Static("alarm._signalIndex", 0);
    //set the audio source
    this.signalIndex = this._signalIndex.load();
    //set the volume
    this.volume = this._volume.load();
    var self = this;
  }

  _createClass(Alarm, {
    play: {
      value: function play() {
        console.log("Playing the alarm sound " + this.signalIndex);
        //reset the play head to the start of the file
        this.audio.currentTime = 0;
        this.audio.play();
      }
    },
    stop: {
      value: function stop() {
        console.log("Stopping the alarm sound");
        this.audio.pause();
      }
    },
    isPlaying: {
      value: function isPlaying() {
        return !!this.audio.paused;
      }
    },
    signalIndex: {
      set: function (signalIndex) {
        console.log("Setting alarm signal to " + signalIndex);
        this.audio.src = "audio/" + this._signalIndex.save(signalIndex) + ".mp3";
        this.audio.load();
      },
      get: function () {
        return this._signalIndex.load();
      }
    },
    volume: {

      /**
       * volume is in percent
       * @param volume percentage of the volume
       */

      set: function (volume) {
        if (!isFinite(volume)) {
          console.info("Ignoring non-finite value for volume", volume);
        }
        //Put the volume in range between 0 to 100
        if (volume < 0) {
          volume = 0;
        } else if (volume > 100) {
          volume = 100;
        }
        //The actual this.audio API expects a number in the range of 0 to 1
        console.log("Setting volume to " + volume + "%");
        this._volume.save(volume);
        this.audio.volume = volume / 100;
      },

      /** volume is in percent */
      get: function () {
        return Math.round(this.audio.volume * 100);
      }
    }
  });

  return Alarm;
})();

exports["default"] = Alarm;
//# sourceMappingURL=Alarm.js.map

},{"./Static.js":4}],2:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

/* global console,chrome */

console.info("Messenger module");

var Messenger = (function () {
  function Messenger(name) {
    _classCallCheck(this, Messenger);

    this.name = name;
  }

  _createClass(Messenger, {
    trigger: {
      value: function trigger(name, param, cb) {
        console.info(this.name, "Sending", name, param);
        // {@link https://developer.chrome.com/extensions/runtime#method-sendMessage}
        chrome.runtime.sendMessage({ src: this.name, name: name, param: param }, cb);
      }
    },
    on: {
      value: function on(name, handler) {
        // {@link https://developer.chrome.com/extensions/runtime#event-onMessage}
        //function handler(any message, MessageSender sender, function sendResponse)
        var self = this;
        //TODO: bug: this is not good. Because only the last function will be stored in this.listener and unregistered later()
        this.listener = function (message, sender, cb) {
          if (message.name === name && message.src !== self.name) {
            console.info(self.name, "Receiving", message.name);
            handler(message.param, cb);
          }
        };
        chrome.runtime.onMessage.addListener(this.listener);
      }
    },
    unregister: {
      value: function unregister() {
        if (this.listener) {
          chrome.runtime.onMessage.removeListener(this.listener);
        }
      }
    }
  });

  return Messenger;
})();

exports["default"] = Messenger;
//# sourceMappingURL=Messenger.js.map

},{}],3:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

/* global console,clearTimeout,setTimeout */

//You hackers!

// The motoric part of the timer.

//TODO Consider using Chrome alarm API https://developer.chrome.com/extensions/alarms

var Static = require("./Static.js")["default"];

var Alarm = require("./Alarm.js")["default"];

var notify = require("./notify.js");

var badger = require("./badger.js");

var Messenger = require("./Messenger.js")["default"];

console.info("motor module");

var msg = new Messenger("BACKEND");
//The only instance of the alarm system
var alarm = new Alarm();

var Motor = (function () {
  /**
   * @constructor
   * Creates a new instance of the Motor
   */

  function Motor() {
    _classCallCheck(this, Motor);

    //this.timeoutId holds the return value of setTimeout()
    /** the epoch (in ms) since the timer got started */
    this._startTime = new Static("motor.startTime", 0);
    /** The time remaining till the timer ends */
    this._remainingTime = new Static("motor.remainingTime", 0);
    /** The goal of the timer (in ms)*/
    this._timerPeriod = new Static("motor.timerPeriod", 0);
    /** The timer state can be 'running', 'paused' and 'stopped' */
    this._state = new Static("motor.state", "stopped");
    badger.setState(this._state.load());
    //Bind the tick function to the current instance of the motor
    this._tick = this.__tick.bind(this);
    //initialize the timer
    if (this._state.load() === "running") {
      msg.trigger("motor.start", this._timerPeriod.load());
      //run tick once to start the loop
      this._tick();
    }
    var self = this;
    msg.on("motor.toggle", function () {
      self.toggle();
    });
    msg.on("motor.reset", function () {
      self.stop();
    });
    msg.on("motor.start", function (endIn) {
      self.start(endIn);
    });
    msg.on("motor.restart", function () {
      self.restart();
    });
    msg.on("motor.getState", function (_, cb) {
      cb(self._state.load());
    });
    msg.on("alarm.setVolume", function (volume) {
      alarm.volume = volume;
    });
    msg.on("alarm.getVolume", function (_, cb) {
      cb(alarm.volume);
    });
    msg.on("alarm.setSignalIndex", function (signalIndex) {
      alarm.signalIndex = signalIndex;
    });
  }

  _createClass(Motor, {
    __tick: {

      /**
       * The interval function that will be called every second while the timer is running
       * It is not guaranteed that this function will be called every single second.
       * In other words it may skip a second. But when it is called, it is passed the number of
       * elapsed seconds.
       * For example if the browser doesn't run the setTimeout() as quick as we expect or if running the
       * callback function takes too long.
       * Note: the constructor will create a new function from this one called tick() using "bind".
       * That one refers to this motor instance as "this".
       */

      value: function __tick() {
        // Unscheduling any possible timeout event
        clearTimeout(this.timeoutId);
        this._remainingTime.save(this._startTime.load() + this._timerPeriod.load() - Date.now());
        if (this._remainingTime.load() <= 0) {
          //call tick event listeners
          console.log("Tick past the planned alarm moment by", this._remainingTime.load(), "ms");
          this.stop();
          alarm.play();
          var self = this;
          notify.show("Time up!", function () {
            alarm.stop();
          });
          badger.setTime(0);
          msg.trigger("motor.tick", 0);
          msg.trigger("motor.end", this._timerPeriod.load());
        } else {
          badger.setTime(this._remainingTime.load());
          //call tick event listeners
          msg.trigger("motor.tick", this._remainingTime.load());
          // Only schedule another $timer if the current one is finished running and the timer is still running.
          if (this.isRunning()) {
            var wholeSecondsRemaining = Math.floor(this._remainingTime.load() / 1000);
            var nextTick = this._remainingTime.load() - wholeSecondsRemaining * 1000;
            console.log("Scheduling another tick() in ", nextTick, "ms", "remaining:", wholeSecondsRemaining);
            this.timeoutId = setTimeout(this._tick, nextTick);
          } else {
            console.warn("_tick() ran while the timer is stopped");
          }
        }
      }
    },
    isRunning: {
      value: function isRunning() {
        return this._state.load() === "running";
      }
    },
    isPaused: {
      value: function isPaused() {
        return this._state.load() === "paused";
      }
    },
    isStopped: {
      value: function isStopped() {
        return this._state.load() === "stopped";
      }
    },
    toggle: {
      value: function toggle() {
        if (this.isRunning()) {
          this.pause();
        } else if (this.isPaused()) {
          this.resume();
        }
      }
    },
    start: {

      /**
       * Set the timer to end in endIn milliseconds from now
       * @param endIn {Number} number of milliseconds (relative time from now)
       */

      value: function start(endIn) {
        clearTimeout(this.timeoutId);
        this._startTime.save(Date.now());
        this._timerPeriod.save(endIn);
        alarm.stop();
        notify.hide();
        this._state.save("running");
        badger.setState(this._state.load());
        badger.setTime(this._timerPeriod.load());
        msg.trigger("motor.start", this._timerPeriod.load());
        //run tick once to start the loop
        this._tick();
      }
    },
    resume: {

      /** Resumes a paused timer */

      value: function resume() {
        console.log("Resuming the motor from pause");
        var endTime = Date.now() + this._remainingTime.load();
        //set a virtual startTime in the past time so that the tick algorithms work properly
        this._startTime.save(endTime - this._timerPeriod.load());
        this._state.save("running");
        badger.setState(this._state.load());
        //run tick once to start the loop
        this._tick();
      }
    },
    pause: {

      /** Pauses the timer. It can be resumed or set again */

      value: function pause() {
        console.log("Pausing the motor");
        clearTimeout(this.timeoutId);
        this._state.save("paused");
        badger.setState(this._state.load());
        alarm.stop();
        notify.hide();
        badger.setTime(this._remainingTime.load());
        msg.trigger("motor.tick", this._remainingTime.load());
        msg.trigger("motor.pause", this._remainingTime.load());
      }
    },
    stop: {

      /** stops the motor so the callback function will not be called anymore */

      value: function stop() {
        console.log("Stopping the motor");
        clearTimeout(this.timeoutId);
        this._state.save("stopped");
        badger.setState(this._state.load());
        this._remainingTime.reset();
        alarm.stop();
        notify.hide();
        badger.setTime();
        msg.trigger("motor.tick", this._remainingTime.load());
        msg.trigger("motor.stop");
      }
    },
    restart: {

      /** restarts the timer with the last timerPeriod */

      value: function restart() {
        console.info("Motor reset");
        this.start(this._timerPeriod.load());
      }
    }
  });

  return Motor;
})();

exports["default"] = Motor;
//# sourceMappingURL=Motor.js.map

},{"./Alarm.js":1,"./Messenger.js":2,"./Static.js":4,"./badger.js":5,"./notify.js":8}],4:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

/*global console,localStorage,JSON */

console.info("static module");

//A constructor for persistent values (uses localStorage)

var Static = (function () {
  //Note: the key must be unique and it's up to the caller to make sure no two keys are duplicated in the whole application

  function Static(key, defaultValue) {
    _classCallCheck(this, Static);

    this.key = key;
    this.defaultValue = defaultValue;
    //The value will be written the first time load() is called
    this.load();
  }

  _createClass(Static, {
    reset: {
      //Resets the variable to its default parameter and returns it

      value: function reset() {
        return this.save(this.save(this.defaultValue));
      }
    },
    load: {
      //Loads the value of the variable from localStorage

      value: function load() {
        //valueJson will be null if the localStorage is never set
        var valueJson = localStorage.getItem(this.key);
        if (valueJson !== null) {
          try {
            var parsedJson = JSON.parse(valueJson);
            if ("value" in parsedJson) {
              return parsedJson.value;
            } else {
              console.warn("Invalid object stored for", this.key, "in local storage:", valueJson, " Loading default.");
            }
          } catch (e) {
            console.warn("Value of", this.key, "changed externally. Loading default.");
          }
        }
        return this.reset();
      }
    },
    save: {
      //Note: calling save() runs one JSON.stringify() and one JSON.parse()

      value: function save(value) {
        localStorage.setItem(this.key, JSON.stringify({ value: value }));
        return this.load();
      }
    }
  });

  return Static;
})();

exports["default"] = Static;
//# sourceMappingURL=Static.js.map

},{}],5:[function(require,module,exports){
"use strict";

exports.setTime = setTime;
exports.setState = setState;
/* global chrome */

var convert = require("./convert.js");

console.info("badger module");

function setTime(time) {
  var hms = convert.ms2hms(time);
  chrome.browserAction.setBadgeText({ text: convert.msToShortMin(time) });

  var color;
  if (hms.mf <= 1) {
    color = "#f00"; //red
  } else if (hms.mf <= 10) {
    color = "#e58700"; //orange
  } else {
    color = "#00af1d"; //green
  }
  chrome.browserAction.setBadgeBackgroundColor({ color: color });
}

function setState(state) {
  var icon;
  switch (state) {
    case "running":
      icon = {
        "19": "img/popup-icon-on-19.png",
        "38": "img/popup-icon-on-38.png"
      };
      break;
    case "paused":
    case "stopped":
    default:
      icon = {
        "19": "img/popup-icon-off-19.png",
        "38": "img/popup-icon-off-38.png"
      };
      break;
  }
  chrome.browserAction.setIcon({ path: icon });
}
//# sourceMappingURL=badger.js.map

},{"./convert.js":6}],6:[function(require,module,exports){


/** converts radian to degree */
"use strict";

exports.rad2deg = rad2deg;

/** converts degree to radian */
exports.deg2rad = deg2rad;

/**
 * Calculates the angle from the center for a point ( x, y ) in a square with width and height 'w'
 * @return {number} the angle in radian
 */
exports.angleFromCenter = angleFromCenter;

/**
 * Converts an angle into rotation in a way that the hand can be directly set with it
 * @param angle {number} the angle in radian
 * @returns {number} the roatation that can be used for rotateX() css function
 */
exports.angleToRotation = angleToRotation;

/**
 * Converts a rotation angle into minute
 * @param rotation {number} the angle in radian
 * @returns {number} minute
 */
exports.rotationToMin = rotationToMin;

/**
 * Converts a minute into rotation (the opposite of rotationToMin)
 * @param minute {number} the minute (from 0 to 60)
 * @returns {number} radian
 */
exports.minToRotation = minToRotation;

/** Normalizes a radian value to be between -PI..PI
 * @see minNorm for more info about how the algorithm works.
 */
exports.radNorm = radNorm;

/** Normalizes a minute value to be between 0..60.
 * If the minute is a negative value it'll be increased by 60 until it becomes 0 or above 0.
 * If the minute is bigger than 60 it'll be decreased by 60 until it becomes 60 or below 60.
 * So -120 becomes 0 but 120 becomes 60.
 */
exports.minNorm = minNorm;

/** convert a radian to minue */
exports.rad2min = rad2min;

/** converts a minute to radian */
exports.min2rad = min2rad;

/** normalizes and then convert a radian to minue */
exports.rad2minNorm = rad2minNorm;

/**
 * determines the rotation angle of the minute hand in clockwise system
 * normalizes and then converts a minute to radian
 */
exports.min2radNorm = min2radNorm;

/** converts an angle from clockwise system to anticlockwise system.
 * Anticlockwise system is used by Canvas and CSS
 */
exports.clockwise2anticlockwise = clockwise2anticlockwise;

/** converts an angle from anticlockwise system to clockwise system
 * Anticlockwise system is used by Canvas and CSS
 */
exports.anticlockwise2clockwise = anticlockwise2clockwise;

/**
 * Maps a value from one space to another.
 * @param srcMin {number} minimum possible value in the source space
 * @param srcMax {number} maximum possible value in the source space
 * @param dstMin {number} minimum possible value in the destination space
 * @param dstMax {number} maximum possible value in the destination space
 * @param x {number} the value of x in the source space
 * @return {number} the value of x in the destination space
 */
exports.mapSpace = mapSpace;

/**
 * Converts n to string but if n is less than 10 prefixes it with an additional '0' to make it look double digit
 * This function doesn't check if the output is bigger than 99 but n is expected to be in that range anyway
 * This function doesn't even check if n is a number but if it isn't the result is going to be unpredictable
 * @param n {number} a number between 0 to 99
 * @return {String} the string representation of n
 */
//TODO: we are assuming that if this function is called for an undefined n, it should be defaulted to 0. Not a good assumption.
exports.doubleDigit = doubleDigit;

/**
 * Converts a number of seconds to MM:SS string format
 * Note that if minutes are more than 60 they will still be shown as is (won't show hour anyway)
 * @param seconds {number}
 * @return {String} the string representation of the given number of seconds in MM:SS format
 */
exports.msToString = msToString;
exports.minToMMSS = minToMMSS;

/**
 * Puts a numerical value in the specified range
 */
exports.putInRange = putInRange;

/** Converts the number of milliseconds to hour, minute and seconds */
exports.ms2hms = ms2hms;

/**
 * @param time {Number} time in milliseconds
 * @returns {String}
 */
exports.ms2hmsString = ms2hmsString;

/**
 * @param hms {Object} with 'h', 'm', and 's' components
 * @returns {String}
 */
exports.hms2String = hms2String;
exports.hourMinSec2String = hourMinSec2String;

/** Converts the number of seconds to hour, minute and seconds */
exports.s2hms = s2hms;

/** converts minutes to milliseconds */
exports.m2ms = m2ms;
exports.kebabToCamel = kebabToCamel;

/**
 * Converts a number of milliseconds to a max 4 digit string that is suitable for showing on the badge counter
 * When ms is 0, it returns an empty string
 **/
exports.msToShortMin = msToShortMin;
console.info("convert module");

var PI = Math.PI;
var PIx2 = 2 * PI;
var PI_2 = PI / 2;
var PI_30 = PI / 30;
function rad2deg(rad) {
  //Note: don't use PIx180 constant because it reduces accuracy
  return rad / PI * 180;
}

function deg2rad(deg) {
  //Note: don't use PI_180 constant because it reduces accuracy
  return deg / 180 * PI;
}

function angleFromCenter(x, y, w) {
  var w_2 = w / 2;
  return Math.atan2(w_2 - y, x - w_2);
}

function angleToRotation(angle) {
  if (angle < PI_2) {
    return -angle + PI_2;
  } else {
    return -angle + 5 * PI_2;
  }
}

function rotationToMin(rotation) {
  return rotation * 60 / PIx2;
}

function minToRotation(minute) {
  return minute * PIx2 / 60;
}

function radNorm(rad) {
  //TODO: optimize this function
  while (rad < -PI) {
    rad += PIx2;
  }
  while (rad > PI) {
    rad -= PIx2;
  }
  return rad;
}

function minNorm(min) {
  //TODO: optimize this function
  while (min < 0) {
    min += 60;
  }
  while (min > 60) {
    min -= 60;
  }
  return min;
}

function rad2min(rad) {
  //OLD return ( PI_2 - rad ) / PI_30;
  return -(30 * rad / PI);
}

function min2rad(min) {
  return PI_2 - PI_30 * min;
}

function rad2minNorm(rad) {
  return minNorm(rad2min(rad));
}

function min2radNorm(min) {
  return radNorm(min2rad(min));
}

function clockwise2anticlockwise(a) {
  return -a;
}

function anticlockwise2clockwise(a) {
  return -a;
}

function mapSpace(srcMin, srcMax, dstMin, dstMax, x) {
  return (x - srcMin) * (dstMax - dstMin) / (srcMax - srcMin) + dstMin;
}

function doubleDigit() {
  var n = arguments[0] === undefined ? 0 : arguments[0];

  var ret = n.toString();
  return n < 10 ? "0" + ret : ret;
}

function msToString(seconds) {
  var m = Math.floor(seconds / 60);
  var s = seconds % (m * 60) || 0;
  return doubleDigit(m) + ":" + doubleDigit(s);
}

function minToMMSS(minutes) {
  return doubleDigit(minutes) + ":00";
}

function putInRange(val, min, max) {
  if (val > max) {
    return max;
  } else if (val < min) {
    return min;
  } else {
    return val;
  }
}

function ms2hms(time) {
  var ms = time;
  //hours float
  var hf = ms / 3600000;
  //hours integer
  var h = Math.floor(hf);
  ms -= h * 3600000;
  //minutes float
  var mf = ms / 60000;
  //minutes integer
  var m = Math.floor(mf);
  ms -= m * 60000;
  var sf = ms / 1000;
  var s = Math.floor(sf);
  ms -= s * 1000;
  return { hf: hf, h: h, mf: mf, m: m, sf: sf, s: s, ms: ms, time: time };
}

function ms2hmsString(time) {
  return hms2String(ms2hms(time));
}

function hms2String(hms) {
  return hourMinSec2String(hms.h, hms.m, hms.s);
}

function hourMinSec2String(hours, minutes, seconds) {
  var ret = "";
  if (hours > 0) {
    ret += hours + ":";
  }
  ret += doubleDigit(minutes) + ":" + doubleDigit(seconds);
  return ret;
}

function s2hms(s) {
  return ms2hms(s * 1000);
}

function m2ms(minutes) {
  return minutes * 60000;
}

function kebabToCamel(kebabCasedString) {
  return kebabCasedString.replace(/\-\w/g, function (letter) {
    return letter.substring(1).toUpperCase();
  });
}

function msToShortMin() {
  var ms = arguments[0] === undefined ? 0 : arguments[0];

  if (ms === 0) {
    return "";
  } else {
    var sec = ms / 1000;
    var min = Math.round(sec / 60);
    if (min <= 1) {
      return Math.round(sec) + "s";
    } else {
      return Math.round(min) + "m";
    }
  }
}
//# sourceMappingURL=convert.js.map

},{}],7:[function(require,module,exports){
/* global console,chrome */

"use strict";

var Motor = require("./Motor.js")["default"];

console.info("background module");

var extensionId = chrome.runtime.id;

//Clear the localStorage upon update
//TODO: clear the storage only when major version increases.
chrome.runtime.onInstalled.addListener(function (details) {
  //TODO BUG this happens after the 'Static' module has initialized and loaded values into memory
  if (details.reason === "update") {
    console.info("Clearing localStorage because of the update event.");
    localStorage.clear();
  }
});

var manifestJson = chrome.runtime.getManifest();
console.info("manifest.version:", manifestJson.version);

chrome.system.cpu.getInfo(function (cpuInfo) {
  console.info("archName:", cpuInfo.archName);
  console.info("modelName:", cpuInfo.modelName);
});

chrome.runtime.getPlatformInfo(function (platformInfo) {
  console.info("arch:", platformInfo.arch);
  console.info("nacl_arch:", platformInfo.nacl_arch);
  console.info("os:", platformInfo.os);
  console.info("userAgent:", navigator.userAgent);
  console.info("language:", navigator.language);
});

//TODO: if the background page is so simple and all components interact with each other via messaging, consider converting it to an event page.
//initialize app
var motor = new Motor();
//# sourceMappingURL=background.js.map

},{"./Motor.js":3}],8:[function(require,module,exports){
"use strict";

exports.show = show;
exports.hide = hide;
/* global console,Notification */

console.info("notify module");

//the title will also be used as tag to make sure only one notification is shown from this application
var title = "1-click timer";

function show(message, cb) {
  console.info("Showing notification: \"" + message + "\"");
  this._instance = new Notification(title, {
    body: message,
    tag: title,
    icon: "img/logo-128.png"
  });

  this._instance.onshow = function () {
    console.log("Notification.onshow");
  };
  this._instance.onclose = function () {
    console.log("Notification.onclose");
    cb("close");
  };
  this._instance.onclick = function () {
    console.log("Notification.onclick");
    cb("click");
  };
}

function hide() {
  if (this._instance) {
    this._instance.close();
    delete this._instance;
  }
}
//# sourceMappingURL=notify.js.map

},{}]},{},[7])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3VzZXIvY29kZS8xLWNsaWNrLXRpbWVyL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS91c2VyL2NvZGUvMS1jbGljay10aW1lci9idWlsZC9qcy9BbGFybS5qcyIsIi9ob21lL3VzZXIvY29kZS8xLWNsaWNrLXRpbWVyL2J1aWxkL2pzL01lc3Nlbmdlci5qcyIsIi9ob21lL3VzZXIvY29kZS8xLWNsaWNrLXRpbWVyL2J1aWxkL2pzL01vdG9yLmpzIiwiL2hvbWUvdXNlci9jb2RlLzEtY2xpY2stdGltZXIvYnVpbGQvanMvU3RhdGljLmpzIiwiL2hvbWUvdXNlci9jb2RlLzEtY2xpY2stdGltZXIvYnVpbGQvanMvYmFkZ2VyLmpzIiwiL2hvbWUvdXNlci9jb2RlLzEtY2xpY2stdGltZXIvYnVpbGQvanMvY29udmVydC5qcyIsIi9ob21lL3VzZXIvY29kZS8xLWNsaWNrLXRpbWVyL2J1aWxkL2pzL2Zha2VfYTJkYzZhNTYuanMiLCIvaG9tZS91c2VyL2NvZGUvMS1jbGljay10aW1lci9idWlsZC9qcy9ub3RpZnkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL09BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBrZXkgaW4gcHJvcHMpIHsgdmFyIHByb3AgPSBwcm9wc1trZXldOyBwcm9wLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChwcm9wLnZhbHVlKSBwcm9wLndyaXRhYmxlID0gdHJ1ZTsgfSBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKTsgfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG52YXIgX2NsYXNzQ2FsbENoZWNrID0gZnVuY3Rpb24gKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH07XG5cbnZhciBTdGF0aWMgPSByZXF1aXJlKFwiLi9TdGF0aWMuanNcIilbXCJkZWZhdWx0XCJdO1xuXG4vL1lvdSBoYWNrZXJzIVxuXG5jb25zb2xlLmluZm8oXCJhbGFybSBtb2R1bGVcIik7XG5cbnZhciBBbGFybSA9IChmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIEFsYXJtKCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBBbGFybSk7XG5cbiAgICAvL1NldCBpbiBiYWNrZ3JvdW5kLmh0bWwgYXVkaW8gdGFnOiBhdXRvcGxheSA9IGZhbHNlIGFuZCBsb29wID0gdHJ1ZTtcbiAgICB0aGlzLmF1ZGlvID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImF1ZGlvXCIpO1xuICAgIHRoaXMuX3ZvbHVtZSA9IG5ldyBTdGF0aWMoXCJhbGFybS52b2x1bWVcIiwgMTAwKTtcbiAgICB0aGlzLl9zaWduYWxJbmRleCA9IG5ldyBTdGF0aWMoXCJhbGFybS5fc2lnbmFsSW5kZXhcIiwgMCk7XG4gICAgLy9zZXQgdGhlIGF1ZGlvIHNvdXJjZVxuICAgIHRoaXMuc2lnbmFsSW5kZXggPSB0aGlzLl9zaWduYWxJbmRleC5sb2FkKCk7XG4gICAgLy9zZXQgdGhlIHZvbHVtZVxuICAgIHRoaXMudm9sdW1lID0gdGhpcy5fdm9sdW1lLmxvYWQoKTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoQWxhcm0sIHtcbiAgICBwbGF5OiB7XG4gICAgICB2YWx1ZTogZnVuY3Rpb24gcGxheSgpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJQbGF5aW5nIHRoZSBhbGFybSBzb3VuZCBcIiArIHRoaXMuc2lnbmFsSW5kZXgpO1xuICAgICAgICAvL3Jlc2V0IHRoZSBwbGF5IGhlYWQgdG8gdGhlIHN0YXJ0IG9mIHRoZSBmaWxlXG4gICAgICAgIHRoaXMuYXVkaW8uY3VycmVudFRpbWUgPSAwO1xuICAgICAgICB0aGlzLmF1ZGlvLnBsYXkoKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHN0b3A6IHtcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBzdG9wKCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIlN0b3BwaW5nIHRoZSBhbGFybSBzb3VuZFwiKTtcbiAgICAgICAgdGhpcy5hdWRpby5wYXVzZSgpO1xuICAgICAgfVxuICAgIH0sXG4gICAgaXNQbGF5aW5nOiB7XG4gICAgICB2YWx1ZTogZnVuY3Rpb24gaXNQbGF5aW5nKCkge1xuICAgICAgICByZXR1cm4gISF0aGlzLmF1ZGlvLnBhdXNlZDtcbiAgICAgIH1cbiAgICB9LFxuICAgIHNpZ25hbEluZGV4OiB7XG4gICAgICBzZXQ6IGZ1bmN0aW9uIChzaWduYWxJbmRleCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIlNldHRpbmcgYWxhcm0gc2lnbmFsIHRvIFwiICsgc2lnbmFsSW5kZXgpO1xuICAgICAgICB0aGlzLmF1ZGlvLnNyYyA9IFwiYXVkaW8vXCIgKyB0aGlzLl9zaWduYWxJbmRleC5zYXZlKHNpZ25hbEluZGV4KSArIFwiLm1wM1wiO1xuICAgICAgICB0aGlzLmF1ZGlvLmxvYWQoKTtcbiAgICAgIH0sXG4gICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NpZ25hbEluZGV4LmxvYWQoKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHZvbHVtZToge1xuXG4gICAgICAvKipcbiAgICAgICAqIHZvbHVtZSBpcyBpbiBwZXJjZW50XG4gICAgICAgKiBAcGFyYW0gdm9sdW1lIHBlcmNlbnRhZ2Ugb2YgdGhlIHZvbHVtZVxuICAgICAgICovXG5cbiAgICAgIHNldDogZnVuY3Rpb24gKHZvbHVtZSkge1xuICAgICAgICBpZiAoIWlzRmluaXRlKHZvbHVtZSkpIHtcbiAgICAgICAgICBjb25zb2xlLmluZm8oXCJJZ25vcmluZyBub24tZmluaXRlIHZhbHVlIGZvciB2b2x1bWVcIiwgdm9sdW1lKTtcbiAgICAgICAgfVxuICAgICAgICAvL1B1dCB0aGUgdm9sdW1lIGluIHJhbmdlIGJldHdlZW4gMCB0byAxMDBcbiAgICAgICAgaWYgKHZvbHVtZSA8IDApIHtcbiAgICAgICAgICB2b2x1bWUgPSAwO1xuICAgICAgICB9IGVsc2UgaWYgKHZvbHVtZSA+IDEwMCkge1xuICAgICAgICAgIHZvbHVtZSA9IDEwMDtcbiAgICAgICAgfVxuICAgICAgICAvL1RoZSBhY3R1YWwgdGhpcy5hdWRpbyBBUEkgZXhwZWN0cyBhIG51bWJlciBpbiB0aGUgcmFuZ2Ugb2YgMCB0byAxXG4gICAgICAgIGNvbnNvbGUubG9nKFwiU2V0dGluZyB2b2x1bWUgdG8gXCIgKyB2b2x1bWUgKyBcIiVcIik7XG4gICAgICAgIHRoaXMuX3ZvbHVtZS5zYXZlKHZvbHVtZSk7XG4gICAgICAgIHRoaXMuYXVkaW8udm9sdW1lID0gdm9sdW1lIC8gMTAwO1xuICAgICAgfSxcblxuICAgICAgLyoqIHZvbHVtZSBpcyBpbiBwZXJjZW50ICovXG4gICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGgucm91bmQodGhpcy5hdWRpby52b2x1bWUgKiAxMDApO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIEFsYXJtO1xufSkoKTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBBbGFybTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUFsYXJtLmpzLm1hcFxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIga2V5IGluIHByb3BzKSB7IHZhciBwcm9wID0gcHJvcHNba2V5XTsgcHJvcC5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAocHJvcC52YWx1ZSkgcHJvcC53cml0YWJsZSA9IHRydWU7IH0gT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcyk7IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSkoKTtcblxudmFyIF9jbGFzc0NhbGxDaGVjayA9IGZ1bmN0aW9uIChpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9O1xuXG4vKiBnbG9iYWwgY29uc29sZSxjaHJvbWUgKi9cblxuY29uc29sZS5pbmZvKFwiTWVzc2VuZ2VyIG1vZHVsZVwiKTtcblxudmFyIE1lc3NlbmdlciA9IChmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIE1lc3NlbmdlcihuYW1lKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIE1lc3Nlbmdlcik7XG5cbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKE1lc3Nlbmdlciwge1xuICAgIHRyaWdnZXI6IHtcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiB0cmlnZ2VyKG5hbWUsIHBhcmFtLCBjYikge1xuICAgICAgICBjb25zb2xlLmluZm8odGhpcy5uYW1lLCBcIlNlbmRpbmdcIiwgbmFtZSwgcGFyYW0pO1xuICAgICAgICAvLyB7QGxpbmsgaHR0cHM6Ly9kZXZlbG9wZXIuY2hyb21lLmNvbS9leHRlbnNpb25zL3J1bnRpbWUjbWV0aG9kLXNlbmRNZXNzYWdlfVxuICAgICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IHNyYzogdGhpcy5uYW1lLCBuYW1lOiBuYW1lLCBwYXJhbTogcGFyYW0gfSwgY2IpO1xuICAgICAgfVxuICAgIH0sXG4gICAgb246IHtcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBvbihuYW1lLCBoYW5kbGVyKSB7XG4gICAgICAgIC8vIHtAbGluayBodHRwczovL2RldmVsb3Blci5jaHJvbWUuY29tL2V4dGVuc2lvbnMvcnVudGltZSNldmVudC1vbk1lc3NhZ2V9XG4gICAgICAgIC8vZnVuY3Rpb24gaGFuZGxlcihhbnkgbWVzc2FnZSwgTWVzc2FnZVNlbmRlciBzZW5kZXIsIGZ1bmN0aW9uIHNlbmRSZXNwb25zZSlcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAvL1RPRE86IGJ1ZzogdGhpcyBpcyBub3QgZ29vZC4gQmVjYXVzZSBvbmx5IHRoZSBsYXN0IGZ1bmN0aW9uIHdpbGwgYmUgc3RvcmVkIGluIHRoaXMubGlzdGVuZXIgYW5kIHVucmVnaXN0ZXJlZCBsYXRlcigpXG4gICAgICAgIHRoaXMubGlzdGVuZXIgPSBmdW5jdGlvbiAobWVzc2FnZSwgc2VuZGVyLCBjYikge1xuICAgICAgICAgIGlmIChtZXNzYWdlLm5hbWUgPT09IG5hbWUgJiYgbWVzc2FnZS5zcmMgIT09IHNlbGYubmFtZSkge1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKHNlbGYubmFtZSwgXCJSZWNlaXZpbmdcIiwgbWVzc2FnZS5uYW1lKTtcbiAgICAgICAgICAgIGhhbmRsZXIobWVzc2FnZS5wYXJhbSwgY2IpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKHRoaXMubGlzdGVuZXIpO1xuICAgICAgfVxuICAgIH0sXG4gICAgdW5yZWdpc3Rlcjoge1xuICAgICAgdmFsdWU6IGZ1bmN0aW9uIHVucmVnaXN0ZXIoKSB7XG4gICAgICAgIGlmICh0aGlzLmxpc3RlbmVyKSB7XG4gICAgICAgICAgY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLnJlbW92ZUxpc3RlbmVyKHRoaXMubGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gTWVzc2VuZ2VyO1xufSkoKTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBNZXNzZW5nZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1NZXNzZW5nZXIuanMubWFwXG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBrZXkgaW4gcHJvcHMpIHsgdmFyIHByb3AgPSBwcm9wc1trZXldOyBwcm9wLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChwcm9wLnZhbHVlKSBwcm9wLndyaXRhYmxlID0gdHJ1ZTsgfSBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKTsgfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG52YXIgX2NsYXNzQ2FsbENoZWNrID0gZnVuY3Rpb24gKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH07XG5cbi8qIGdsb2JhbCBjb25zb2xlLGNsZWFyVGltZW91dCxzZXRUaW1lb3V0ICovXG5cbi8vWW91IGhhY2tlcnMhXG5cbi8vIFRoZSBtb3RvcmljIHBhcnQgb2YgdGhlIHRpbWVyLlxuXG4vL1RPRE8gQ29uc2lkZXIgdXNpbmcgQ2hyb21lIGFsYXJtIEFQSSBodHRwczovL2RldmVsb3Blci5jaHJvbWUuY29tL2V4dGVuc2lvbnMvYWxhcm1zXG5cbnZhciBTdGF0aWMgPSByZXF1aXJlKFwiLi9TdGF0aWMuanNcIilbXCJkZWZhdWx0XCJdO1xuXG52YXIgQWxhcm0gPSByZXF1aXJlKFwiLi9BbGFybS5qc1wiKVtcImRlZmF1bHRcIl07XG5cbnZhciBub3RpZnkgPSByZXF1aXJlKFwiLi9ub3RpZnkuanNcIik7XG5cbnZhciBiYWRnZXIgPSByZXF1aXJlKFwiLi9iYWRnZXIuanNcIik7XG5cbnZhciBNZXNzZW5nZXIgPSByZXF1aXJlKFwiLi9NZXNzZW5nZXIuanNcIilbXCJkZWZhdWx0XCJdO1xuXG5jb25zb2xlLmluZm8oXCJtb3RvciBtb2R1bGVcIik7XG5cbnZhciBtc2cgPSBuZXcgTWVzc2VuZ2VyKFwiQkFDS0VORFwiKTtcbi8vVGhlIG9ubHkgaW5zdGFuY2Ugb2YgdGhlIGFsYXJtIHN5c3RlbVxudmFyIGFsYXJtID0gbmV3IEFsYXJtKCk7XG5cbnZhciBNb3RvciA9IChmdW5jdGlvbiAoKSB7XG4gIC8qKlxuICAgKiBAY29uc3RydWN0b3JcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgTW90b3JcbiAgICovXG5cbiAgZnVuY3Rpb24gTW90b3IoKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIE1vdG9yKTtcblxuICAgIC8vdGhpcy50aW1lb3V0SWQgaG9sZHMgdGhlIHJldHVybiB2YWx1ZSBvZiBzZXRUaW1lb3V0KClcbiAgICAvKiogdGhlIGVwb2NoIChpbiBtcykgc2luY2UgdGhlIHRpbWVyIGdvdCBzdGFydGVkICovXG4gICAgdGhpcy5fc3RhcnRUaW1lID0gbmV3IFN0YXRpYyhcIm1vdG9yLnN0YXJ0VGltZVwiLCAwKTtcbiAgICAvKiogVGhlIHRpbWUgcmVtYWluaW5nIHRpbGwgdGhlIHRpbWVyIGVuZHMgKi9cbiAgICB0aGlzLl9yZW1haW5pbmdUaW1lID0gbmV3IFN0YXRpYyhcIm1vdG9yLnJlbWFpbmluZ1RpbWVcIiwgMCk7XG4gICAgLyoqIFRoZSBnb2FsIG9mIHRoZSB0aW1lciAoaW4gbXMpKi9cbiAgICB0aGlzLl90aW1lclBlcmlvZCA9IG5ldyBTdGF0aWMoXCJtb3Rvci50aW1lclBlcmlvZFwiLCAwKTtcbiAgICAvKiogVGhlIHRpbWVyIHN0YXRlIGNhbiBiZSAncnVubmluZycsICdwYXVzZWQnIGFuZCAnc3RvcHBlZCcgKi9cbiAgICB0aGlzLl9zdGF0ZSA9IG5ldyBTdGF0aWMoXCJtb3Rvci5zdGF0ZVwiLCBcInN0b3BwZWRcIik7XG4gICAgYmFkZ2VyLnNldFN0YXRlKHRoaXMuX3N0YXRlLmxvYWQoKSk7XG4gICAgLy9CaW5kIHRoZSB0aWNrIGZ1bmN0aW9uIHRvIHRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoZSBtb3RvclxuICAgIHRoaXMuX3RpY2sgPSB0aGlzLl9fdGljay5iaW5kKHRoaXMpO1xuICAgIC8vaW5pdGlhbGl6ZSB0aGUgdGltZXJcbiAgICBpZiAodGhpcy5fc3RhdGUubG9hZCgpID09PSBcInJ1bm5pbmdcIikge1xuICAgICAgbXNnLnRyaWdnZXIoXCJtb3Rvci5zdGFydFwiLCB0aGlzLl90aW1lclBlcmlvZC5sb2FkKCkpO1xuICAgICAgLy9ydW4gdGljayBvbmNlIHRvIHN0YXJ0IHRoZSBsb29wXG4gICAgICB0aGlzLl90aWNrKCk7XG4gICAgfVxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBtc2cub24oXCJtb3Rvci50b2dnbGVcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgc2VsZi50b2dnbGUoKTtcbiAgICB9KTtcbiAgICBtc2cub24oXCJtb3Rvci5yZXNldFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICBzZWxmLnN0b3AoKTtcbiAgICB9KTtcbiAgICBtc2cub24oXCJtb3Rvci5zdGFydFwiLCBmdW5jdGlvbiAoZW5kSW4pIHtcbiAgICAgIHNlbGYuc3RhcnQoZW5kSW4pO1xuICAgIH0pO1xuICAgIG1zZy5vbihcIm1vdG9yLnJlc3RhcnRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgc2VsZi5yZXN0YXJ0KCk7XG4gICAgfSk7XG4gICAgbXNnLm9uKFwibW90b3IuZ2V0U3RhdGVcIiwgZnVuY3Rpb24gKF8sIGNiKSB7XG4gICAgICBjYihzZWxmLl9zdGF0ZS5sb2FkKCkpO1xuICAgIH0pO1xuICAgIG1zZy5vbihcImFsYXJtLnNldFZvbHVtZVwiLCBmdW5jdGlvbiAodm9sdW1lKSB7XG4gICAgICBhbGFybS52b2x1bWUgPSB2b2x1bWU7XG4gICAgfSk7XG4gICAgbXNnLm9uKFwiYWxhcm0uZ2V0Vm9sdW1lXCIsIGZ1bmN0aW9uIChfLCBjYikge1xuICAgICAgY2IoYWxhcm0udm9sdW1lKTtcbiAgICB9KTtcbiAgICBtc2cub24oXCJhbGFybS5zZXRTaWduYWxJbmRleFwiLCBmdW5jdGlvbiAoc2lnbmFsSW5kZXgpIHtcbiAgICAgIGFsYXJtLnNpZ25hbEluZGV4ID0gc2lnbmFsSW5kZXg7XG4gICAgfSk7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoTW90b3IsIHtcbiAgICBfX3RpY2s6IHtcblxuICAgICAgLyoqXG4gICAgICAgKiBUaGUgaW50ZXJ2YWwgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBldmVyeSBzZWNvbmQgd2hpbGUgdGhlIHRpbWVyIGlzIHJ1bm5pbmdcbiAgICAgICAqIEl0IGlzIG5vdCBndWFyYW50ZWVkIHRoYXQgdGhpcyBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBldmVyeSBzaW5nbGUgc2Vjb25kLlxuICAgICAgICogSW4gb3RoZXIgd29yZHMgaXQgbWF5IHNraXAgYSBzZWNvbmQuIEJ1dCB3aGVuIGl0IGlzIGNhbGxlZCwgaXQgaXMgcGFzc2VkIHRoZSBudW1iZXIgb2ZcbiAgICAgICAqIGVsYXBzZWQgc2Vjb25kcy5cbiAgICAgICAqIEZvciBleGFtcGxlIGlmIHRoZSBicm93c2VyIGRvZXNuJ3QgcnVuIHRoZSBzZXRUaW1lb3V0KCkgYXMgcXVpY2sgYXMgd2UgZXhwZWN0IG9yIGlmIHJ1bm5pbmcgdGhlXG4gICAgICAgKiBjYWxsYmFjayBmdW5jdGlvbiB0YWtlcyB0b28gbG9uZy5cbiAgICAgICAqIE5vdGU6IHRoZSBjb25zdHJ1Y3RvciB3aWxsIGNyZWF0ZSBhIG5ldyBmdW5jdGlvbiBmcm9tIHRoaXMgb25lIGNhbGxlZCB0aWNrKCkgdXNpbmcgXCJiaW5kXCIuXG4gICAgICAgKiBUaGF0IG9uZSByZWZlcnMgdG8gdGhpcyBtb3RvciBpbnN0YW5jZSBhcyBcInRoaXNcIi5cbiAgICAgICAqL1xuXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gX190aWNrKCkge1xuICAgICAgICAvLyBVbnNjaGVkdWxpbmcgYW55IHBvc3NpYmxlIHRpbWVvdXQgZXZlbnRcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dElkKTtcbiAgICAgICAgdGhpcy5fcmVtYWluaW5nVGltZS5zYXZlKHRoaXMuX3N0YXJ0VGltZS5sb2FkKCkgKyB0aGlzLl90aW1lclBlcmlvZC5sb2FkKCkgLSBEYXRlLm5vdygpKTtcbiAgICAgICAgaWYgKHRoaXMuX3JlbWFpbmluZ1RpbWUubG9hZCgpIDw9IDApIHtcbiAgICAgICAgICAvL2NhbGwgdGljayBldmVudCBsaXN0ZW5lcnNcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIlRpY2sgcGFzdCB0aGUgcGxhbm5lZCBhbGFybSBtb21lbnQgYnlcIiwgdGhpcy5fcmVtYWluaW5nVGltZS5sb2FkKCksIFwibXNcIik7XG4gICAgICAgICAgdGhpcy5zdG9wKCk7XG4gICAgICAgICAgYWxhcm0ucGxheSgpO1xuICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICBub3RpZnkuc2hvdyhcIlRpbWUgdXAhXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGFsYXJtLnN0b3AoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBiYWRnZXIuc2V0VGltZSgwKTtcbiAgICAgICAgICBtc2cudHJpZ2dlcihcIm1vdG9yLnRpY2tcIiwgMCk7XG4gICAgICAgICAgbXNnLnRyaWdnZXIoXCJtb3Rvci5lbmRcIiwgdGhpcy5fdGltZXJQZXJpb2QubG9hZCgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBiYWRnZXIuc2V0VGltZSh0aGlzLl9yZW1haW5pbmdUaW1lLmxvYWQoKSk7XG4gICAgICAgICAgLy9jYWxsIHRpY2sgZXZlbnQgbGlzdGVuZXJzXG4gICAgICAgICAgbXNnLnRyaWdnZXIoXCJtb3Rvci50aWNrXCIsIHRoaXMuX3JlbWFpbmluZ1RpbWUubG9hZCgpKTtcbiAgICAgICAgICAvLyBPbmx5IHNjaGVkdWxlIGFub3RoZXIgJHRpbWVyIGlmIHRoZSBjdXJyZW50IG9uZSBpcyBmaW5pc2hlZCBydW5uaW5nIGFuZCB0aGUgdGltZXIgaXMgc3RpbGwgcnVubmluZy5cbiAgICAgICAgICBpZiAodGhpcy5pc1J1bm5pbmcoKSkge1xuICAgICAgICAgICAgdmFyIHdob2xlU2Vjb25kc1JlbWFpbmluZyA9IE1hdGguZmxvb3IodGhpcy5fcmVtYWluaW5nVGltZS5sb2FkKCkgLyAxMDAwKTtcbiAgICAgICAgICAgIHZhciBuZXh0VGljayA9IHRoaXMuX3JlbWFpbmluZ1RpbWUubG9hZCgpIC0gd2hvbGVTZWNvbmRzUmVtYWluaW5nICogMTAwMDtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU2NoZWR1bGluZyBhbm90aGVyIHRpY2soKSBpbiBcIiwgbmV4dFRpY2ssIFwibXNcIiwgXCJyZW1haW5pbmc6XCIsIHdob2xlU2Vjb25kc1JlbWFpbmluZyk7XG4gICAgICAgICAgICB0aGlzLnRpbWVvdXRJZCA9IHNldFRpbWVvdXQodGhpcy5fdGljaywgbmV4dFRpY2spO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJfdGljaygpIHJhbiB3aGlsZSB0aGUgdGltZXIgaXMgc3RvcHBlZFwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIGlzUnVubmluZzoge1xuICAgICAgdmFsdWU6IGZ1bmN0aW9uIGlzUnVubmluZygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXRlLmxvYWQoKSA9PT0gXCJydW5uaW5nXCI7XG4gICAgICB9XG4gICAgfSxcbiAgICBpc1BhdXNlZDoge1xuICAgICAgdmFsdWU6IGZ1bmN0aW9uIGlzUGF1c2VkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdGUubG9hZCgpID09PSBcInBhdXNlZFwiO1xuICAgICAgfVxuICAgIH0sXG4gICAgaXNTdG9wcGVkOiB7XG4gICAgICB2YWx1ZTogZnVuY3Rpb24gaXNTdG9wcGVkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdGUubG9hZCgpID09PSBcInN0b3BwZWRcIjtcbiAgICAgIH1cbiAgICB9LFxuICAgIHRvZ2dsZToge1xuICAgICAgdmFsdWU6IGZ1bmN0aW9uIHRvZ2dsZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNSdW5uaW5nKCkpIHtcbiAgICAgICAgICB0aGlzLnBhdXNlKCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5pc1BhdXNlZCgpKSB7XG4gICAgICAgICAgdGhpcy5yZXN1bWUoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgc3RhcnQ6IHtcblxuICAgICAgLyoqXG4gICAgICAgKiBTZXQgdGhlIHRpbWVyIHRvIGVuZCBpbiBlbmRJbiBtaWxsaXNlY29uZHMgZnJvbSBub3dcbiAgICAgICAqIEBwYXJhbSBlbmRJbiB7TnVtYmVyfSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIChyZWxhdGl2ZSB0aW1lIGZyb20gbm93KVxuICAgICAgICovXG5cbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBzdGFydChlbmRJbikge1xuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0SWQpO1xuICAgICAgICB0aGlzLl9zdGFydFRpbWUuc2F2ZShEYXRlLm5vdygpKTtcbiAgICAgICAgdGhpcy5fdGltZXJQZXJpb2Quc2F2ZShlbmRJbik7XG4gICAgICAgIGFsYXJtLnN0b3AoKTtcbiAgICAgICAgbm90aWZ5LmhpZGUoKTtcbiAgICAgICAgdGhpcy5fc3RhdGUuc2F2ZShcInJ1bm5pbmdcIik7XG4gICAgICAgIGJhZGdlci5zZXRTdGF0ZSh0aGlzLl9zdGF0ZS5sb2FkKCkpO1xuICAgICAgICBiYWRnZXIuc2V0VGltZSh0aGlzLl90aW1lclBlcmlvZC5sb2FkKCkpO1xuICAgICAgICBtc2cudHJpZ2dlcihcIm1vdG9yLnN0YXJ0XCIsIHRoaXMuX3RpbWVyUGVyaW9kLmxvYWQoKSk7XG4gICAgICAgIC8vcnVuIHRpY2sgb25jZSB0byBzdGFydCB0aGUgbG9vcFxuICAgICAgICB0aGlzLl90aWNrKCk7XG4gICAgICB9XG4gICAgfSxcbiAgICByZXN1bWU6IHtcblxuICAgICAgLyoqIFJlc3VtZXMgYSBwYXVzZWQgdGltZXIgKi9cblxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIHJlc3VtZSgpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJSZXN1bWluZyB0aGUgbW90b3IgZnJvbSBwYXVzZVwiKTtcbiAgICAgICAgdmFyIGVuZFRpbWUgPSBEYXRlLm5vdygpICsgdGhpcy5fcmVtYWluaW5nVGltZS5sb2FkKCk7XG4gICAgICAgIC8vc2V0IGEgdmlydHVhbCBzdGFydFRpbWUgaW4gdGhlIHBhc3QgdGltZSBzbyB0aGF0IHRoZSB0aWNrIGFsZ29yaXRobXMgd29yayBwcm9wZXJseVxuICAgICAgICB0aGlzLl9zdGFydFRpbWUuc2F2ZShlbmRUaW1lIC0gdGhpcy5fdGltZXJQZXJpb2QubG9hZCgpKTtcbiAgICAgICAgdGhpcy5fc3RhdGUuc2F2ZShcInJ1bm5pbmdcIik7XG4gICAgICAgIGJhZGdlci5zZXRTdGF0ZSh0aGlzLl9zdGF0ZS5sb2FkKCkpO1xuICAgICAgICAvL3J1biB0aWNrIG9uY2UgdG8gc3RhcnQgdGhlIGxvb3BcbiAgICAgICAgdGhpcy5fdGljaygpO1xuICAgICAgfVxuICAgIH0sXG4gICAgcGF1c2U6IHtcblxuICAgICAgLyoqIFBhdXNlcyB0aGUgdGltZXIuIEl0IGNhbiBiZSByZXN1bWVkIG9yIHNldCBhZ2FpbiAqL1xuXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gcGF1c2UoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiUGF1c2luZyB0aGUgbW90b3JcIik7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXRJZCk7XG4gICAgICAgIHRoaXMuX3N0YXRlLnNhdmUoXCJwYXVzZWRcIik7XG4gICAgICAgIGJhZGdlci5zZXRTdGF0ZSh0aGlzLl9zdGF0ZS5sb2FkKCkpO1xuICAgICAgICBhbGFybS5zdG9wKCk7XG4gICAgICAgIG5vdGlmeS5oaWRlKCk7XG4gICAgICAgIGJhZGdlci5zZXRUaW1lKHRoaXMuX3JlbWFpbmluZ1RpbWUubG9hZCgpKTtcbiAgICAgICAgbXNnLnRyaWdnZXIoXCJtb3Rvci50aWNrXCIsIHRoaXMuX3JlbWFpbmluZ1RpbWUubG9hZCgpKTtcbiAgICAgICAgbXNnLnRyaWdnZXIoXCJtb3Rvci5wYXVzZVwiLCB0aGlzLl9yZW1haW5pbmdUaW1lLmxvYWQoKSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBzdG9wOiB7XG5cbiAgICAgIC8qKiBzdG9wcyB0aGUgbW90b3Igc28gdGhlIGNhbGxiYWNrIGZ1bmN0aW9uIHdpbGwgbm90IGJlIGNhbGxlZCBhbnltb3JlICovXG5cbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBzdG9wKCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIlN0b3BwaW5nIHRoZSBtb3RvclwiKTtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dElkKTtcbiAgICAgICAgdGhpcy5fc3RhdGUuc2F2ZShcInN0b3BwZWRcIik7XG4gICAgICAgIGJhZGdlci5zZXRTdGF0ZSh0aGlzLl9zdGF0ZS5sb2FkKCkpO1xuICAgICAgICB0aGlzLl9yZW1haW5pbmdUaW1lLnJlc2V0KCk7XG4gICAgICAgIGFsYXJtLnN0b3AoKTtcbiAgICAgICAgbm90aWZ5LmhpZGUoKTtcbiAgICAgICAgYmFkZ2VyLnNldFRpbWUoKTtcbiAgICAgICAgbXNnLnRyaWdnZXIoXCJtb3Rvci50aWNrXCIsIHRoaXMuX3JlbWFpbmluZ1RpbWUubG9hZCgpKTtcbiAgICAgICAgbXNnLnRyaWdnZXIoXCJtb3Rvci5zdG9wXCIpO1xuICAgICAgfVxuICAgIH0sXG4gICAgcmVzdGFydDoge1xuXG4gICAgICAvKiogcmVzdGFydHMgdGhlIHRpbWVyIHdpdGggdGhlIGxhc3QgdGltZXJQZXJpb2QgKi9cblxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIHJlc3RhcnQoKSB7XG4gICAgICAgIGNvbnNvbGUuaW5mbyhcIk1vdG9yIHJlc2V0XCIpO1xuICAgICAgICB0aGlzLnN0YXJ0KHRoaXMuX3RpbWVyUGVyaW9kLmxvYWQoKSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gTW90b3I7XG59KSgpO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IE1vdG9yO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9TW90b3IuanMubWFwXG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBrZXkgaW4gcHJvcHMpIHsgdmFyIHByb3AgPSBwcm9wc1trZXldOyBwcm9wLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChwcm9wLnZhbHVlKSBwcm9wLndyaXRhYmxlID0gdHJ1ZTsgfSBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKTsgfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG52YXIgX2NsYXNzQ2FsbENoZWNrID0gZnVuY3Rpb24gKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH07XG5cbi8qZ2xvYmFsIGNvbnNvbGUsbG9jYWxTdG9yYWdlLEpTT04gKi9cblxuY29uc29sZS5pbmZvKFwic3RhdGljIG1vZHVsZVwiKTtcblxuLy9BIGNvbnN0cnVjdG9yIGZvciBwZXJzaXN0ZW50IHZhbHVlcyAodXNlcyBsb2NhbFN0b3JhZ2UpXG5cbnZhciBTdGF0aWMgPSAoZnVuY3Rpb24gKCkge1xuICAvL05vdGU6IHRoZSBrZXkgbXVzdCBiZSB1bmlxdWUgYW5kIGl0J3MgdXAgdG8gdGhlIGNhbGxlciB0byBtYWtlIHN1cmUgbm8gdHdvIGtleXMgYXJlIGR1cGxpY2F0ZWQgaW4gdGhlIHdob2xlIGFwcGxpY2F0aW9uXG5cbiAgZnVuY3Rpb24gU3RhdGljKGtleSwgZGVmYXVsdFZhbHVlKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFN0YXRpYyk7XG5cbiAgICB0aGlzLmtleSA9IGtleTtcbiAgICB0aGlzLmRlZmF1bHRWYWx1ZSA9IGRlZmF1bHRWYWx1ZTtcbiAgICAvL1RoZSB2YWx1ZSB3aWxsIGJlIHdyaXR0ZW4gdGhlIGZpcnN0IHRpbWUgbG9hZCgpIGlzIGNhbGxlZFxuICAgIHRoaXMubG9hZCgpO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKFN0YXRpYywge1xuICAgIHJlc2V0OiB7XG4gICAgICAvL1Jlc2V0cyB0aGUgdmFyaWFibGUgdG8gaXRzIGRlZmF1bHQgcGFyYW1ldGVyIGFuZCByZXR1cm5zIGl0XG5cbiAgICAgIHZhbHVlOiBmdW5jdGlvbiByZXNldCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2F2ZSh0aGlzLnNhdmUodGhpcy5kZWZhdWx0VmFsdWUpKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGxvYWQ6IHtcbiAgICAgIC8vTG9hZHMgdGhlIHZhbHVlIG9mIHRoZSB2YXJpYWJsZSBmcm9tIGxvY2FsU3RvcmFnZVxuXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gbG9hZCgpIHtcbiAgICAgICAgLy92YWx1ZUpzb24gd2lsbCBiZSBudWxsIGlmIHRoZSBsb2NhbFN0b3JhZ2UgaXMgbmV2ZXIgc2V0XG4gICAgICAgIHZhciB2YWx1ZUpzb24gPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSh0aGlzLmtleSk7XG4gICAgICAgIGlmICh2YWx1ZUpzb24gIT09IG51bGwpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIHBhcnNlZEpzb24gPSBKU09OLnBhcnNlKHZhbHVlSnNvbik7XG4gICAgICAgICAgICBpZiAoXCJ2YWx1ZVwiIGluIHBhcnNlZEpzb24pIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlZEpzb24udmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJJbnZhbGlkIG9iamVjdCBzdG9yZWQgZm9yXCIsIHRoaXMua2V5LCBcImluIGxvY2FsIHN0b3JhZ2U6XCIsIHZhbHVlSnNvbiwgXCIgTG9hZGluZyBkZWZhdWx0LlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJWYWx1ZSBvZlwiLCB0aGlzLmtleSwgXCJjaGFuZ2VkIGV4dGVybmFsbHkuIExvYWRpbmcgZGVmYXVsdC5cIik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnJlc2V0KCk7XG4gICAgICB9XG4gICAgfSxcbiAgICBzYXZlOiB7XG4gICAgICAvL05vdGU6IGNhbGxpbmcgc2F2ZSgpIHJ1bnMgb25lIEpTT04uc3RyaW5naWZ5KCkgYW5kIG9uZSBKU09OLnBhcnNlKClcblxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIHNhdmUodmFsdWUpIHtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0odGhpcy5rZXksIEpTT04uc3RyaW5naWZ5KHsgdmFsdWU6IHZhbHVlIH0pKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9hZCgpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIFN0YXRpYztcbn0pKCk7XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gU3RhdGljO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U3RhdGljLmpzLm1hcFxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuc2V0VGltZSA9IHNldFRpbWU7XG5leHBvcnRzLnNldFN0YXRlID0gc2V0U3RhdGU7XG4vKiBnbG9iYWwgY2hyb21lICovXG5cbnZhciBjb252ZXJ0ID0gcmVxdWlyZShcIi4vY29udmVydC5qc1wiKTtcblxuY29uc29sZS5pbmZvKFwiYmFkZ2VyIG1vZHVsZVwiKTtcblxuZnVuY3Rpb24gc2V0VGltZSh0aW1lKSB7XG4gIHZhciBobXMgPSBjb252ZXJ0Lm1zMmhtcyh0aW1lKTtcbiAgY2hyb21lLmJyb3dzZXJBY3Rpb24uc2V0QmFkZ2VUZXh0KHsgdGV4dDogY29udmVydC5tc1RvU2hvcnRNaW4odGltZSkgfSk7XG5cbiAgdmFyIGNvbG9yO1xuICBpZiAoaG1zLm1mIDw9IDEpIHtcbiAgICBjb2xvciA9IFwiI2YwMFwiOyAvL3JlZFxuICB9IGVsc2UgaWYgKGhtcy5tZiA8PSAxMCkge1xuICAgIGNvbG9yID0gXCIjZTU4NzAwXCI7IC8vb3JhbmdlXG4gIH0gZWxzZSB7XG4gICAgY29sb3IgPSBcIiMwMGFmMWRcIjsgLy9ncmVlblxuICB9XG4gIGNocm9tZS5icm93c2VyQWN0aW9uLnNldEJhZGdlQmFja2dyb3VuZENvbG9yKHsgY29sb3I6IGNvbG9yIH0pO1xufVxuXG5mdW5jdGlvbiBzZXRTdGF0ZShzdGF0ZSkge1xuICB2YXIgaWNvbjtcbiAgc3dpdGNoIChzdGF0ZSkge1xuICAgIGNhc2UgXCJydW5uaW5nXCI6XG4gICAgICBpY29uID0ge1xuICAgICAgICBcIjE5XCI6IFwiaW1nL3BvcHVwLWljb24tb24tMTkucG5nXCIsXG4gICAgICAgIFwiMzhcIjogXCJpbWcvcG9wdXAtaWNvbi1vbi0zOC5wbmdcIlxuICAgICAgfTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJwYXVzZWRcIjpcbiAgICBjYXNlIFwic3RvcHBlZFwiOlxuICAgIGRlZmF1bHQ6XG4gICAgICBpY29uID0ge1xuICAgICAgICBcIjE5XCI6IFwiaW1nL3BvcHVwLWljb24tb2ZmLTE5LnBuZ1wiLFxuICAgICAgICBcIjM4XCI6IFwiaW1nL3BvcHVwLWljb24tb2ZmLTM4LnBuZ1wiXG4gICAgICB9O1xuICAgICAgYnJlYWs7XG4gIH1cbiAgY2hyb21lLmJyb3dzZXJBY3Rpb24uc2V0SWNvbih7IHBhdGg6IGljb24gfSk7XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1iYWRnZXIuanMubWFwXG4iLCJcblxuLyoqIGNvbnZlcnRzIHJhZGlhbiB0byBkZWdyZWUgKi9cblwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLnJhZDJkZWcgPSByYWQyZGVnO1xuXG4vKiogY29udmVydHMgZGVncmVlIHRvIHJhZGlhbiAqL1xuZXhwb3J0cy5kZWcycmFkID0gZGVnMnJhZDtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBhbmdsZSBmcm9tIHRoZSBjZW50ZXIgZm9yIGEgcG9pbnQgKCB4LCB5ICkgaW4gYSBzcXVhcmUgd2l0aCB3aWR0aCBhbmQgaGVpZ2h0ICd3J1xuICogQHJldHVybiB7bnVtYmVyfSB0aGUgYW5nbGUgaW4gcmFkaWFuXG4gKi9cbmV4cG9ydHMuYW5nbGVGcm9tQ2VudGVyID0gYW5nbGVGcm9tQ2VudGVyO1xuXG4vKipcbiAqIENvbnZlcnRzIGFuIGFuZ2xlIGludG8gcm90YXRpb24gaW4gYSB3YXkgdGhhdCB0aGUgaGFuZCBjYW4gYmUgZGlyZWN0bHkgc2V0IHdpdGggaXRcbiAqIEBwYXJhbSBhbmdsZSB7bnVtYmVyfSB0aGUgYW5nbGUgaW4gcmFkaWFuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSB0aGUgcm9hdGF0aW9uIHRoYXQgY2FuIGJlIHVzZWQgZm9yIHJvdGF0ZVgoKSBjc3MgZnVuY3Rpb25cbiAqL1xuZXhwb3J0cy5hbmdsZVRvUm90YXRpb24gPSBhbmdsZVRvUm90YXRpb247XG5cbi8qKlxuICogQ29udmVydHMgYSByb3RhdGlvbiBhbmdsZSBpbnRvIG1pbnV0ZVxuICogQHBhcmFtIHJvdGF0aW9uIHtudW1iZXJ9IHRoZSBhbmdsZSBpbiByYWRpYW5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IG1pbnV0ZVxuICovXG5leHBvcnRzLnJvdGF0aW9uVG9NaW4gPSByb3RhdGlvblRvTWluO1xuXG4vKipcbiAqIENvbnZlcnRzIGEgbWludXRlIGludG8gcm90YXRpb24gKHRoZSBvcHBvc2l0ZSBvZiByb3RhdGlvblRvTWluKVxuICogQHBhcmFtIG1pbnV0ZSB7bnVtYmVyfSB0aGUgbWludXRlIChmcm9tIDAgdG8gNjApXG4gKiBAcmV0dXJucyB7bnVtYmVyfSByYWRpYW5cbiAqL1xuZXhwb3J0cy5taW5Ub1JvdGF0aW9uID0gbWluVG9Sb3RhdGlvbjtcblxuLyoqIE5vcm1hbGl6ZXMgYSByYWRpYW4gdmFsdWUgdG8gYmUgYmV0d2VlbiAtUEkuLlBJXG4gKiBAc2VlIG1pbk5vcm0gZm9yIG1vcmUgaW5mbyBhYm91dCBob3cgdGhlIGFsZ29yaXRobSB3b3Jrcy5cbiAqL1xuZXhwb3J0cy5yYWROb3JtID0gcmFkTm9ybTtcblxuLyoqIE5vcm1hbGl6ZXMgYSBtaW51dGUgdmFsdWUgdG8gYmUgYmV0d2VlbiAwLi42MC5cbiAqIElmIHRoZSBtaW51dGUgaXMgYSBuZWdhdGl2ZSB2YWx1ZSBpdCdsbCBiZSBpbmNyZWFzZWQgYnkgNjAgdW50aWwgaXQgYmVjb21lcyAwIG9yIGFib3ZlIDAuXG4gKiBJZiB0aGUgbWludXRlIGlzIGJpZ2dlciB0aGFuIDYwIGl0J2xsIGJlIGRlY3JlYXNlZCBieSA2MCB1bnRpbCBpdCBiZWNvbWVzIDYwIG9yIGJlbG93IDYwLlxuICogU28gLTEyMCBiZWNvbWVzIDAgYnV0IDEyMCBiZWNvbWVzIDYwLlxuICovXG5leHBvcnRzLm1pbk5vcm0gPSBtaW5Ob3JtO1xuXG4vKiogY29udmVydCBhIHJhZGlhbiB0byBtaW51ZSAqL1xuZXhwb3J0cy5yYWQybWluID0gcmFkMm1pbjtcblxuLyoqIGNvbnZlcnRzIGEgbWludXRlIHRvIHJhZGlhbiAqL1xuZXhwb3J0cy5taW4ycmFkID0gbWluMnJhZDtcblxuLyoqIG5vcm1hbGl6ZXMgYW5kIHRoZW4gY29udmVydCBhIHJhZGlhbiB0byBtaW51ZSAqL1xuZXhwb3J0cy5yYWQybWluTm9ybSA9IHJhZDJtaW5Ob3JtO1xuXG4vKipcbiAqIGRldGVybWluZXMgdGhlIHJvdGF0aW9uIGFuZ2xlIG9mIHRoZSBtaW51dGUgaGFuZCBpbiBjbG9ja3dpc2Ugc3lzdGVtXG4gKiBub3JtYWxpemVzIGFuZCB0aGVuIGNvbnZlcnRzIGEgbWludXRlIHRvIHJhZGlhblxuICovXG5leHBvcnRzLm1pbjJyYWROb3JtID0gbWluMnJhZE5vcm07XG5cbi8qKiBjb252ZXJ0cyBhbiBhbmdsZSBmcm9tIGNsb2Nrd2lzZSBzeXN0ZW0gdG8gYW50aWNsb2Nrd2lzZSBzeXN0ZW0uXG4gKiBBbnRpY2xvY2t3aXNlIHN5c3RlbSBpcyB1c2VkIGJ5IENhbnZhcyBhbmQgQ1NTXG4gKi9cbmV4cG9ydHMuY2xvY2t3aXNlMmFudGljbG9ja3dpc2UgPSBjbG9ja3dpc2UyYW50aWNsb2Nrd2lzZTtcblxuLyoqIGNvbnZlcnRzIGFuIGFuZ2xlIGZyb20gYW50aWNsb2Nrd2lzZSBzeXN0ZW0gdG8gY2xvY2t3aXNlIHN5c3RlbVxuICogQW50aWNsb2Nrd2lzZSBzeXN0ZW0gaXMgdXNlZCBieSBDYW52YXMgYW5kIENTU1xuICovXG5leHBvcnRzLmFudGljbG9ja3dpc2UyY2xvY2t3aXNlID0gYW50aWNsb2Nrd2lzZTJjbG9ja3dpc2U7XG5cbi8qKlxuICogTWFwcyBhIHZhbHVlIGZyb20gb25lIHNwYWNlIHRvIGFub3RoZXIuXG4gKiBAcGFyYW0gc3JjTWluIHtudW1iZXJ9IG1pbmltdW0gcG9zc2libGUgdmFsdWUgaW4gdGhlIHNvdXJjZSBzcGFjZVxuICogQHBhcmFtIHNyY01heCB7bnVtYmVyfSBtYXhpbXVtIHBvc3NpYmxlIHZhbHVlIGluIHRoZSBzb3VyY2Ugc3BhY2VcbiAqIEBwYXJhbSBkc3RNaW4ge251bWJlcn0gbWluaW11bSBwb3NzaWJsZSB2YWx1ZSBpbiB0aGUgZGVzdGluYXRpb24gc3BhY2VcbiAqIEBwYXJhbSBkc3RNYXgge251bWJlcn0gbWF4aW11bSBwb3NzaWJsZSB2YWx1ZSBpbiB0aGUgZGVzdGluYXRpb24gc3BhY2VcbiAqIEBwYXJhbSB4IHtudW1iZXJ9IHRoZSB2YWx1ZSBvZiB4IGluIHRoZSBzb3VyY2Ugc3BhY2VcbiAqIEByZXR1cm4ge251bWJlcn0gdGhlIHZhbHVlIG9mIHggaW4gdGhlIGRlc3RpbmF0aW9uIHNwYWNlXG4gKi9cbmV4cG9ydHMubWFwU3BhY2UgPSBtYXBTcGFjZTtcblxuLyoqXG4gKiBDb252ZXJ0cyBuIHRvIHN0cmluZyBidXQgaWYgbiBpcyBsZXNzIHRoYW4gMTAgcHJlZml4ZXMgaXQgd2l0aCBhbiBhZGRpdGlvbmFsICcwJyB0byBtYWtlIGl0IGxvb2sgZG91YmxlIGRpZ2l0XG4gKiBUaGlzIGZ1bmN0aW9uIGRvZXNuJ3QgY2hlY2sgaWYgdGhlIG91dHB1dCBpcyBiaWdnZXIgdGhhbiA5OSBidXQgbiBpcyBleHBlY3RlZCB0byBiZSBpbiB0aGF0IHJhbmdlIGFueXdheVxuICogVGhpcyBmdW5jdGlvbiBkb2Vzbid0IGV2ZW4gY2hlY2sgaWYgbiBpcyBhIG51bWJlciBidXQgaWYgaXQgaXNuJ3QgdGhlIHJlc3VsdCBpcyBnb2luZyB0byBiZSB1bnByZWRpY3RhYmxlXG4gKiBAcGFyYW0gbiB7bnVtYmVyfSBhIG51bWJlciBiZXR3ZWVuIDAgdG8gOTlcbiAqIEByZXR1cm4ge1N0cmluZ30gdGhlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBuXG4gKi9cbi8vVE9ETzogd2UgYXJlIGFzc3VtaW5nIHRoYXQgaWYgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgZm9yIGFuIHVuZGVmaW5lZCBuLCBpdCBzaG91bGQgYmUgZGVmYXVsdGVkIHRvIDAuIE5vdCBhIGdvb2QgYXNzdW1wdGlvbi5cbmV4cG9ydHMuZG91YmxlRGlnaXQgPSBkb3VibGVEaWdpdDtcblxuLyoqXG4gKiBDb252ZXJ0cyBhIG51bWJlciBvZiBzZWNvbmRzIHRvIE1NOlNTIHN0cmluZyBmb3JtYXRcbiAqIE5vdGUgdGhhdCBpZiBtaW51dGVzIGFyZSBtb3JlIHRoYW4gNjAgdGhleSB3aWxsIHN0aWxsIGJlIHNob3duIGFzIGlzICh3b24ndCBzaG93IGhvdXIgYW55d2F5KVxuICogQHBhcmFtIHNlY29uZHMge251bWJlcn1cbiAqIEByZXR1cm4ge1N0cmluZ30gdGhlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgZ2l2ZW4gbnVtYmVyIG9mIHNlY29uZHMgaW4gTU06U1MgZm9ybWF0XG4gKi9cbmV4cG9ydHMubXNUb1N0cmluZyA9IG1zVG9TdHJpbmc7XG5leHBvcnRzLm1pblRvTU1TUyA9IG1pblRvTU1TUztcblxuLyoqXG4gKiBQdXRzIGEgbnVtZXJpY2FsIHZhbHVlIGluIHRoZSBzcGVjaWZpZWQgcmFuZ2VcbiAqL1xuZXhwb3J0cy5wdXRJblJhbmdlID0gcHV0SW5SYW5nZTtcblxuLyoqIENvbnZlcnRzIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIGhvdXIsIG1pbnV0ZSBhbmQgc2Vjb25kcyAqL1xuZXhwb3J0cy5tczJobXMgPSBtczJobXM7XG5cbi8qKlxuICogQHBhcmFtIHRpbWUge051bWJlcn0gdGltZSBpbiBtaWxsaXNlY29uZHNcbiAqIEByZXR1cm5zIHtTdHJpbmd9XG4gKi9cbmV4cG9ydHMubXMyaG1zU3RyaW5nID0gbXMyaG1zU3RyaW5nO1xuXG4vKipcbiAqIEBwYXJhbSBobXMge09iamVjdH0gd2l0aCAnaCcsICdtJywgYW5kICdzJyBjb21wb25lbnRzXG4gKiBAcmV0dXJucyB7U3RyaW5nfVxuICovXG5leHBvcnRzLmhtczJTdHJpbmcgPSBobXMyU3RyaW5nO1xuZXhwb3J0cy5ob3VyTWluU2VjMlN0cmluZyA9IGhvdXJNaW5TZWMyU3RyaW5nO1xuXG4vKiogQ29udmVydHMgdGhlIG51bWJlciBvZiBzZWNvbmRzIHRvIGhvdXIsIG1pbnV0ZSBhbmQgc2Vjb25kcyAqL1xuZXhwb3J0cy5zMmhtcyA9IHMyaG1zO1xuXG4vKiogY29udmVydHMgbWludXRlcyB0byBtaWxsaXNlY29uZHMgKi9cbmV4cG9ydHMubTJtcyA9IG0ybXM7XG5leHBvcnRzLmtlYmFiVG9DYW1lbCA9IGtlYmFiVG9DYW1lbDtcblxuLyoqXG4gKiBDb252ZXJ0cyBhIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gYSBtYXggNCBkaWdpdCBzdHJpbmcgdGhhdCBpcyBzdWl0YWJsZSBmb3Igc2hvd2luZyBvbiB0aGUgYmFkZ2UgY291bnRlclxuICogV2hlbiBtcyBpcyAwLCBpdCByZXR1cm5zIGFuIGVtcHR5IHN0cmluZ1xuICoqL1xuZXhwb3J0cy5tc1RvU2hvcnRNaW4gPSBtc1RvU2hvcnRNaW47XG5jb25zb2xlLmluZm8oXCJjb252ZXJ0IG1vZHVsZVwiKTtcblxudmFyIFBJID0gTWF0aC5QSTtcbnZhciBQSXgyID0gMiAqIFBJO1xudmFyIFBJXzIgPSBQSSAvIDI7XG52YXIgUElfMzAgPSBQSSAvIDMwO1xuZnVuY3Rpb24gcmFkMmRlZyhyYWQpIHtcbiAgLy9Ob3RlOiBkb24ndCB1c2UgUEl4MTgwIGNvbnN0YW50IGJlY2F1c2UgaXQgcmVkdWNlcyBhY2N1cmFjeVxuICByZXR1cm4gcmFkIC8gUEkgKiAxODA7XG59XG5cbmZ1bmN0aW9uIGRlZzJyYWQoZGVnKSB7XG4gIC8vTm90ZTogZG9uJ3QgdXNlIFBJXzE4MCBjb25zdGFudCBiZWNhdXNlIGl0IHJlZHVjZXMgYWNjdXJhY3lcbiAgcmV0dXJuIGRlZyAvIDE4MCAqIFBJO1xufVxuXG5mdW5jdGlvbiBhbmdsZUZyb21DZW50ZXIoeCwgeSwgdykge1xuICB2YXIgd18yID0gdyAvIDI7XG4gIHJldHVybiBNYXRoLmF0YW4yKHdfMiAtIHksIHggLSB3XzIpO1xufVxuXG5mdW5jdGlvbiBhbmdsZVRvUm90YXRpb24oYW5nbGUpIHtcbiAgaWYgKGFuZ2xlIDwgUElfMikge1xuICAgIHJldHVybiAtYW5nbGUgKyBQSV8yO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAtYW5nbGUgKyA1ICogUElfMjtcbiAgfVxufVxuXG5mdW5jdGlvbiByb3RhdGlvblRvTWluKHJvdGF0aW9uKSB7XG4gIHJldHVybiByb3RhdGlvbiAqIDYwIC8gUEl4Mjtcbn1cblxuZnVuY3Rpb24gbWluVG9Sb3RhdGlvbihtaW51dGUpIHtcbiAgcmV0dXJuIG1pbnV0ZSAqIFBJeDIgLyA2MDtcbn1cblxuZnVuY3Rpb24gcmFkTm9ybShyYWQpIHtcbiAgLy9UT0RPOiBvcHRpbWl6ZSB0aGlzIGZ1bmN0aW9uXG4gIHdoaWxlIChyYWQgPCAtUEkpIHtcbiAgICByYWQgKz0gUEl4MjtcbiAgfVxuICB3aGlsZSAocmFkID4gUEkpIHtcbiAgICByYWQgLT0gUEl4MjtcbiAgfVxuICByZXR1cm4gcmFkO1xufVxuXG5mdW5jdGlvbiBtaW5Ob3JtKG1pbikge1xuICAvL1RPRE86IG9wdGltaXplIHRoaXMgZnVuY3Rpb25cbiAgd2hpbGUgKG1pbiA8IDApIHtcbiAgICBtaW4gKz0gNjA7XG4gIH1cbiAgd2hpbGUgKG1pbiA+IDYwKSB7XG4gICAgbWluIC09IDYwO1xuICB9XG4gIHJldHVybiBtaW47XG59XG5cbmZ1bmN0aW9uIHJhZDJtaW4ocmFkKSB7XG4gIC8vT0xEIHJldHVybiAoIFBJXzIgLSByYWQgKSAvIFBJXzMwO1xuICByZXR1cm4gLSgzMCAqIHJhZCAvIFBJKTtcbn1cblxuZnVuY3Rpb24gbWluMnJhZChtaW4pIHtcbiAgcmV0dXJuIFBJXzIgLSBQSV8zMCAqIG1pbjtcbn1cblxuZnVuY3Rpb24gcmFkMm1pbk5vcm0ocmFkKSB7XG4gIHJldHVybiBtaW5Ob3JtKHJhZDJtaW4ocmFkKSk7XG59XG5cbmZ1bmN0aW9uIG1pbjJyYWROb3JtKG1pbikge1xuICByZXR1cm4gcmFkTm9ybShtaW4ycmFkKG1pbikpO1xufVxuXG5mdW5jdGlvbiBjbG9ja3dpc2UyYW50aWNsb2Nrd2lzZShhKSB7XG4gIHJldHVybiAtYTtcbn1cblxuZnVuY3Rpb24gYW50aWNsb2Nrd2lzZTJjbG9ja3dpc2UoYSkge1xuICByZXR1cm4gLWE7XG59XG5cbmZ1bmN0aW9uIG1hcFNwYWNlKHNyY01pbiwgc3JjTWF4LCBkc3RNaW4sIGRzdE1heCwgeCkge1xuICByZXR1cm4gKHggLSBzcmNNaW4pICogKGRzdE1heCAtIGRzdE1pbikgLyAoc3JjTWF4IC0gc3JjTWluKSArIGRzdE1pbjtcbn1cblxuZnVuY3Rpb24gZG91YmxlRGlnaXQoKSB7XG4gIHZhciBuID0gYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyAwIDogYXJndW1lbnRzWzBdO1xuXG4gIHZhciByZXQgPSBuLnRvU3RyaW5nKCk7XG4gIHJldHVybiBuIDwgMTAgPyBcIjBcIiArIHJldCA6IHJldDtcbn1cblxuZnVuY3Rpb24gbXNUb1N0cmluZyhzZWNvbmRzKSB7XG4gIHZhciBtID0gTWF0aC5mbG9vcihzZWNvbmRzIC8gNjApO1xuICB2YXIgcyA9IHNlY29uZHMgJSAobSAqIDYwKSB8fCAwO1xuICByZXR1cm4gZG91YmxlRGlnaXQobSkgKyBcIjpcIiArIGRvdWJsZURpZ2l0KHMpO1xufVxuXG5mdW5jdGlvbiBtaW5Ub01NU1MobWludXRlcykge1xuICByZXR1cm4gZG91YmxlRGlnaXQobWludXRlcykgKyBcIjowMFwiO1xufVxuXG5mdW5jdGlvbiBwdXRJblJhbmdlKHZhbCwgbWluLCBtYXgpIHtcbiAgaWYgKHZhbCA+IG1heCkge1xuICAgIHJldHVybiBtYXg7XG4gIH0gZWxzZSBpZiAodmFsIDwgbWluKSB7XG4gICAgcmV0dXJuIG1pbjtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdmFsO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1zMmhtcyh0aW1lKSB7XG4gIHZhciBtcyA9IHRpbWU7XG4gIC8vaG91cnMgZmxvYXRcbiAgdmFyIGhmID0gbXMgLyAzNjAwMDAwO1xuICAvL2hvdXJzIGludGVnZXJcbiAgdmFyIGggPSBNYXRoLmZsb29yKGhmKTtcbiAgbXMgLT0gaCAqIDM2MDAwMDA7XG4gIC8vbWludXRlcyBmbG9hdFxuICB2YXIgbWYgPSBtcyAvIDYwMDAwO1xuICAvL21pbnV0ZXMgaW50ZWdlclxuICB2YXIgbSA9IE1hdGguZmxvb3IobWYpO1xuICBtcyAtPSBtICogNjAwMDA7XG4gIHZhciBzZiA9IG1zIC8gMTAwMDtcbiAgdmFyIHMgPSBNYXRoLmZsb29yKHNmKTtcbiAgbXMgLT0gcyAqIDEwMDA7XG4gIHJldHVybiB7IGhmOiBoZiwgaDogaCwgbWY6IG1mLCBtOiBtLCBzZjogc2YsIHM6IHMsIG1zOiBtcywgdGltZTogdGltZSB9O1xufVxuXG5mdW5jdGlvbiBtczJobXNTdHJpbmcodGltZSkge1xuICByZXR1cm4gaG1zMlN0cmluZyhtczJobXModGltZSkpO1xufVxuXG5mdW5jdGlvbiBobXMyU3RyaW5nKGhtcykge1xuICByZXR1cm4gaG91ck1pblNlYzJTdHJpbmcoaG1zLmgsIGhtcy5tLCBobXMucyk7XG59XG5cbmZ1bmN0aW9uIGhvdXJNaW5TZWMyU3RyaW5nKGhvdXJzLCBtaW51dGVzLCBzZWNvbmRzKSB7XG4gIHZhciByZXQgPSBcIlwiO1xuICBpZiAoaG91cnMgPiAwKSB7XG4gICAgcmV0ICs9IGhvdXJzICsgXCI6XCI7XG4gIH1cbiAgcmV0ICs9IGRvdWJsZURpZ2l0KG1pbnV0ZXMpICsgXCI6XCIgKyBkb3VibGVEaWdpdChzZWNvbmRzKTtcbiAgcmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gczJobXMocykge1xuICByZXR1cm4gbXMyaG1zKHMgKiAxMDAwKTtcbn1cblxuZnVuY3Rpb24gbTJtcyhtaW51dGVzKSB7XG4gIHJldHVybiBtaW51dGVzICogNjAwMDA7XG59XG5cbmZ1bmN0aW9uIGtlYmFiVG9DYW1lbChrZWJhYkNhc2VkU3RyaW5nKSB7XG4gIHJldHVybiBrZWJhYkNhc2VkU3RyaW5nLnJlcGxhY2UoL1xcLVxcdy9nLCBmdW5jdGlvbiAobGV0dGVyKSB7XG4gICAgcmV0dXJuIGxldHRlci5zdWJzdHJpbmcoMSkudG9VcHBlckNhc2UoKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIG1zVG9TaG9ydE1pbigpIHtcbiAgdmFyIG1zID0gYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyAwIDogYXJndW1lbnRzWzBdO1xuXG4gIGlmIChtcyA9PT0gMCkge1xuICAgIHJldHVybiBcIlwiO1xuICB9IGVsc2Uge1xuICAgIHZhciBzZWMgPSBtcyAvIDEwMDA7XG4gICAgdmFyIG1pbiA9IE1hdGgucm91bmQoc2VjIC8gNjApO1xuICAgIGlmIChtaW4gPD0gMSkge1xuICAgICAgcmV0dXJuIE1hdGgucm91bmQoc2VjKSArIFwic1wiO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gTWF0aC5yb3VuZChtaW4pICsgXCJtXCI7XG4gICAgfVxuICB9XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jb252ZXJ0LmpzLm1hcFxuIiwiLyogZ2xvYmFsIGNvbnNvbGUsY2hyb21lICovXG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgTW90b3IgPSByZXF1aXJlKFwiLi9Nb3Rvci5qc1wiKVtcImRlZmF1bHRcIl07XG5cbmNvbnNvbGUuaW5mbyhcImJhY2tncm91bmQgbW9kdWxlXCIpO1xuXG52YXIgZXh0ZW5zaW9uSWQgPSBjaHJvbWUucnVudGltZS5pZDtcblxuLy9DbGVhciB0aGUgbG9jYWxTdG9yYWdlIHVwb24gdXBkYXRlXG4vL1RPRE86IGNsZWFyIHRoZSBzdG9yYWdlIG9ubHkgd2hlbiBtYWpvciB2ZXJzaW9uIGluY3JlYXNlcy5cbmNocm9tZS5ydW50aW1lLm9uSW5zdGFsbGVkLmFkZExpc3RlbmVyKGZ1bmN0aW9uIChkZXRhaWxzKSB7XG4gIC8vVE9ETyBCVUcgdGhpcyBoYXBwZW5zIGFmdGVyIHRoZSAnU3RhdGljJyBtb2R1bGUgaGFzIGluaXRpYWxpemVkIGFuZCBsb2FkZWQgdmFsdWVzIGludG8gbWVtb3J5XG4gIGlmIChkZXRhaWxzLnJlYXNvbiA9PT0gXCJ1cGRhdGVcIikge1xuICAgIGNvbnNvbGUuaW5mbyhcIkNsZWFyaW5nIGxvY2FsU3RvcmFnZSBiZWNhdXNlIG9mIHRoZSB1cGRhdGUgZXZlbnQuXCIpO1xuICAgIGxvY2FsU3RvcmFnZS5jbGVhcigpO1xuICB9XG59KTtcblxudmFyIG1hbmlmZXN0SnNvbiA9IGNocm9tZS5ydW50aW1lLmdldE1hbmlmZXN0KCk7XG5jb25zb2xlLmluZm8oXCJtYW5pZmVzdC52ZXJzaW9uOlwiLCBtYW5pZmVzdEpzb24udmVyc2lvbik7XG5cbmNocm9tZS5zeXN0ZW0uY3B1LmdldEluZm8oZnVuY3Rpb24gKGNwdUluZm8pIHtcbiAgY29uc29sZS5pbmZvKFwiYXJjaE5hbWU6XCIsIGNwdUluZm8uYXJjaE5hbWUpO1xuICBjb25zb2xlLmluZm8oXCJtb2RlbE5hbWU6XCIsIGNwdUluZm8ubW9kZWxOYW1lKTtcbn0pO1xuXG5jaHJvbWUucnVudGltZS5nZXRQbGF0Zm9ybUluZm8oZnVuY3Rpb24gKHBsYXRmb3JtSW5mbykge1xuICBjb25zb2xlLmluZm8oXCJhcmNoOlwiLCBwbGF0Zm9ybUluZm8uYXJjaCk7XG4gIGNvbnNvbGUuaW5mbyhcIm5hY2xfYXJjaDpcIiwgcGxhdGZvcm1JbmZvLm5hY2xfYXJjaCk7XG4gIGNvbnNvbGUuaW5mbyhcIm9zOlwiLCBwbGF0Zm9ybUluZm8ub3MpO1xuICBjb25zb2xlLmluZm8oXCJ1c2VyQWdlbnQ6XCIsIG5hdmlnYXRvci51c2VyQWdlbnQpO1xuICBjb25zb2xlLmluZm8oXCJsYW5ndWFnZTpcIiwgbmF2aWdhdG9yLmxhbmd1YWdlKTtcbn0pO1xuXG4vL1RPRE86IGlmIHRoZSBiYWNrZ3JvdW5kIHBhZ2UgaXMgc28gc2ltcGxlIGFuZCBhbGwgY29tcG9uZW50cyBpbnRlcmFjdCB3aXRoIGVhY2ggb3RoZXIgdmlhIG1lc3NhZ2luZywgY29uc2lkZXIgY29udmVydGluZyBpdCB0byBhbiBldmVudCBwYWdlLlxuLy9pbml0aWFsaXplIGFwcFxudmFyIG1vdG9yID0gbmV3IE1vdG9yKCk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1iYWNrZ3JvdW5kLmpzLm1hcFxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuc2hvdyA9IHNob3c7XG5leHBvcnRzLmhpZGUgPSBoaWRlO1xuLyogZ2xvYmFsIGNvbnNvbGUsTm90aWZpY2F0aW9uICovXG5cbmNvbnNvbGUuaW5mbyhcIm5vdGlmeSBtb2R1bGVcIik7XG5cbi8vdGhlIHRpdGxlIHdpbGwgYWxzbyBiZSB1c2VkIGFzIHRhZyB0byBtYWtlIHN1cmUgb25seSBvbmUgbm90aWZpY2F0aW9uIGlzIHNob3duIGZyb20gdGhpcyBhcHBsaWNhdGlvblxudmFyIHRpdGxlID0gXCIxLWNsaWNrIHRpbWVyXCI7XG5cbmZ1bmN0aW9uIHNob3cobWVzc2FnZSwgY2IpIHtcbiAgY29uc29sZS5pbmZvKFwiU2hvd2luZyBub3RpZmljYXRpb246IFxcXCJcIiArIG1lc3NhZ2UgKyBcIlxcXCJcIik7XG4gIHRoaXMuX2luc3RhbmNlID0gbmV3IE5vdGlmaWNhdGlvbih0aXRsZSwge1xuICAgIGJvZHk6IG1lc3NhZ2UsXG4gICAgdGFnOiB0aXRsZSxcbiAgICBpY29uOiBcImltZy9sb2dvLTEyOC5wbmdcIlxuICB9KTtcblxuICB0aGlzLl9pbnN0YW5jZS5vbnNob3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgY29uc29sZS5sb2coXCJOb3RpZmljYXRpb24ub25zaG93XCIpO1xuICB9O1xuICB0aGlzLl9pbnN0YW5jZS5vbmNsb3NlID0gZnVuY3Rpb24gKCkge1xuICAgIGNvbnNvbGUubG9nKFwiTm90aWZpY2F0aW9uLm9uY2xvc2VcIik7XG4gICAgY2IoXCJjbG9zZVwiKTtcbiAgfTtcbiAgdGhpcy5faW5zdGFuY2Uub25jbGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zb2xlLmxvZyhcIk5vdGlmaWNhdGlvbi5vbmNsaWNrXCIpO1xuICAgIGNiKFwiY2xpY2tcIik7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGhpZGUoKSB7XG4gIGlmICh0aGlzLl9pbnN0YW5jZSkge1xuICAgIHRoaXMuX2luc3RhbmNlLmNsb3NlKCk7XG4gICAgZGVsZXRlIHRoaXMuX2luc3RhbmNlO1xuICB9XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1ub3RpZnkuanMubWFwXG4iXX0=
