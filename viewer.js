var VIEWER_CAMERA_MIN_RADIUS = 10;
var VIEWER_CAMERA_MAX_RADIUS = 25;
var VIEWER_CAMERA_HEIGHT = 3;
var VIEWER_CAMERA_LOOK_AT_HEIGHT = 5;

var VIEWER_LAYOUT_HEIGHT = 10;
var VIEWER_LAYOUT_R = 3.5;

var VIEWER_JOINT_HEIGHT = 2;
var VIEWER_JOINT_R = 0.15;

var VIEWER_TWIST_ANGLE = Math.PI / 6;
var VIEWER_SHIFT = 1.5;

function sphereToDecart(phi, theta, r){
    /*
         phi [-PI; PI]
         theta [0; PI]
         r [0; +inf)
     */
    return {
        x: r * ( Math.sin(theta) * Math.cos(phi) ),
        y: r * Math.cos(theta),
        z: r * ( Math.sin(theta) * Math.sin(phi) )
    };
}

function decartToSphere(x,y,z){
    /*
         phi [-PI; PI]
         theta [0; PI]
         r [0; +inf)
     */
    return {
        phi : z > 0
            ? Math.PI/2 - Math.atan(x / z)
            : z == 0
                ? 0
                : Math.PI/2 - Math.atan(x / z) - Math.PI,
        theta : Math.atan( Math.sqrt(Math.pow(x, 2) + Math.pow(z, 2)) / y ),
        r : Math.sqrt( Math.pow(x,2) + Math.pow(y,2) + Math.pow(z,2) )
    };
}

function Viewer(canvas){
    /* VARIABLES */

    // Position of camera in sphere coordinates
    this._cameraR = null;
    this._cameraPhi = null;
    this._cameraTheta = null;

    // For rotate
    this._mousePosition = {x: -1, y: -1};
    this._isMouseDown = false;

    // general components
    this._units = [];
    this._staticUnit = null;
    this._frame = null;
    this._base = null;

    /* INIT THREE JS OBJECTS */
    this._initThreeJSObjects(canvas);

    /* EVENT LISTENERS */
    var self = this;

    // ZOOM
    if (canvas.addEventListener) {
        if ('onwheel' in document) {
            // IE9+, FF17+, Ch31+
            canvas.addEventListener("wheel", function(e){ self._onWheel(e); });
        } else if ('onmousewheel' in document) {
            // устаревший вариант события
            canvas.addEventListener("mousewheel", function(e){ self._onWheel(e); });
        } else {
            // Firefox < 17
            canvas.addEventListener("MozMousePixelScroll", function(e){ self._onWheel(e); });
        }
    }
    else { // IE8-
        canvas.attachEvent("onmousewheel", function(e){ self._onWheel(e); });
    }

    // ROTATE
    canvas.addEventListener('mousedown', function(e){self._onMouseDown(e); });
    canvas.addEventListener('mousemove', function(e){self._onMouseMove(e); });
    canvas.addEventListener('mouseup', function(e){self._onMouseUp(e); });
    canvas.addEventListener('mouseleave', function(e){self._onMouseLeave(e); });

    this.onrotate = null;

    /*      ANIMATION       */
    render();
    function render() {
        self._renderer.render(self._scene, self._camera);
        requestAnimationFrame(render);
    }
}

