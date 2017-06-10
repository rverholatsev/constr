function Editor(div, models){
    var self = this;

    this._models = models;
    this._curIdConf = null;
    
    /*      INIT    */

    if ( isIE() ) fixInputAndChangeEvents(); // fix input range
    
    var layoutCanvas = document.createElement('canvas');
    layoutCanvas.classList.add('editor-layout');
    div.appendChild(layoutCanvas);

    var shiftSlider = document.createElement('input');
    shiftSlider.classList.add('slider');
    shiftSlider.classList.add('slider_editor-shift');
    shiftSlider.type = 'range';
    shiftSlider.step = '0.01';
    shiftSlider.min = '-1';
    shiftSlider.max = '1';
    shiftSlider.value = '0.5';
    div.appendChild(shiftSlider);

    var radiusSlider = document.createElement('input');
    radiusSlider.classList.add('slider');
    radiusSlider.classList.add('slider_editor-radius');
    radiusSlider.type = 'range';
    radiusSlider.step = '0.005';
    radiusSlider.min = '0.7';
    radiusSlider.max = '1';
    radiusSlider.value = '0.75';
    div.appendChild(radiusSlider);

    this._layout = new Layout(layoutCanvas);
    this._radiusSlider = radiusSlider;
    this._shiftSlider = shiftSlider;

    this._config = new Configuration();

    /*      ADD EVENT LISTENERS     */

    this._layout.onselect = function(idConf){
        self._curIdConf = idConf;

        var conf = self._config.getByIdConf(idConf);
        var model = self._getModelByIdModel(conf.idModel);

        if(model.viewerType == 'staticUnit')
            self._shiftSlider.style.visibility = 'hidden';
        else {
            self._shiftSlider.style.visibility = 'visible';
            self._shiftSlider.value = conf.customShift;
        }
    };

    this._layout.onmove = function(idConf, customX, customY){
        self._config.getByIdConf(idConf).customX = customX;
        self._config.getByIdConf(idConf).customY = customY;
        self._viewer.setPositionById(idConf, customX, -customY);

        if(self.onmove) self.onmove(idConf, customX, customY);
    };

    this._layout.onremove = function(idConf){
        self._curIdConf = null;

        self._config.removeByIdConf(idConf);
        self._viewer.removeById(idConf);

        self._shiftSlider.style.visibility = 'hidden';

        if(self.onmove) self.onremove(idConf);
    };

    this._shiftSlider.addEventListener('input',function(){
        self._config.getByIdConf(self._curIdConf).customShift = this.value;

        if(self.onshiftchange) self.onshiftchange(self._curIdConf, this.value)
    });

    this._radiusSlider.addEventListener('input',function(){
        self._config.R = this.value;
        self._layout.setRadius(this.value);

        if(self.onradiuschange) self.onradiuschange(this.value);
    });
    
    this.onmove = null;
    this.onremove = null;
    this.onshiftchange = null;
    this.onradiuschange = null;
}

Editor.prototype._getModelByIdModel = function(idModel){
    for(var i=0; i<this._MODELS.length; i++)
        if(this._MODELS[i].idModel == idModel)
            return this._MODELS[i];
    return null;
};

Editor.prototype._getModelsByType = function(type){
    var models = [];
    for(var i=0; i<this._MODELS.length; i++)
        if(this._MODELS[i].type == type)
            models.push(this._MODELS[i]);

    return models;
};

Editor.prototype._getModelsByGroup = function(group){
    var models = [];
    for(var i=0; i<this._MODELS.length; i++)
        if(this._MODELS[i].group == group)
            models.push(this._MODELS[i]);

    return models;
};

Editor.prototype._addByIdModel = function(idModel, args){
    var self = this;

    var model = this._getModelByIdModel(idModel);

    args = args || {};

    args.idModel = idModel;
    args.customShift = args.customShift != undefined ? args.customShift : 0;
    args.customX = args.customX || 0;
    args.customY = args.customY || 0;
    args.numberUnits = args.numberUnits || model.numberUnits || 0;

    var idConf = null;

    if(model.viewerType == 'staticUnit'){
        this._removeByViewerType(model.viewerType);

        idConf = this._config.add(args);
        this._layout.addStaticUnit(idConf, model.img);
        this._viewer.addStaticUnit(idConf, model.src);
    }
    else if(model.viewerType == 'unit'){
        idConf = this._config.add(args);
        this._layout.addUnit(idConf, model.img,args.customX, args.customY);
        this._viewer.addUnit(idConf, model.src, args.customShift, args.customX, -args.customY);
    }
    else if(model.viewerType == 'base'){
        this._removeByViewerType(model.viewerType);

        idConf = this._config.add(args);
        this._layout.addBase(idConf, model.img);
        this._viewer.addBase(idConf, model.src, args.numberUnits, args.customShift, this._radiusSlider.value);
    }
    else if(model.viewerType == 'frame'){
        this._removeByViewerType(model.viewerType);

        idConf = this._config.add(args);
        this._layout.addFrame(idConf, model.img);
        this._viewer.addFrame(idConf, model.src, args.numberUnits, args.customShift, this._radiusSlider.value);
    }

    return idConf;
};

Editor.prototype._removeByIdConf = function(idConf){
    console.log('remove');
    this._config.removeByIdConf(idConf);
    this._layout.removeById(idConf);
    this._viewer.removeById(idConf);
};

Editor.prototype._removeByViewerType = function(viewerType){
    var items = this._config.items;
    for(var i=0; i<items.length; i++) {
        var model = this._getModelByIdModel(items[i].idModel);

        if (model.viewerType == viewerType) {
            var id = items[i].idConf;
            this._removeByIdConf(id);
        }
    }
};