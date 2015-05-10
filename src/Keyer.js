
n (root) {

function Keyer () {
  this._actives = [];
  this._ups = {};
  this._downs = {};
}

Keyer.prototype = {
  bindUp: function (key, fn) {
    this._ups[key.charCodeAt(0) - 32] = fn;

    return this;
  },

  bindDown: function (key, fn) {
    this._downs[key.charCodeAt(0)] = fn;

    return this;
  },

  getActiveKeys: function () {
    return this._actives;
  },

  genKeyupListener: function () {
    return function (e) {
      var binding = this._ups[e.keyCode];

      if (binding != null) {
        this._actives.push(e.keyCode);
        binding.call(e, e);
      }
    }.bind(this);
  },

  genKeydownListener: function () {
    return function (e) {
      var binding = this._downs[e.keyCode];

      if (binding != null) {
        this._actives.splice(this._actives.indexOf(e.keyCode), 1);
        binding.call(e, e);
      }
    }.bind(this);
  }
};

root.Keyer = new Keyer();

})(window);