Viewer.prototype._initThreeJSObjects = function(canvas){
    this._scene = new THREE.Scene();

    this._camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);

    this._cameraR = 20;
    this._cameraPhi = Math.PI/2;
    this._cameraTheta = Math.PI/3;

    var dec = sphereToDecart(this._cameraPhi, this._cameraTheta, this._cameraR);
    this._camera.position.x = dec.x;
    this._camera.position.y = dec.y + VIEWER_CAMERA_HEIGHT;
    this._camera.position.z = dec.z;
    this._camera.lookAt(new THREE.Vector3(0,VIEWER_CAMERA_LOOK_AT_HEIGHT,0));

    this._renderer = new THREE.WebGLRenderer( {
        canvas: canvas,
        antialias: true
    } );
    this._renderer.setClearColor(new THREE.Color(0xFFFFFF));
    this._renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF,1);
    directionalLight.castShadow = false;
    this._scene.add(directionalLight);

    /*      ADDING SPOTLIGHTS   */

    var minHeight = -1, maxHeight = 14, radius = 15;

    var numberOfLevels = 4, numberOfSpotLights = 3;

    var TPhi = 2*Math.PI / numberOfSpotLights; // const
    for(var i=0; i<numberOfLevels; i++){
        var shiftPhi = i * (Math.PI/2 / numberOfLevels);
        var curHeight = i * (maxHeight - minHeight) / numberOfLevels;

        var spotLightTarget = new THREE.Object3D();
        spotLightTarget.position.set(0, curHeight, 0);
        this._scene.add(spotLightTarget);

        for(var j=0; j<numberOfSpotLights; j++){
            var dec = sphereToDecart(shiftPhi + j*TPhi, Math.PI/2, radius);

            var spotLight = new THREE.SpotLight(0xFFFFFF, 0.5);
            spotLight.target = spotLightTarget;
            spotLight.angle = Math.PI/2;
            spotLight.position.set(dec.x, curHeight, dec.z);

            this._scene.add(spotLight);
        }
    }

    /*  ADDING CURSOR   */
    this._cursor = new THREE.Object3D();
    this._scene.add(this._cursor);

    var material = new THREE.MeshBasicMaterial( { color: 0x800080, side: THREE.DoubleSide } );

    var ringGeometry = new THREE.RingGeometry(
        VIEWER_LAYOUT_R - 0.05,
        VIEWER_LAYOUT_R + 0.05,
        50,
        0.1
    );
    var ring = new THREE.Mesh(ringGeometry, material);
    ring.translateY(-VIEWER_SHIFT);
    ring.rotateX(-Math.PI/2);

    var triangleGeometry = new THREE.CircleGeometry(0.2, 3);
    var triangle = new THREE.Mesh(triangleGeometry, material);
    triangle.translateY(-VIEWER_SHIFT);
    triangle.translateZ(VIEWER_LAYOUT_R - 0.1);
    triangle.rotateY(-Math.PI/6);
    triangle.rotateX(-Math.PI/2);

    this._cursor.add(ring);
    this._cursor.add(triangle);
};

Viewer.prototype._onWheel = function(e){

    e = e || window.event;

    e.preventDefault ? e.preventDefault() : (e.returnValue = false);

    // wheelDelta не дает возможность узнать количество пикселей
    var delta = e.deltaY || e.detail || e.wheelDelta;

    var change = delta / Math.abs(delta) * 0.75;
    if(isIE()) change = -change;

    if(this._cameraR + change > VIEWER_CAMERA_MAX_RADIUS
        || this._cameraR + change < VIEWER_CAMERA_MIN_RADIUS)
        return;

    this._cameraR += change;

    var dec = sphereToDecart(this._cameraPhi, this._cameraTheta, this._cameraR);
    this._camera.position.x = dec.x;
    this._camera.position.y = dec.y + VIEWER_CAMERA_HEIGHT;
    this._camera.position.z = dec.z;
    this._camera.lookAt(new THREE.Vector3(0,VIEWER_CAMERA_LOOK_AT_HEIGHT,0));
};

Viewer.prototype._onMouseDown = function(e){
    fixWhich(e);
    if(e.which != 1) return;

    this._isMouseDown = true;
    this._mousePosition.x = e.clientX;
    this._mousePosition.y = e.clientY;
};

Viewer.prototype._onMouseMove = function(e){
    if(!this._isMouseDown) return;

    var dx = e.clientX - this._mousePosition.x;
    var dy = e.clientY - this._mousePosition.y;

    this._mousePosition.x = e.clientX;
    this._mousePosition.y = e.clientY;

    this._cameraPhi += 0.01 * dx;
    if( (dy < 0 && this._cameraTheta < 2 * Math.PI / 3)
        || (dy > 0 && this._cameraTheta > Math.PI / 6) )
        this._cameraTheta -= 0.01 * dy;

    var decart = sphereToDecart(this._cameraPhi, this._cameraTheta, this._cameraR);
    this._camera.position.x = decart.x;
    this._camera.position.y = decart.y + VIEWER_CAMERA_HEIGHT;
    this._camera.position.z = decart.z;
    this._camera.lookAt(new THREE.Vector3(0,VIEWER_CAMERA_LOOK_AT_HEIGHT,0));

    if(this.onrotate) this.onrotate(0.01 * dx);
};

