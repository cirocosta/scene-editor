Object3D = function () {
	this.name = '';
	this.id = 0;
	this.up = [0, 0, 0];
	this.position = vec3.create();
	this.rotation = vec3.create();
	this.eulerOrder = 'XYZ';
	this.dynamic = false; // when true it retains arrays so they can be updated with __dirty*
	this.doubleSided = false;
	this.flipSided = false;
	this.renderDepth = null;
	this.rotationAutoUpdate = true;
	this.matrix = mat4.create(); 
	this.matrixAutoUpdate = true;
	this.quaternion = new Quaternion();
	this.useQuaternion = true;
	this.boundRadius = 0.0;
	this.boundRadiusScale = 1.0;
	this.visible = true;
	this.castShadow = false;
	this.receiveShadow = false;
	this.frustumCulled = true;
	this._vector = vec3.create();
	this.new=true;
    this.scale= 0;
    this.center_of_mass= [0, 0, 0];
    this.vertices_normals= []; // indices to obtain 'normals' prop
    this.vertices_coords=[]; // coordinates that are references to actual vertices
    this.smooth_normals= [];
    this.flat_normals= [];
    this.vertices= [];
    this.indices= [];
};

Object3D.prototype = {

	constructor: Object3D,

	translate: function ( distance, axis ) {

		this.matrix.rotateAxis( axis );
		this.position.addSelf( axis.multiplyScalar( distance ) );

	},

	translateX: function ( distance ) {

		this.translate( distance, this._vector.set( 1, 0, 0 ) );

	},

	translateY: function ( distance ) {

		this.translate( distance, this._vector.set( 0, 1, 0 ) );

	},

	translateZ: function ( distance ) {

		this.translate( distance, this._vector.set( 0, 0, 1 ) );

	},

	lookAt: function ( vector ) {

		// TODO: Add hierarchy support.

		this.matrix.lookAt( vector, this.position, this.up );

		if ( this.rotationAutoUpdate ) {

			this.rotation.setRotationFromMatrix( this.matrix );

		}

	},

	updateMatrix: function () {

		this.matrix.setPosition( this.position );

		if ( this.useQuaternion )  {

			this.matrix.setRotationFromQuaternion( this.quaternion );

		} else {

			this.matrix.setRotationFromEuler( this.rotation, this.eulerOrder );

		}

		if ( this.scale.x !== 1 || this.scale.y !== 1 || this.scale.z !== 1 ) {

			this.matrix.scale( this.scale );
			this.boundRadiusScale = Math.max( this.scale.x, Math.max( this.scale.y, this.scale.z ) );

		}
	},


};
Object3DCount = 0;
