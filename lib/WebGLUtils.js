/**
 * Setup utilities for WebGL
 * @type {Object}
 */
let WebGLUtils = {
  _create3DContext (canvas, opt_attribs) {
    let names = ["webgl", "experimental-webgl", "webkit-3d",
                 "moz-webgl"];
    let ctx;

    // try all the different names associated
    // with the retrieval of the 3d context from
    // the various browser implementors.
    for (let i of names) {
      try {ctx = canvas.getContext(i, opt_attribs);}
      catch (e) {}

      if (ctx)
        break;
    }

    if (!ctx)
      throw new Error('GL instance coudl\'t be set.');

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
  genResizeFun: (canvas, gl, fun) => (shouldDraw) => {
    let {clientWidth, clientHeight} = canvas;

    if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
      canvas.width = clientWidth;
      canvas.height = clientHeight;

      gl.viewport(0, 0, canvas.width, canvas.height);
      fun && fun.call(null, clientWidth, clientHeight, shouldDraw);
    }
  },

  _loadTexture (gl, texture, u_Sampler, image) {
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

  initTextures (gl, u_Sampler, url) {
    let image = new Image();
    let texture = gl.createTexture();

    if (!texture)
      throw new Error('Couldnt create the texture.');
    if (!image)
      throw new Error('Couldnt create image');

    image.onload =
      this._loadTexture.bind(null, gl, texture, u_Sampler, image);
    image.src = url;
  },

  initBuffer (gl, data, num, type, attrib_location, buffer_type) {
    if (arguments.length < 5)
      throw new Error('initBuffer requires all args');

    const buff = gl.createBuffer();
    if (!buff)
      throw new Error('Error while creating buffer');

    buffer_type = buffer_type || gl.ARRAY_BUFFER;

    gl.bindBuffer(buffer_type, buff);
    if (data != null)
      gl.bufferData(buffer_type, data, gl.STATIC_DRAW);
    if (attrib_location != null && num != null)
      gl.vertexAttribPointer(attrib_location, num, type, false, 0, 0);
      gl.enableVertexAttribArray(attrib_location);

    return buff;
  },

  /**
   * Prepares the WebGL context.
   * @param  {HTMLElement} canvas
   * @param  {(Object|undefined)} opt_attribs
   * @return {WebGLContext}
   */
  setupWebGL (canvas, opt_attribs) {
    // WebGLRenderingContext exposes the
    // principal interface in WebGL which
    // provides special properties and methods
    // to manipulate 3D content.
    if (!window.WebGLRenderingContext)
      throw new Error('No WebGLRenderingContext in window.');

    let ctx = this._create3DContext(canvas, opt_attribs);
    if (!ctx)
      throw new Error('Couldn\'t retrieve webgl context.');

    return ctx;
  },
};

let Shaders = {
  _createShader (gl, source, type) {
    let shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw new Error('Shader failed to compile: ' +
                       gl.getShaderInfoLog(shader));

    return shader;
  },

  _createVertShader (gl, source) {
    return this._createShader(gl, source, gl.VERTEX_SHADER);
  },

  _createFragShader (gl, source) {
    return this._createShader(gl, source, gl.FRAGMENT_SHADER);
  },

  _createProgram (gl, vshader, fshader) {
    let program = gl.createProgram();

    if (!program)
      throw new Error('_createProgram: coult not create program.');

    gl.attachShader(program, vshader);
    gl.attachShader(program, fshader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error('Shader program failed to link: ' +
                      gl.getProgramInfoLog(program));

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
  getLocations (gl, names) {
    return names.reduce((mem, name) => {
      let location;

      if (name.startsWith('a_'))
        location = gl.getAttribLocation(gl.program, name);
      else if (name.startsWith('u_'))
        location = gl.getUniformLocation(gl.program, name);
      else // enforcing name consistency
        throw new Error('Attrib/Unif/Var must start with u_, a_ or v_');

      if (!~location)
        throw new Error('Failed to retrieve location of ' + name);

      mem[name] = location;

      return mem;
    }, {});
  },

  initFromSrc (gl, vsrc, fsrc, use=true) {
    let v = this._createVertShader(gl, vsrc, gl.VERTEX_SHADER);
    let f = this._createFragShader(gl, fsrc, gl.FRAGMENT_SHADER);
    let program = this._createProgram(gl, v, f);

    if (use) {
      gl.useProgram(program);
      gl.program = program;
    }

    if (!program)
      throw new Error('Failed to initialize shaders.');

    return program;
  },

  initFromElems (gl, vElem, fElem, use=true) {
    return this.initFromSrc(gl, vElem.text, fElem.text, use);
  },

  // TODO
  initFromUrl () {
    return;
  }
};

WebGLUtils.Shaders = Shaders;

