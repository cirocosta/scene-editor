'use strict';

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

const deg_to_rad = (deg) => deg*Math.PI/180.0;
const ELEMS = {
  canvas: document.querySelector('canvas'),

  fileinput: document.querySelector('.fileupload input'),
  filebtn: document.querySelector('.fileupload button'),
  filename: document.querySelector('.fileupload p'),
  // gallery: document.querySelector('.fileupload-gallery'),

  vshader: document.getElementById('vshader'),
  fshader: document.getElementById('fshader'),

  vshader_fragment: document.getElementById('vshader-fragment'),
  fshader_fragment: document.getElementById('fshader-fragment'),

  // rotate: document.querySelector('.command-rotate'),
  // translate: document.querySelector('.command-translate'),
  // scale: document.querySelector('.command-scale'),

  rotateX: document.querySelector('.command-rotateX'),
  rotateY: document.querySelector('.command-rotateY'),
  rotateZ: document.querySelector('.command-rotateZ'),
  toggleProjection: document.querySelector('.command-toggleProjection'),
  toggleRotation: document.querySelector('.command-toggleRotation'),
  toggleMeshgrid: document.querySelector('.command-toggleMeshgrid'),
  toggleShading: document.querySelector('.command-toggleShading'),
};

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

ELEMS.toggleRotation.addEventListener('click', (ev) => {
  triggerRotation('ROTATE_X', _rotating['ROTATE_X'] = !_rotating['ROTATE_X']);
  triggerRotation('ROTATE_Y', _rotating['ROTATE_Y'] = !_rotating['ROTATE_Y']);
  triggerRotation('ROTATE_Z', _rotating['ROTATE_Z'] = !_rotating['ROTATE_Z']);
});

ELEMS.rotateX.addEventListener('mousedown', triggerRotation.bind(null, 'ROTATE_X', true));
ELEMS.rotateY.addEventListener('mousedown', triggerRotation.bind(null, 'ROTATE_Y', true));
ELEMS.rotateZ.addEventListener('mousedown', triggerRotation.bind(null, 'ROTATE_Z', true));

ELEMS.rotateX.addEventListener('mouseup', triggerRotation.bind(null, 'ROTATE_X', false));
ELEMS.rotateY.addEventListener('mouseup', triggerRotation.bind(null, 'ROTATE_Y', false));
ELEMS.rotateZ.addEventListener('mouseup', triggerRotation.bind(null, 'ROTATE_Z', false));

var current_file, obj;
var VERTICES, INDICES, NORMALS;
const gl = WebGLUtils.setupWebGL(ELEMS.canvas);

var M = mat4.create();    // model
var N = mat4.create();    // normal
var V = mat4.create();    // view
var P = mat4.create();    // perspective
var VM = mat4.create();   // model-view
var PVM = mat4.create();  // model-view-perspective

const resize = WebGLUtils.genResizeFun(ELEMS.canvas, gl, (w, h, shouldDraw) => {
  updateProjection(w, h);
  shouldDraw && draw();
});

WebGLUtils.Shaders.initFromElems(gl, ELEMS.vshader_fragment, ELEMS.fshader_fragment);
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.enable(gl.DEPTH_TEST);

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
 * @param {Object} obj object obtained from
 * ObjParser::parse
 */
function draw_obj (obj) {
  if (!obj)
    return 0;

  if (obj.new) { // caching
    VERTICES = new Float32Array(obj.vertices);
    INDICES = new Uint16Array(obj.indices);
    if (_smoothShading)
      NORMALS = new Float32Array(obj.smooth_normals);
    else
      NORMALS = new Float32Array(obj.flat_normals);

    obj.new = false;
  }

  mat4.scale(M, M, [obj.scale, obj.scale, obj.scale]);
  mat4.rotateX(M, M, deg_to_rad(_rotations['ROTATE_X']));
  mat4.rotateY(M, M, deg_to_rad(_rotations['ROTATE_Y']));
  mat4.rotateZ(M, M, deg_to_rad(_rotations['ROTATE_Z']));
  mat4.translate(M, M, obj.center_of_mass.map((el) => -el));

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

  var N_INDICES = draw_obj(obj);

  mat4.multiply(VM, V, M);
  mat4.multiply(PVM, P, VM);
  mat4.invert(N, M);
  mat4.transpose(N, N);

  gl.uniformMatrix4fv(LOCATIONS.u_ModelMatrix, false, M);
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
}

ELEMS.fileinput.addEventListener('change', (ev) => {
  var file = ev.target.files && ev.target.files[0];
  var reader = new FileReader();

  if (!file)
    console.error('Error while handling file.', file);

  ELEMS.filename.hidden = false;
  ELEMS.filename.innerHTML = file.name;
  current_file = file;

  reader.onload = (ev) => {
    obj = ObjParser.parse(ev.target.result);
    resize(false);
    !_looping && loop();
  };

  reader.readAsText(file);
});

window.addEventListener('resize', resize);

ELEMS.filebtn.addEventListener('click', (ev) => {
  ELEMS.fileinput.click();
});

function loop () {
  window.requestAnimationFrame(loop);

  for (var rot in _rotating)
    if (_rotating[rot])
      incRotation(rot);
  draw();
}
