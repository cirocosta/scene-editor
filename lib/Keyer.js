"use strict";

(function (root) {

function Keyer () {
  // regarding keyboard keys
  this._actives = {};
  this._ups = {};
  this._downs = {};


  // regarding mouse buttons
  this._actives_b = {};
  this._ups_b = {};
  this._downs_b = {};
}

Keyer.prototype = {
  _map: {
    'shift': '16',
    'left': 0,
    'middle': 1,
    'right': 2,
  },

  bindUp: function (key, fn) {
    if (!(this._map[key]))
      this._ups[key.charCodeAt(0) - 32] = fn;
    else
      this._ups[this._map[key]] = fn;

    return this;
  },

  bindDown: function (key, fn) {
    if (!(this._map[key]))
      this._downs[key.charCodeAt(0) - 32] = fn;
    else
      this._downs[this._map[key]] = fn;

    return this;
  },

  // ps: be careful
  bindMouseUp: function (button, fn) {
    this._ups_b[this._map[button]] = fn;

    return this;
  },

  bindMouseDown: function (button, fn) {
    this._downs_b[this._map[button]] = fn;

    return this;
  },

  isKeyActive: function (key) {
    if (!(this._map[key]))
      return this._actives[key.charCodeAt(0) - 32];
    else
      return this._actives[this._map[key]];
  },

  isButtonActive: function (button) {
    return !!this._actives_b[this._map[button]];
  },

  _genMouseupListener: function () {
    return function (e) {
      var binding = this._ups_b[e.button];
      this._actives_b[e.button] = false;

      if (binding != null)
        binding.call(e, e);
    }.bind(this);
  },

  _genMousedownListener: function () {
    return function (e) {
      var binding = this._downs_b[e.button];
      this._actives_b[e.button] = true;

      if (binding != null)
        binding.call(e, e);
    }.bind(this);
  },

  _genKeyupListener: function () {
    return function (e) {
      var binding = this._ups[e.keyCode];

      this._actives[e.keyCode] = false;
      if (binding != null)
        binding.call(e, e);
    }.bind(this);
  },

  _genKeydownListener: function () {
    return function (e) {
      var binding = this._downs[e.keyCode];

      this._actives[e.keyCode] = true;
      if (binding != null)
        binding.call(e, e);
    }.bind(this);
  },

  /**
   * performs actual bind to an element
   */
  process: function (elem) {
    if (Object.keys(this._ups).length)
      elem.addEventListener('keyup', this._genKeyupListener());
    if (Object.keys(this._downs).length)
      elem.addEventListener('keydown', this._genKeydownListener());

    if (Object.keys(this._downs_b).length)
      elem.addEventListener('mousedown', this._genMousedownListener());
    if (Object.keys(this._ups_b).length)
      elem.addEventListener('mouseup', this._genMouseupListener());
  },

};

root.Keyer = new Keyer();
})(window);