Viewer.prototype._onMouseUp = function(e){
    fixWhich(e);
    if(e.which != 1) return;

    if(this._isMouseDown)
        this._isMouseDown = false;

};

Viewer.prototype._onMouseLeave = function(){
    if(this._isMouseDown)
        this._isMouseDown = false;
};

Viewer.prototype._loadModel = function(src, handler){
    var loader = new THREE.ColladaLoader();
    loader.load( src, function (result) {

        var object3D = null;

        var sceneObjs = result.scene.children;
        for (var i = 0; i < sceneObjs.length; i++)
            if (sceneObjs[i].children)
                object3D = sceneObjs[i].children[0].clone();

        if (!object3D) {
            console.log('Can\'t find Object with Mesh in Scene');
            return;
        }

        var vertices = object3D.geometry.vertices;

        var rotateMatrix = new THREE.Matrix4();
        rotateMatrix.makeRotationX(-0.5 * Math.PI);

        var translateMatrix = new THREE.Matrix4();
        translateMatrix.makeTranslation(0, VIEWER_LAYOUT_HEIGHT / 2 - VIEWER_JOINT_HEIGHT, 0);

        for (var i = 0; i < vertices.length; i++) {
            vertices[i].applyMatrix4(rotateMatrix);
            vertices[i].applyMatrix4(translateMatrix);
        }
        object3D.geometry.computeFaceNormals();
        object3D.geometry.computeVertexNormals();

        object3D.castShadow = false;
        object3D.recieveShadow = false;

        handler(object3D);
    });
};

Viewer.prototype.addUnit = function(id, src, customShift, customX, customZ){

    // var self = this;
    this._loadModel(src,
        function(object3D){
            this._scene.add(object3D);
            this._units.push( new Unit(id, object3D, customShift, customX, customZ) );
        }.bind(this)
    );
};

Viewer.prototype.addStaticUnit = function(id, src){

    var self = this;
    this._loadModel(src,
        function(object3D){
            this._staticUnit = new StaticUnit(id, object3D);
            this._scene.add(this._staticUnit.object3D);
        }.bind(this)
    );
};

Viewer.prototype.addFrame = function(id, src, numberUnits, customShift, customR){
    this._loadModel(src,
        function(object3D){
            this._frame = new Frame(id, object3D, numberUnits, customShift, customR);
            this._scene.add(this._frame.object3D);
        }.bind(this)
    );
};

Viewer.prototype.addBase = function(id, src, numberUnits, customShift, customR){
    this._loadModel(src,
        function(object3D){
            this._base = new Base(id, object3D, numberUnits, customShift, customR);
            this._scene.add(this._base.object3D);
        }.bind(this)
    );
};

Viewer.prototype.removeById = function(id){
    if(this._staticUnit && this._staticUnit.id == id) {
        this._scene.remove(this._staticUnit.object3D);
        delete this._staticUnit;
        this._staticUnit = null;
    }
    else if(this._frame && this._frame.id == id) {
        this._scene.remove(this._frame.object3D);
        delete this._frame;
        this._frame = null;
    }
    else if(this._base && this._base.id == id){
        this._scene.remove(this._base.object3D);
        delete this._base;
        this._base = null;
    }
    else {
        for(var i=0; i<this._units.length; i++)
            if(this._units[i].id == id){
                this._scene.remove(this._units[i].object3D);
                this._units.splice(i, 1);
                break;
            }
    }
};

Viewer.prototype.setPositionById = function(id, customX, customZ){
    for(var i=0; i<this._units.length; i++)
        if(this._units[i].id == id){
            this._units[i].setPosition(customX, customZ);
            break;
        }
};

Viewer.prototype.setShiftById = function(id, customShift){
    if(this._frame && this._frame.id == id){
        this._frame.setShift(customShift);
    }
    else if(this._base && this._base.id == id){
        this._base.setShift(customShift);
    }
    else{
        for(var i=0; i<this._units.length; i++)
            if(this._units[i].id == id){
                this._units[i].setShift(customShift);
                break;
            }
    }
};

