/**
 * Setup utilities for WebGL
 * @type {Object}
 */
"use strict";

var WebGLUtils = {
  _create3DContext: function _create3DContext(canvas, opt_attribs) {
    var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
    var ctx = undefined;

    // try all the different names associated
    // with the retrieval of the 3d context from
    // the various browser implementors.
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = names[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var i = _step.value;

        try {
          ctx = canvas.getContext(i, opt_attribs);
        } catch (e) {}

        if (ctx) break;
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator["return"]) {
          _iterator["return"]();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    if (!ctx) throw new Error("GL instance coudl't be set.");

    return ctx;
  },

  /**
   * Generates a resize function that keeps
   * canvas in sync with window resizing.
   *
   * Note: perspective matrix must be handled
   *       elsewhere.
   *
   * @param  {HTMLElement} canvas
   * @param  {gl} gl
   * @param {Function} fun callback (width,
   * height)
   * @return {Function} resize function
   */
  genResizeFun: function genResizeFun(canvas, gl, fun) {
    return function (shouldDraw) {
      var clientWidth = canvas.clientWidth;
      var clientHeight = canvas.clientHeight;

      if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
        canvas.width = clientWidth;
        canvas.height = clientHeight;

        gl.viewport(0, 0, canvas.width, canvas.height);
        fun && fun.call(null, clientWidth, clientHeight, shouldDraw);
      }
    };
  },

  _loadTexture: function _loadTexture(gl, texture, u_Sampler, image) {
    // Flip the image's y axis so that it
    // matches webgl's coordinate system.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    // Enable texture unit0
    gl.activeTexture(gl.TEXTURE0);
    // Bind the texture object to the target
    // (we're specifying the nature of the
    // texture itself, not the nature of what is
    // going to be attached to)
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the texture parameters: tells to
    // opengl how the image will be processed
    // when the texture image is mapped to
    // shapes.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    // Set the texture unit 0 to the sampler
    gl.uniform1i(u_Sampler, 0);
    // gl.clear(gl.COLOR_BUFFER_BIT);
    // gl.drawArrays(gl.TRIANGLE_STRIP, 0, n_vertices);
  },

  initTextures: function initTextures(gl, u_Sampler, url) {
    var image = new Image();
    var texture = gl.createTexture();

    if (!texture) throw new Error("Couldnt create the texture.");
    if (!image) throw new Error("Couldnt create image");

    image.onload = this._loadTexture.bind(null, gl, texture, u_Sampler, image);
    image.src = url;
  },

  initBuffer: function initBuffer(gl, data, num, type, attrib_location, buffer_type) {
    if (arguments.length < 5) throw new Error("initBuffer requires all args");

    var buff = gl.createBuffer();
    if (!buff) throw new Error("Error while creating buffer");

    buffer_type = buffer_type || gl.ARRAY_BUFFER;

    gl.bindBuffer(buffer_type, buff);
    if (data != null) gl.bufferData(buffer_type, data, gl.STATIC_DRAW);
    if (attrib_location != null && num != null) gl.vertexAttribPointer(attrib_location, num, type, false, 0, 0);
    gl.enableVertexAttribArray(attrib_location);

    return buff;
  },

  /**
   * Prepares the WebGL context.
   * @param  {HTMLElement} canvas
   * @param  {(Object|undefined)} opt_attribs
   * @return {WebGLContext}
   */
  setupWebGL: function setupWebGL(canvas, opt_attribs) {
    // WebGLRenderingContext exposes the
    // principal interface in WebGL which
    // provides special properties and methods
    // to manipulate 3D content.
    if (!window.WebGLRenderingContext) throw new Error("No WebGLRenderingContext in window.");

    var ctx = this._create3DContext(canvas, opt_attribs);
    if (!ctx) throw new Error("Couldn't retrieve webgl context.");

    return ctx;
  } };

var Shaders = {
  _createShader: function _createShader(gl, source, type) {
    var shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error("Shader failed to compile: " + gl.getShaderInfoLog(shader));

    return shader;
  },

  _createVertShader: function _createVertShader(gl, source) {
    return this._createShader(gl, source, gl.VERTEX_SHADER);
  },

  _createFragShader: function _createFragShader(gl, source) {
    return this._createShader(gl, source, gl.FRAGMENT_SHADER);
  },

  _createProgram: function _createProgram(gl, vshader, fshader) {
    var program = gl.createProgram();

    if (!program) throw new Error("_createProgram: coult not create program.");

    gl.attachShader(program, vshader);
    gl.attachShader(program, fshader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Shader program failed to link: " + gl.getProgramInfoLog(program));

    return program;
  },

  /**
   * Get attribute/uniform location from
   * shaders considering the consistent
   * notation of a_, u_, v_
   * @param  {WebGLContext} gl
   * @param  {Array} names
   * @return {Array}
   */
  getLocations: function getLocations(gl, names) {
    return names.reduce(function (mem, name) {
      var location = undefined;

      if (name.startsWith("a_")) location = gl.getAttribLocation(gl.program, name);else if (name.startsWith("u_")) location = gl.getUniformLocation(gl.program, name);else // enforcing name consistency
        throw new Error("Attrib/Unif/Var must start with u_, a_ or v_");

      if (! ~location) throw new Error("Failed to retrieve location of " + name);

      mem[name] = location;

      return mem;
    }, {});
  },

  initFromSrc: function initFromSrc(gl, vsrc, fsrc) {
    var use = arguments[3] === undefined ? true : arguments[3];

    var v = this._createVertShader(gl, vsrc, gl.VERTEX_SHADER);
    var f = this._createFragShader(gl, fsrc, gl.FRAGMENT_SHADER);
    var program = this._createProgram(gl, v, f);

    if (use) {
      gl.useProgram(program);
      gl.program = program;
    }

    if (!program) throw new Error("Failed to initialize shaders.");

    return program;
  },

  initFromElems: function initFromElems(gl, vElem, fElem) {
    var use = arguments[3] === undefined ? true : arguments[3];

    return this.initFromSrc(gl, vElem.text, fElem.text, use);
  },

  // TODO
  initFromUrl: function initFromUrl() {
    return;
  }
};

WebGLUtils.Shaders = Shaders;