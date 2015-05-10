Camera = function () {

	Object3D.call( this );

	this.type = 'Camera';

	this.matrixWorldInverse = new Matrix4();
	this.projectionMatrix = new Matrix4();

};

Camera.prototype = Object.create( Object3D.prototype );
Camera.prototype.constructor = Camera;
Camera.prototype.getWorldDirection = function () {

	var quaternion = new Quaternion();

	return function ( optionalTarget ) {

		var result = optionalTarget || new Vector3();

		this.getWorldQuaternion( quaternion );

		return result.set( 0, 0, - 1 ).applyQuaternion( quaternion );

	}

}();

Camera.prototype.lookAt = function () {

	// This routine does not support cameras with rotated and/or translated parent(s)

	var m1 = new Matrix4();

	return function ( vector ) {

		m1.lookAt( this.position, vector, this.up );

		this.quaternion.setFromRotationMatrix( m1 );

	};

}();

Camera.prototype.updateProjection = function () {
  var ar = w/h;

  if (_perspective)
    mat4.perspective(P, deg_to_rad(30.0), ar, 0.1, 50.0);
  else
    mat4.ortho(P, -2.5 * ar, 2.5 * ar, -2.5, 2.5, 0.1, 50.0);
};

Camera.prototype.clone = function ( camera ) {

	if ( camera === undefined ) camera = new Camera();

	Object3D.prototype.clone.call( this, camera );

	camera.matrixWorldInverse.copy( this.matrixWorldInverse );
	camera.projectionMatrix.copy( this.projectionMatrix );

	return camera;
};
