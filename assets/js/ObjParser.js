'use strict';

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }

(function (window) {
  'use strict';

  /**
   * Helper functions and objs
   */

  var vec3 = {
    create: function create() {
      var out = new Float32Array(3);

      out[0] = 0;
      out[1] = 0;
      out[2] = 0;

      return out;
    },

    clone: function clone(a) {
      var out = new Float32Array(3);
      out[0] = a[0];
      out[1] = a[1];
      out[2] = a[2];

      return out;
    },

    normalize: function normalize(out, a) {
      var x = a[0],
          y = a[1],
          z = a[2];
      var len = x * x + y * y + z * z;

      if (len > 0) {
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
        out[2] = a[2] * len;
      }

      return out;
    }
  };

  var non_null = function non_null(val) {
    return val != null;
  };
  var to_float = function to_float(val) {
    return val == '' ? undefined : parseFloat(val);
  };
  var to_int = function to_int(val) {
    return val == '' ? undefined : parseInt(val);
  };
  var to_int_minus_1 = function to_int_minus_1(val) {
    return val == '' ? undefined : parseInt(val) - 1;
  };
  var slashed_to_array = function slashed_to_array(val) {
    return val.split('/').map(to_float);
  };

  var FACES_TYPES = {
    FACE: 'FACE',
    FACE_TEXTURE: 'FACE_TEXTURE',
    FACE_TEXTURE_NORMALS: 'FACE_TEXTURE_NORMALS',
    FACE_NORMALS: 'FACE_NORMALS'
  };

  /**
   * Parses .obj and returns a representation of
   * that.
   * @param  {string} text .obj source
   * @param {bool} convert_quads if the parser
   * should include quad_to_triangle conversion.
   * @return {Object}
   */
  function parse(text) {
    var result = {
      'new': true,
      scale: 0,
      center_of_mass: [0, 0, 0],

      vertices_normals: [], // indices to obtain 'normals' prop
      vertices_coords: [], // coordinates that are references to actual vertices

      smooth_normals: [],
      flat_normals: [],
      vertices: [],
      indices: [] };

    var bigger_vertex_dist = 0;
    var index_hashes = {};
    var hash_vertices = {};
    var same_vertices = {};
    var index = 0;
    var normal_index = 1;
    var facesType = null;

    text.split('\n').forEach(function (line) {
      var match = line.match(/^(v|#|vn|vt|f)\s+/);

      if (!match) return;

      switch (match[1]) {
        case 'v':
          var _line$split$slice$map = line.split(' ').slice(1).map(to_float),
              _line$split$slice$map2 = _slicedToArray(_line$split$slice$map, 3),
              x = _line$split$slice$map2[0],
              y = _line$split$slice$map2[1],
              z = _line$split$slice$map2[2];

          var dist = x * x + y * y + z * z;

          result.center_of_mass[0] += x;
          result.center_of_mass[1] += y;
          result.center_of_mass[2] += z;

          if (dist > bigger_vertex_dist) bigger_vertex_dist = dist;

          result.vertices_coords.push(x, y, z);
          break;

        case 'vn':
          result.vertices_normals.push.apply(result.vertices_normals, line.split(' ').slice(1).map(to_float));
          break;

        case 'f':
          var faces = line.split(' ').slice(1);

          // cache the type of face that we're
          // dealing with
          if (!facesType) {
            if (~faces[0].indexOf('//')) facesType = FACES_TYPES.FACE_NORMALS;else if (faces[0].match(/\d+\/\d+\/\d+/)) facesType = FACES_TYPES.FACE_TEXTURE_NORMALS;else facesType = FACES_TYPES.FACE;
          }

          // transform quad faces into triang
          // faces
          if (faces.length === 4) faces = [faces[0], faces[1], faces[2], faces[2], faces[3], faces[0]];else if (faces.length > 4) throw new Error('can\'t deal with ' + faces.length + 'd faces');

          // if no normals info, fix it. ps: note
          // that this will work even for quad
          // faces as the result of the normal
          // calculate won't vary.
          if (facesType === FACES_TYPES.FACE) {
            (function () {
              var facesI = faces.map(to_int_minus_1);

              var v0 = [result.vertices_coords[facesI[0] * 3 + 0], result.vertices_coords[facesI[0] * 3 + 1], result.vertices_coords[facesI[0] * 3 + 2]];
              var v1 = [result.vertices_coords[facesI[1] * 3 + 0], result.vertices_coords[facesI[1] * 3 + 1], result.vertices_coords[facesI[1] * 3 + 2]];
              var v2 = [result.vertices_coords[facesI[2] * 3 + 0], result.vertices_coords[facesI[2] * 3 + 1], result.vertices_coords[facesI[2] * 3 + 2]];

              // calculate the normal of the current face
              var face_normal = getNormal(v0, v1, v2);
              var found_index = -1;

              // see if we have previously added a
              // normal that is the same of this.
              for (var i = 0; i < result.vertices_normals.length; i += 3) {
                if (result.vertices_normals[i + 0] === face_normal[0] && result.vertices_normals[i + 1] === face_normal[1] && result.vertices_normals[i + 2] === face_normal[2]) {
                  found_index = i / 3 + 1;
                }
              }

              // didn't found another normal like
              // that
              if (! ~found_index) {
                result.vertices_normals.push.apply(result.vertices_normals, face_normal);
                found_index = normal_index++;
              }

              faces = faces.map(function (face) {
                return face + '//' + found_index;
              });
            })();
          }

          // face corresponds to a 'v/t/n' grouping
          faces.forEach(function (face) {
            // do not process redundant faces
            if (face in index_hashes) return result.indices.push(index_hashes[face]);

            // 0-index

            var _face$split = face.split('/');

            var _face$split2 = _slicedToArray(_face$split, 3);

            var verticeI = _face$split2[0];
            var textureI = _face$split2[1];
            var normalI = _face$split2[2];

            normalI = +normalI - 1;
            verticeI = +verticeI - 1;

            // store where same vertices lives in
            // indexes
            if (same_vertices[verticeI] == null) same_vertices[verticeI] = [];
            same_vertices[verticeI].push(result.vertices.length);

            result.vertices.push(result.vertices_coords[verticeI * 3], result.vertices_coords[verticeI * 3 + 1], result.vertices_coords[verticeI * 3 + 2]);
            result.flat_normals.push(result.vertices_normals[normalI * 3], result.vertices_normals[normalI * 3 + 1], result.vertices_normals[normalI * 3 + 2]);
            result.smooth_normals.push(result.vertices_normals[normalI * 3], result.vertices_normals[normalI * 3 + 1], result.vertices_normals[normalI * 3 + 2]);

            index_hashes[face] = index;
            result.indices.push(index++);
          });
          break;

        case '#':
        case 'vt':
          break;
      }
    });

    var _loop = function (i) {
      var indexes = same_vertices[i];
      var result_normal = indexes.reduce(function (mem, index) {
        mem[0] += result.smooth_normals[index];
        mem[1] += result.smooth_normals[index + 1];
        mem[2] += result.smooth_normals[index + 2];

        return mem;
      }, [0, 0, 0]);

      vec3.normalize(result_normal, vec3.clone(result_normal));

      indexes.forEach(function (index) {
        result.smooth_normals[index] = result_normal[0];
        result.smooth_normals[index + 1] = result_normal[1];
        result.smooth_normals[index + 2] = result_normal[2];
      });
    };

    for (var i in same_vertices) {
      _loop(i);
    }

    if (result.vertices_coords.length) {
      result.scale = Math.sqrt(3) / Math.sqrt(bigger_vertex_dist);
      result.center_of_mass = result.center_of_mass.map(function (elem) {
        return elem / result.vertices_coords.length;
      });
    }

    return result;
  }

  /**
   * cross(v1,v2) = surface_normal. being
   * 'a','b' and 'c' points that describe a
   * triangle, v1 = b-a, v2 = c-a.
   *
   * Cross:
   *   * ox = (y1 * z2) - (y2 * z1)
   *   * oy = (z1 * x2) - (z2 * x1)
   *   * oz = (x1 * y2) - (x2 * y1)
   *
   * Note that:
   *   - getNormal(a,b,c) = -getNormal(a,c,b).
   *
   * @param  {Array} a point
   * @param  {Array} b point
   * @param  {Array} c point
   * @return {Array}   normal vector
   */
  function getNormal(a, b, c) {
    var v1 = b.map(function (elem, i) {
      return elem - a[i];
    });
    var v2 = c.map(function (elem, i) {
      return elem - a[i];
    });
    var normal = vec3.create();

    normal[0] = v1[1] * v2[2] - v1[2] * v2[1];
    normal[1] = v1[2] * v2[0] - v1[0] * v2[2];
    normal[2] = v1[0] * v2[1] - v1[1] * v2[0];

    vec3.normalize(normal, normal);

    return normal;
  }

  window.ObjParser = {
    parse: parse,
    getNormal: getNormal
  };
})(window);
// final buffer data