Viewer.prototype.setRadius = function(customR){
    if(this._frame)
        this._frame.setRadius(customR);
    if(this._base)
        this._base.setRadius(customR);

    this._setCursorR(customR);
};

Viewer.prototype._setCursorR = function(customR){
    this._cursor.scale.x = customR;
    this._cursor.scale.z = customR;
};

Viewer.prototype.setNumberUnitsById = function(id, numberUnits){
    if(this._frame && this._frame.id == id)
        this._frame.setNumberUnits(numberUnits);

    if(this._base && this._base.id == id)
        this._base.setNumberUnits(numberUnits);
};

Viewer.prototype.setDefaultView = function(){
    if(this.onrotate) this.onrotate(Math.PI/2 - this._cameraPhi);

    this._cameraR = 20;
    this._cameraPhi = Math.PI/2;
    this._cameraTheta = Math.PI/3;

    var dec = sphereToDecart(this._cameraPhi, this._cameraTheta, this._cameraR);
    this._camera.position.x = dec.x;
    this._camera.position.y = dec.y + VIEWER_CAMERA_HEIGHT;
    this._camera.position.z = dec.z;
    this._camera.lookAt(new THREE.Vector3(0,VIEWER_CAMERA_LOOK_AT_HEIGHT,0));
};

function Unit(id, object3D, customShift, customX, customZ){
    this.id = id;
    this.object3D = object3D;
    this.object3D.matrixAutoUpdate = false;

    this._shift = customShift * VIEWER_SHIFT || 0;
    this._x = customX * VIEWER_LAYOUT_R || 0;
    this._z = customZ * VIEWER_LAYOUT_R|| 0;

    this._rotateFaceToFront = true;

    this._performPositing();
}

