'use strict';

/**
 * Main scene control and instantiation
 */

var countObjects=0;
var _rotating = {
  ROTATE_X: false,
  ROTATE_Y: false,
  ROTATE_Z: false
};
var _rotations = {
  ROTATE_X: 45.0,
  ROTATE_Y: 45.0,
  ROTATE_Z: 0.0
};

// commands config
var _meshGrid = false;
var _looping = false;
var _smoothShading = false;
var _pressed = null;
var _perspective = true;

var ELEMS = window.ELEMS;
const deg_to_rad = (deg) => deg*Math.PI/180.0;

function triggerRotation (which, flag) {
  _rotating[which] = flag;
}

function incRotation (which) {
  _rotations[which] += 2;
}

ELEMS.toggleMeshgrid.addEventListener('click', (ev) => {
  _meshGrid = !_meshGrid;
});

ELEMS.toggleShading.addEventListener('click', (ev) => {
  _smoothShading = !_smoothShading;
  obj && (obj.new = true);
});

ELEMS.toggleProjection.addEventListener('click', (ev) => {
  _perspective = !_perspective;
});

var current_file, obj;
var VERTICES, INDICES, NORMALS;
var all_vertices, all_indices, all_normals;
const gl = WebGLUtils.setupWebGL(ELEMS.canvas);

var M = mat4.create();    // model
var N = mat4.create();    // normal
var V = mat4.create();    // view
var P = mat4.create();    // perspective
var VM = mat4.create();   // model-view
var PVM = mat4.create();  // model-view-perspective

var objActual = {
  'new': true,
  scale: 0,
  center_of_mass: new Float32Array([0.0, 0.0, 0.0]),
  vertices_normals: [], // indices to obtain 'normals' prop
  vertices_coords: [], // coordinates that are references to actual
          // vertices
  smooth_normals: [],
  flat_normals: [],
  vertices: [],
  indices: []
};
var obj = [];

const resizeFun = WebGLUtils.genResizeFun(ELEMS.canvas, gl, (w, h, shouldDraw) => {
  updateProjection(w, h);
  shouldDraw && draw();
});

WebGLUtils.Shaders.initFromElems(gl, ELEMS.vshader_fragment, ELEMS.fshader_fragment);
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.enable(gl.DEPTH_TEST);

var glEventReady = new CustomEvent('glReady', {});

const LOCATIONS = WebGLUtils.Shaders.getLocations(gl, [
  'a_Position', 'a_Normal',
  'u_NormalMatrix', 'u_MvpMatrix', 'u_ModelMatrix',
  // 'u_LightColor', 'u_AmbientLight', 'u_LightPosition'
]);

const NBUFFER = WebGLUtils.initBuffer(gl, null, 3, gl.FLOAT,
                                      LOCATIONS.a_Normal);
const VBUFFER = WebGLUtils.initBuffer(gl, null, 3, gl.FLOAT,
                                      LOCATIONS.a_Position);
const IBUFFER = WebGLUtils.initBuffer(gl, null, null, gl.FLOAT, null,
                                      gl.ELEMENT_ARRAY_BUFFER);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

/**
 * Draws the corresponding OBJ loaded.
 *
 * @param {Object}
 *            obj object obtained from ObjParser::parse
 */
function draw_obj (obj) {
  if (!obj)
    return 0;

    VERTICES = new Float32Array(obj.vertices);
    INDICES = new Uint16Array(obj.indices);
    if (_smoothShading)
      NORMALS = new Float32Array(obj.smooth_normals);
    else
      NORMALS = new Float32Array(obj.flat_normals);

  gl.bindBuffer(gl.ARRAY_BUFFER, VBUFFER);
  gl.bufferData(gl.ARRAY_BUFFER, VERTICES, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, NBUFFER);
  gl.bufferData(gl.ARRAY_BUFFER, NORMALS, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, IBUFFER);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, INDICES, gl.STATIC_DRAW);

  return INDICES.length;
}

function updateProjection (w, h) {
  var ar = w/h;

  if (_perspective)
    mat4.perspective(P, deg_to_rad(30.0), ar, 0.1, 50.0);
  else
    mat4.ortho(P, -2.5 * ar, 2.5 * ar, -2.5, 2.5, 0.1, 50.0);
}

/**
 * Draws the entire scene.
 */
function draw () {
  mat4.identity(M);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  updateProjection(ELEMS.canvas.width, ELEMS.canvas.height);
  mat4.lookAt(V, [0.0, 0.0, 10.0],  // eye
                 [0.0, 0.0, 0.0],   // at
                 [0.0, 1.0, 0.0]);  // up

  obj.forEach(function (o) {
	  var N_INDICES = draw_obj(o);
	  mat4.multiply(VM, V, o.matrix);
	  mat4.multiply(PVM, P, VM);
	  mat4.invert(N, o.matrix);
	  mat4.transpose(N, N);

	  gl.uniformMatrix4fv(LOCATIONS.u_ModelMatrix, false, o.matrix);
	  gl.uniformMatrix4fv(LOCATIONS.u_NormalMatrix, false, N);
	  gl.uniformMatrix4fv(LOCATIONS.u_MvpMatrix, false, PVM);

	  // executes the shader and draws the geometric
	  // shape in the specified 'mode' using the
	  // indices specified in the buffer obj bound
	  // to gl.ELEMENT_ARRAY_BUFFER.
	  if (!_meshGrid)
		gl.drawElements(gl.TRIANGLES, N_INDICES, gl.UNSIGNED_SHORT, 0);
	  else
		gl.drawElements(gl.LINES, N_INDICES, gl.UNSIGNED_SHORT, 0);
  });

}

window.addEventListener('resize', resizeFun);

function loop () {
  window.requestAnimationFrame(loop);

  for (var rot in _rotating)
    if (_rotating[rot])
      incRotation(rot);
  draw();
}

function ajustToLoad (object){
  mat4.scale(object.matrix, object.matrix,
            [object.scale, object.scale, object.scale]);
  mat4.translate(object.matrix, object.matrix,
                 object.center_of_mass.map((el) => -el));

  return object;
}

window.dispatchEvent(glEventReady);
