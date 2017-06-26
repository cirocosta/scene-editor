/**
 * Responsible for controlling the user interface
 */

(function (root) {
  const ELEMS = {
    canvas: document.querySelector('canvas'),

    fileinput: document.querySelector('#fileinput'),
    fileSelect: document.querySelector('#b-select'),
    fileGallery: document.querySelector('#b-gallery'),
    helpBtn: document.querySelector("#b-help"),

    vshader: document.getElementById('vshader'),
    fshader: document.getElementById('fshader'),

    vshader_fragment: document.getElementById('vshader-fragment'),
    fshader_fragment: document.getElementById('fshader-fragment'),

    toggleProjection: document.querySelector('.command-toggleProjection'),
    toggleMeshgrid: document.querySelector('.command-toggleMeshgrid'),
    toggleShading: document.querySelector('.command-toggleShading'),

    modeIndicator: document.querySelector('.mode-indicator')
  };

  // gl dependent stuff. Must wait for GL context
  // to be successfully create. Listen to the
  // creation event

  root.addEventListener('glReady', function (e) {

    ELEMS.fileinput.addEventListener('change', (ev) => {
      var file = ev.target.files && ev.target.files[0];
      var reader = new FileReader();

      if (!file)
        console.error('Error while handling file.', file);

      root.current_file = file;

      reader.onload = (ev) => {
        var objActual = ObjParser.parse(ev.target.result);

        var o = new Object3D({
          indices:  objActual.indices,
          center_of_mass: objActual.center_of_mass,
          vertices_normals: objActual.vertices_normals,
          vertices_coords: objActual.vertices_coords,
          smooth_normals: objActual.smooth_normals,
          flat_normals: objActual.flat_normals,
          vertices: objActual.vertices,
          scale: objActual.scale,
          new: true,
          id: root.countObjects,
        });

        root.objActual = objActual;
        root.obj.push(o);
        root.countObjects++;
        o = root.ajustToLoad(o);
        root.resizeFun(true);
        root.draw();
      };

      reader.readAsText(file);
    });


    ELEMS.fileSelect.addEventListener('click', (ev) => {
      ELEMS.fileinput.click();
    });
  });

  // key and mouse bindings
  Keyer.bindDown('shift', function () {
    ELEMS.modeIndicator.className = "mode-indicator select";
    ELEMS.modeIndicator.innerHTML = "SELECT";
  }).bindUp('shift', function () {
    ELEMS.modeIndicator.className = "mode-indicator world";
    ELEMS.modeIndicator.innerHTML = "WORLD";
  }).bindMouseDown('left', function () {
    if (!Keyer.isKeyActive('shift'))
      return;

    console.log('RAY!');
  }).process(window);


  root.ELEMS = ELEMS;
})(window);