Unit.prototype._performPositing = function(){

    // р1 - точка обозначающее положение на макете
    var decP1, sphereP1;

    // р2 - точка на месте соединения
    var decP2, sphereP2;

    decP1 = new THREE.Vector3(
        this._x,
        VIEWER_LAYOUT_HEIGHT - VIEWER_JOINT_HEIGHT,
        this._z
    );
    sphereP1 = decartToSphere(decP1.x, decP1.y, decP1.z);

    // если точка лежит в пределах окружности радиуса JOINT_R
    if(Math.sqrt(Math.pow(decP1.x,2) + Math.pow(decP1.z,2)) < VIEWER_JOINT_R) {
        decP2 = { x: 0, y: 0, z: 0 };
        sphereP2 = decartToSphere(decP2.x, decP2.y, decP2.z);
    }
    else{
        sphereP2 = {
            phi: sphereP1.phi + VIEWER_TWIST_ANGLE, // ЗАДАЕМ СКРУТКУ!
            theta: Math.PI / 2,
            r: VIEWER_JOINT_R
        };

        if (sphereP2.phi > Math.PI)
            sphereP2.phi = sphereP2.phi - 2 * Math.PI;

        if (sphereP2.phi < -Math.PI)
            sphereP2.phi = 2 * Math.PI + sphereP2.phi;

        decP2 = sphereToDecart(sphereP2.phi, sphereP2.theta, sphereP2.r);
    }

    // вектор из p1 в p2
    var decV = new THREE.Vector3(
            decP1.x - decP2.x,
            decP1.y - decP2.y,
            decP1.z - decP2.z
        ),
        sphereV = decartToSphere(decV.x, decV.y, decV.z);

    /*      DEBUG        */
    // console.log('id', this.id);
    //
    // console.log('p1',
    //     'dec',
    //         decP1.x.toFixed(2),
    //         decP1.y.toFixed(2),
    //         decP1.z.toFixed(2),
    //     'sphere',
    //         sphereP1.phi / Math.PI * 180);
    //
    // console.log('p2',
    //     'dec',
    //         decP2.x.toFixed(2),
    //         decP2.y.toFixed(2),
    //         decP2.z.toFixed(2),
    //     'sphere',
    //         sphereP2.phi / Math.PI * 180);
    //
    // console.log('v',
    //     'dec',
    //         decV.x.toFixed(2),
    //         decV.x.toFixed(2),
    //         decV.x.toFixed(2),
    //     'sphere',
    //         (sphereV.phi/ Math.PI * 180).toFixed(2),
    //         (sphereV.theta/ Math.PI * 180).toFixed(2),
    //         sphereV.r.toFixed(2)
    // );


    var mRotateOY = new THREE.Matrix4();
    if(this._rotateFaceToFront)
        mRotateOY.makeRotationY(sphereV.phi);
    else
        mRotateOY.makeRotationY(Math.PI/2);

    var mTranslateOY = new THREE.Matrix4();
    mTranslateOY.makeTranslation(0, this._shift, 0);

    var mRotateThetaOZ = new THREE.Matrix4();
    mRotateThetaOZ.makeRotationZ(-sphereV.theta);

    var mRotatePhiOY = new THREE.Matrix4();
    mRotatePhiOY.makeRotationY(-sphereV.phi);

    var mTranslateOX = new THREE.Matrix4();
    mTranslateOX.makeTranslation(decP2.x, 0, 0);

    var mTranslateOZ = new THREE.Matrix4();
    mTranslateOZ.makeTranslation(0, 0, decP2.z);

    this.object3D.matrix.multiplyMatrices(mTranslateOY, mRotateOY);
    this.object3D.matrix.multiplyMatrices(mRotateThetaOZ, this.object3D.matrix);
    this.object3D.matrix.multiplyMatrices(mRotatePhiOY, this.object3D.matrix);
    this.object3D.matrix.multiplyMatrices(mTranslateOX, this.object3D.matrix);
    this.object3D.matrix.multiplyMatrices(mTranslateOZ, this.object3D.matrix);

    /*      DEBUG        */
    // var scene = this.object3D.parent;
    // for(var i=0; i<scene.children.length; i++)
    //     if(scene.children[i] instanceof THREE.PointCloud){
    //         scene.children.splice(i,1);
    //         i--;
    //     }
    //
    // var dotGeometry = new THREE.Geometry();
    // dotGeometry.vertices.push( decP1 );
    // var dotMaterial = new THREE.PointCloudMaterial( { color: 0xFF0000, size: 10, sizeAttenuation: false } );
    // var dot = new THREE.PointCloud( dotGeometry, dotMaterial );
    // scene.add( dot );
    //
    // var dotGeometry2 = new THREE.Geometry();
    // dotGeometry2.vertices.push( decP2 );
    // var dotMaterial2 = new THREE.PointCloudMaterial( { color: 0xFF0000, size: 10, sizeAttenuation: false } );
    // var dot2 = new THREE.PointCloud( dotGeometry2, dotMaterial2 );
    // scene.add( dot2 );
};

Unit.prototype.setShift = function(customShift){
    this._shift = customShift * VIEWER_SHIFT;
    this._performPositing();
};

Unit.prototype.setPosition = function(customX,customZ){
    this._x = customX * VIEWER_LAYOUT_R;
    this._z = customZ * VIEWER_LAYOUT_R;
    this._performPositing();
};

Unit.prototype.rotateFaceToFront = function(bool){
    if(!arguments.length|| bool == this._rotateFaceToFront)
        return;

    this._rotateFaceToFront = bool;
    this._performPositing();
};

function StaticUnit(id, object3D){
    this.id = id;
    object3D.translateY(-(VIEWER_LAYOUT_HEIGHT/2 - VIEWER_JOINT_HEIGHT) );
    this.object3D = object3D;
}

function Frame(id, object3D, numberUnits, customShift, customR){
    this.id = id;

    this.object3D = new THREE.Object3D();

    this._unitObject3D = object3D.clone();

    numberUnits = numberUnits >= 3 && numberUnits <= 20 ? numberUnits : 3;

    customShift = customShift || 0;
    this._customShift = customShift;

    customR = customR || 1;
    this._customR = customR || 1;

    this._units = [];

    this.setNumberUnits(numberUnits);

    // var unitsPosition = this._computeUnitsPosition(numberUnits);
    //
    // for(var i=0; i<numberUnits; i++){
    //     var unit = new Unit(i, object3D.clone(), customShift, unitsPosition[i].x, unitsPosition[i].z);
    //     unit.rotateFaceToFront(false);
    //     this._units.push(unit);
    //
    //     this.object3D.add(unit.object3D);
    // }
}

Frame.prototype._computeUnitsPosition = function(numberUnits){
    numberUnits = numberUnits || this._units.length;

    var TPhi = 2*Math.PI / numberUnits;

    var position = [];
    for(var i=0; i<numberUnits; i++) {
        var customDec = sphereToDecart(-Math.PI + i*TPhi, Math.PI / 2, this._customR);

        position.push({
            x: customDec.x, z: customDec.z
        });
    }
    return position;
};

Frame.prototype.setRadius = function(customR){
    this._customR = customR || 1;

    var unitsPosition = this._computeUnitsPosition();

    for(var i=0; i<this._units.length; i++)
        this._units[i].setPosition(unitsPosition[i].x, unitsPosition[i].z);
};

Frame.prototype.setShift = function(customShift){
    this._customShift = customShift || 0;

    for(var i=0; i<this._units.length; i++)
        this._units[i].setShift(customShift);
};

Frame.prototype.setNumberUnits = function(numberUnits) {

    if(numberUnits < 3 || numberUnits > 20)
        return;

    // удаляем итемы если нужно
    if (numberUnits < this._units.length)
        for(var i = this._units.length-1; i > numberUnits-1; i--){
            this.object3D.children.splice(i,1);
            this._units.splice(i,1);
        }

    var unitsPosition = this._computeUnitsPosition(numberUnits);

    // для тех итемов что остались устанавливаем новую позицию
    for (var i = 0; i < this._units.length; i++)
        this._units[i].setPosition(unitsPosition[i].x, unitsPosition[i].z);

    // если нужно добавляем итемы и расчитыаем новые координаты
    if (numberUnits > this._units.length)
        for (var i = this._units.length; i < numberUnits; i++) {
            // создаем юнит
            var unit = new Unit(i, this._unitObject3D.clone(), this._customShift, unitsPosition[i].x, unitsPosition[i].z);
            unit.rotateFaceToFront(false);
            this._units.push(unit);

            // добаляем его в группу
            this.object3D.add(unit.object3D);
        }
};

function Base(id, object3D, numberUnits, customShift, customR){
    this.id = id;

    this.object3D = new THREE.Object3D();

    this._unitObject3D = object3D.clone();

    numberUnits = numberUnits >= 3 && numberUnits <= 20 ? numberUnits : 3;

    customShift = customShift || 0;
    this._customShift = customShift;

    customR = customR || 1;
    this._customR = customR || 1;

    this._units = [];

    this.setNumberUnits(numberUnits);
}

Base.prototype._computeUnitsPosition = function(numberUnits) {

    numberUnits = numberUnits || this._units.length;

    // считаем количество окружностей
    // задаем мин и макс количество юнитов для каждой окружности
    var amount = 0, countCircle,
        min = [], max = [];

    for(var i=0; ; i++){
        min[i] = 3;
        max[i] = 5 + i*2;
        amount += max[i];

        if(amount >= numberUnits) {
            countCircle = i + 1;
            break;
        }
    }

    // переменная для хранения текущей комбинации
    var comb = [];
    // массив полученных комбинаций и их весов
    var combinations = [], weights = [];
    // рекурсивная функция вычисления всех возможных комбинаций
    function calc(i){
        if(comb[i] <= max[i]){
            if(i == countCircle-1){
                check();
                comb[i]++;
                calc(i);
            }
            else{
                comb[i]++;
                comb[i+1] = min[i+1];
                calc(countCircle-1);
            }
        }
        else{
            if(i != 0){
                calc(i-1);
            }
            else
                return;
        }
    }
    // проверяем текущую комбинацию, если подходит добаляем
    function check(){
        var sum = 0, comb_copy = [];
        for(var i=0; i<countCircle; i++) {
            sum += comb[i];
            comb_copy.push(comb[i]);
        }

        if(sum == numberUnits) {
            var isValid = true;
            for (var i = 0; i < countCircle-1; i++)
                if (comb[i] > comb[i+1]) {
                    isValid = false;
                    break;
                }

            if (isValid) {
                combinations.push(comb_copy);

                var weight = [];
                for(var i=0; i<countCircle; i++)
                    weight.push( Math.abs(comb[i] - (min[i] + (max[i]-min[i])/2) ) );

                weights.push(weight);
            }
        }
    }

    // записываем минимальную комбинацию
    for(var i=0; i<countCircle; i++)
        comb[i] = min[i];

    // вычисляем комбинации
    calc(countCircle-1);

    // удаляем все записи, где sumWeight > minSumWeight
    var minSumWeight = 999999;
    for(var i=0; i<weights.length; i++){
        var sumWeight = 0;
        for(var j=0; j<weights[i].length; j++)
            sumWeight += weights[i][j];
        if(sumWeight < minSumWeight)
            minSumWeight = sumWeight;
    }

    for(var i=0; i<weights.length; i++) {
        var sumWeight = 0;
        for(var j=0; j<weights[i].length; j++)
            sumWeight += weights[i][j];

        if(sumWeight > minSumWeight){
            combinations.splice(i, 1);
            weights.splice(i,1);
            i--;
        }
    }

    // сортируем по возрастанию весов
    for(var i=0; i<combinations.length - 1; i++) {
        for (var j = i + 1; j < combinations.length; j++) {
            var swap = false;
            for (var k = 0; k < weights[i].length; k++) {
                if(weights[i][k] == weights[j][k])
                    continue;
                else {
                    if (weights[i][k] > weights[j][k])
                        swap = true;
                    break;
                }
            }

            if (swap === true) {
                var w = weights[i];
                weights[i] = weights[j];
                weights[j] = w;

                var c = combinations[i];
                combinations[i] = combinations[j];
                combinations[j] = c;
            }
        }
    }

    // выбираем первый элемент
    comb = combinations[0];
    console.log(comb);

    // расчитываем периоды изменений фи и радиуса для каждой окружности
    var TPhi = [],
        TRadius = this._customR / (countCircle + 1);

    for(var i=0; i<comb.length; i++)
        TPhi[i] = 2*Math.PI / comb[i];

    // вычисляем координаты
    var position = [];

    for(var i=0; i<comb.length; i++){
        var r = countCircle == 1 ? TRadius : TRadius/2 + TRadius*i,
            theta = Math.PI/2;

        for(var j=0; j<comb[i]; j++){
            var phi = -Math.PI + j * TPhi[i];

            var dec = sphereToDecart(phi, theta, r);
            position.push({
                x: dec.x,
                z: dec.z
            });
        }
    }
    return position;
}

Base.prototype.setRadius = function(customR){
    this._customR = customR || 1;

    var unitPosition = this._computeUnitsPosition();

    for(var i=0; i<this._units.length; i++)
        this._units[i].setPosition(unitPosition[i].x, unitPosition[i].z);
};

Base.prototype.setShift = function(customShift){
    this._customShift = customShift || 0;

    for(var i=0; i<this._units.length; i++)
        this._units[i].setShift(customShift);
};

Base.prototype.setNumberUnits = function(numberUnits){
    if(numberUnits < 3 || numberUnits > 20)
        return;

    // удаляем итемы если нужно
    if (numberUnits < this._units.length)
        for(var i = this._units.length-1; i > numberUnits-1; i--){
            this.object3D.children.splice(i,1);
            this._units.splice(i,1);
        }

    // считаем новую позицию
    var unitsPosition = this._computeUnitsPosition(numberUnits);

    // для тех итемов что остались устанавливаем новую позицию
    for (var i = 0; i < this._units.length; i++)
        this._units[i].setPosition(unitsPosition[i].x, unitsPosition[i].z);

    // если нужно добавляем итемы
    if (numberUnits > this._units.length)
        for (var i = this._units.length; i < numberUnits; i++) {
            // создаем юнит
            var unit = new Unit(i, this._unitObject3D.clone(), this._customShift, unitsPosition[i].x, unitsPosition[i].z);
            unit.rotateFaceToFront(false);
            this._units.push(unit);

            // добаляем его в группу
            this.object3D.add(unit.object3D);
        }
};