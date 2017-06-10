var CONSTRUCTOR_LOADING_IMG = 'images/service/loading.gif';

var CONSTRUCTOR_STYLESHEETS = 'constructor.css';

var CONSTRUCTOR_LAYOUT_SCRIPT_SRC = 'layout.js';
var CONSTRUCTOR_VIEWER_SCRIPT_SRC = 'viewer.js';
var CONSTRUCTOR_CONFIGURATION_SCRIPT_SRC = 'configuration.js';
var CONSTRUCTOR_COLLADA_LOADER_SCRIPT_SRC = 'libs/ColladaLoader.js';
var CONSTRUCTOR_THREEJS_SCRIPT_SRC = 'libs/three.js';

var CONSTRUCTOR_MODELS_SRC = 'data/models.json';

var CONSTRUCTOR_DEFAULT_CONFIG = 'configs/default.json';
// var CONSTRUCTOR_DEFAULT_CONFIG = 'configs/lilia_rose.json';

var CATALOG_FLOWERS_NAME = 'Цветы';
var CATALOG_FLOWERS_IMG = 'images/flower.jpg';
var CATALOG_GREEN_NAME = 'Зелень';
var CATALOG_GREEN_IMG = 'images/green.jpg';
var CATALOG_DECORE_NAME = 'Декор';
var CATALOG_DECORE_IMG = 'images/decore.jpg';

var CONSTRUCTOR_BACK_ITEM_NAME = 'Назад';
var CONSTRUCTOR_BACK_ITEM_IMG = 'images/service/back.jpg';

function ajaxGetRequest(url, handler){
    var ajaxRequest = new XMLHttpRequest();
    ajaxRequest.open('GET', url, true);
    ajaxRequest.send();
    ajaxRequest.onreadystatechange = function () {
        if (ajaxRequest.readyState != 4) return;

        if (ajaxRequest.status != 200) {
            alert('URL: '+url+'\n'+ajaxRequest.status + ': ' + ajaxRequest.statusText);
            return;
        }

        handler(ajaxRequest.responseText);
    };
}

function fixWhich(e) {
    if (!e.which && e.button) { // если which нет, но есть button... (IE8-)
        if (e.button & 1) e.which = 1; // левая кнопка
        else if (e.button & 4) e.which = 2; // средняя кнопка
        else if (e.button & 2) e.which = 3; // правая кнопка
    }
}

function isIE(){
    var userAgent = navigator.userAgent;
    return userAgent.indexOf('MSIE') !== -1 ||
        userAgent.indexOf('Trident') !== -1;
}

function fixInputAndChangeEvents(){
    var currentSlider;
    var fireChange = function(e) {
        var changeEvent = document.createEvent('Event');
        changeEvent.initEvent('change', true, true);

        changeEvent.forceChange = true;
        currentSlider.dispatchEvent(changeEvent);
    };

    document.addEventListener('change', function(e) {
        var inputEvent;
        if (!e.forceChange && e.target.getAttribute('type') === 'range') {
            e.stopPropagation();
            inputEvent = document.createEvent('Event');
            inputEvent.initEvent('input', true, true);

            e.target.dispatchEvent(inputEvent);

            currentSlider = e.target;
            document.removeEventListener('mouseup', fireChange);
            document.addEventListener('mouseup', fireChange);
        }

    }, true); // make sure we're in the capture phase
}

function Constructor(div){
    var self = this;

    /*      APPEND LOADING IMG & SHADOW    */
    var loadingImg = document.createElement('img');
    loadingImg.style.cssText =
        'position: absolute;'+
        'z-index: 100;'+
        'top: 50%; left: 50%;'+
        'width: 200px;'+
        'height: 200px;'+
        'margin-left: -100px;'+
        'margin-top: -100px;';
    loadingImg.src = CONSTRUCTOR_LOADING_IMG;
    div.appendChild(loadingImg);

    var shadow = document.createElement('div');
    shadow.style.cssText =
        'position: absolute;'+
        'z-index: 99;'+
        'top: 0; left: 0;'+
        'width: 100%;'+
        'height: 100%;'+
        'background: white;'+
        'box-shadow: 0 0 15px -5px lightgrey;';
    div.appendChild(shadow);

    this._MODELS = null;

    /*      LOADING FILES     */
    var stylesheets = document.createElement('link');
    stylesheets.rel = 'stylesheet';
    stylesheets.type = 'text/css';
    stylesheets.href = CONSTRUCTOR_STYLESHEETS;
    stylesheets.onload = function(){ tryToEndLoading(); };
    stylesheets.onerror = function(){ alert(this.href + ' Download failed!'); };
    document.head.appendChild(stylesheets);

    var layoutJS = document.createElement('script');
    layoutJS.src = CONSTRUCTOR_LAYOUT_SCRIPT_SRC;
    layoutJS.onload = function(){ tryToEndLoading(); };
    layoutJS.onerror = function(){ alert(this.src + ' Download failed!'); };
    document.head.appendChild(layoutJS);

    var viewerJS = document.createElement('script');
    viewerJS.src = CONSTRUCTOR_VIEWER_SCRIPT_SRC;
    viewerJS.onload = function(){ tryToEndLoading(); };
    viewerJS.onerror = function(){ alert(this.src + ' Download failed!'); };
    document.head.appendChild(viewerJS);

    var configurationJS = document.createElement('script');
    configurationJS.src = CONSTRUCTOR_CONFIGURATION_SCRIPT_SRC;
    configurationJS.onload = function(){ tryToEndLoading(); };
    configurationJS.onerror = function(){ alert(this.src + ' Download failed!'); };
    document.head.appendChild(configurationJS);

    var threeJS = document.createElement('script');
    threeJS.src = CONSTRUCTOR_THREEJS_SCRIPT_SRC;
    threeJS.async = false;
    threeJS.onload = function(){ tryToEndLoading(); };
    threeJS.onerror = function(){ alert(this.src + ' Download failed!'); };
    document.head.appendChild(threeJS);

    var colladaLoaderJS = document.createElement('script');
    colladaLoaderJS.src = CONSTRUCTOR_COLLADA_LOADER_SCRIPT_SRC;
    colladaLoaderJS.async = false;
    colladaLoaderJS.onload = function(){ tryToEndLoading(); };
    colladaLoaderJS.onerror = function(){ alert(this.src + ' Download failed!'); };
    document.head.appendChild(colladaLoaderJS);

    ajaxGetRequest(CONSTRUCTOR_MODELS_SRC, function(responseText){
        self._MODELS = JSON.parse(responseText);

        // сортируем по группе и по имени
        // self._MODELS.sort(function(a,b){
        //     var fullNameA = (a.group || '') + a.name,
        //         fullNameB = ( (b.group || '') + b.name );
        //
        //     console.log(fullNameA, fullNameB, fullNameA < fullNameB);
        //
        //     return fullNameA < fullNameB;
        //     // return ( (a.group || '') + a.name ) > ( (b.group || '') + b.name );
        //     // return a.name > b.name;
        // });
        
        tryToEndLoading();
    });

    var loadCount = 7;
    function tryToEndLoading(){
        loadCount--;

        if(loadCount == 0) {
            self._init(div);

            div.removeChild(loadingImg);
            div.removeChild(shadow);
        }
    }
}

Constructor.prototype._init = function(div){
    var self = this;

    /*      INIT VISUAL COMPONENTS      */
    var constructor = document.createElement('div');
    constructor.classList.add('constructor');
    div.appendChild(constructor);

    this._catalog = this._initCatalog();
    constructor.appendChild(this._catalog);

    var editor = document.createElement('div');
    editor.classList.add('editor');
    constructor.appendChild(editor);

    var layoutCanvas = document.createElement('canvas');
    layoutCanvas.classList.add('editor-layout');
    editor.appendChild(layoutCanvas);

    var shiftSlider = document.createElement('input');
    shiftSlider.classList.add('slider');
    shiftSlider.classList.add('slider_editor-shift');
    shiftSlider.type = 'range';
    shiftSlider.step = '0.01';
    shiftSlider.min = '-1';
    shiftSlider.max = '1';
    shiftSlider.value = '0.5';
    editor.appendChild(shiftSlider);

    var radiusSlider = document.createElement('input');
    radiusSlider.classList.add('slider');
    radiusSlider.classList.add('slider_editor-radius');
    radiusSlider.type = 'range';
    radiusSlider.step = '0.005';
    radiusSlider.min = '0.7';
    radiusSlider.max = '1';
    radiusSlider.value = '0.75';
    editor.appendChild(radiusSlider);

    var viewerCanvas = document.createElement('canvas');
    viewerCanvas.classList.add('viewer');
    constructor.appendChild(viewerCanvas);

    /*      CREATE OBJECTS OF CLASSES    */
    this._layout = new Layout(layoutCanvas);
    this._radiusSlider = radiusSlider;
    this._shiftSlider = shiftSlider;

    this._viewer = new Viewer(viewerCanvas);

    this._config = new Configuration();

    /*      ADD EVENT LISTENERS     */
    this._curIdConf = null;

    this._catalog.onselect = function(idModel){
        self._curIdConf = self._addByIdModel(idModel);

        if(self._getModelByIdModel(idModel).positionType == 'staticUnit')
            self._shiftSlider.style.visibility = 'hidden';
        else {
            self._shiftSlider.style.visibility = 'visible';
            self._shiftSlider.value = 0;
        }
    };

    this._layout.onselect = function(idConf){
        self._curIdConf = idConf;

        var conf = self._config.getByIdConf(idConf);
        var model = self._getModelByIdModel(conf.idModel);

        if(model.positionType == 'staticUnit')
            self._shiftSlider.style.visibility = 'hidden';
        else {
            self._shiftSlider.style.visibility = 'visible';
            self._shiftSlider.value = conf.customShift;
        }
    };

    this._layout.onremove = function(idConf){
        self._curIdConf = null;

        self._config.removeByIdConf(idConf);
        self._viewer.removeById(idConf);

        self._shiftSlider.style.visibility = 'hidden';
    };

    this._layout.onmove = function(idConf, customX, customY){
        self._config.getByIdConf(idConf).customX = customX;
        self._config.getByIdConf(idConf).customY = customY;
        self._viewer.setPositionById(idConf, customX, -customY);
    };

    // add input event to IE
    if ( isIE() ) fixInputAndChangeEvents();

    this._shiftSlider.addEventListener('input',function(){
        self._config.getByIdConf(self._curIdConf).customShift = self._shiftSlider.value;
        self._viewer.setShiftById(self._curIdConf, self._shiftSlider.value);
    });

    this._radiusSlider.addEventListener('input',function(){
        self._config.R = this.value;
        self._layout.setRadius(this.value);
        self._viewer.setRadius(this.value);
    });

    this._viewer.onrotate = function(radians){
        self._layout.rotate(radians);
    };

    /*      SET DEFAULT SETTING     */
    this._catalog.fillByDefault();
    this._shiftSlider.style.visibility = 'hidden';
    this._radiusSlider.value = 0.75;
    this._layout.setRadius(0.75);
    this._viewer.setRadius(0.75);

    this.loadConfig(CONSTRUCTOR_DEFAULT_CONFIG)
};

Constructor.prototype._initCatalog = function() {
    var self = this;

    /*      CREATE      */
    var catalog = document.createElement('div');
    catalog.classList.add('catalog');

    /*      EVENT LISTENERS     */
    catalog.onselect = null; // return idModel

    /*      INIT COMPONENTS      */
    var curType = null, curGroup = null;

    var catalogMenu = this._initCatalogMenu();
    catalog.appendChild(catalogMenu);

    var catalogList = this._initCatalogList();
    catalog.appendChild(catalogList);

    /*      COMPONENTS EVENT LISTENERS      */
    catalogMenu.onselect = function(item){
        curType = item.name;
        catalogList.fill(curType);
        catalogList.setAttribute('footer','');
    };

    catalogList.onselect = function(item){
        // нажатие на кнопку возврата
        if(item.options == null){
            catalogList.fill(curType);
            catalogList.setAttribute('footer','');
        }
        // нажатие на модель
        else if(item.options.id != null){
            if(catalog.onselect)
                catalog.onselect(item.options.id);
        }
        // нажатие на группу
        else{
            curGroup = item.options.group;
            catalogList.fill(curType, curGroup);
            catalogList.setAttribute('footer',curGroup);
        }
    };

    /*      SET DEFAULT VALUE    */
    catalog.fillByDefault = function(){
        catalogMenu.firstElementChild.setSelectState(true);

        curType = catalogMenu.children[0].name;
        catalogList.fill(curType);

        catalogList.setAttribute('footer','');
    };

    return catalog;
};

Constructor.prototype._initCatalogMenu = function(){
    /*      CREATE      */
    var catalogMenu = document.createElement('div');
    catalogMenu.classList.add('catalog-menu');

    /*      EVENTS LISTENERS    */
    catalogMenu.onselect = null;

    // Убираем состояние select с предыдущего catalogMenuItem при погружении
    catalogMenu.addEventListener('click', function(e){
        for(var i=0; i<catalogMenu.children.length; i++)
            if(catalogMenu.children[i] == e.target){ // если нажали на catalogMenuItem
                for(var j=0; j<catalogMenu.children.length; j++)
                    if(catalogMenu.children[j].isSelected()) {
                        catalogMenu.children[j].setSelectState(false);
                        break;
                    }
                e.target.setSelectState(true);

                if(catalogMenu.onselect)
                    catalogMenu.onselect( e.target );

                break;
            }
    }, false);

    /*      FILL BY DEFAULT     */
    var flowersMenuItem = this._createCatalogMenuItem(CATALOG_FLOWERS_NAME, CATALOG_FLOWERS_IMG);
    catalogMenu.appendChild(flowersMenuItem);

    var greenMenuItem = this._createCatalogMenuItem(CATALOG_GREEN_NAME, CATALOG_GREEN_IMG);
    catalogMenu.appendChild(greenMenuItem);

    var decoreMenuItem = this._createCatalogMenuItem(CATALOG_DECORE_NAME, CATALOG_DECORE_IMG);
    catalogMenu.appendChild(decoreMenuItem);

    return catalogMenu;
};

Constructor.prototype._initCatalogList = function(){
    var self = this;

    /*      CREATE      */
    var catalogList = document.createElement('div');
    catalogList.classList.add('catalog-list');

    /*      EVENT LISTENERS     */
    catalogList.onselect = null;

    // Выполняем функцию по нажатию list-item при всплытии
    catalogList.addEventListener('click', function(e){
        for(var i=0; i<catalogList.children.length; i++)
            if(catalogList.children[i] == e.target){
                if(catalogList.onselect)
                    catalogList.onselect( e.target );
                break;
            }
    }, false);

    /*      FUNCTION       */
    catalogList.fill = function(curType, curGroup) {
        
        curGroup = curGroup || null;

        // очищаем list
        while(catalogList.firstElementChild)
            catalogList.removeChild(catalogList.firstElementChild);

        var models = [];

        // отображаем каталог по типу
        if(curGroup == null) {

            // получаем все модели необходимого типа
            for(var i=0; i<self._MODELS.length; i++)
                if(self._MODELS[i].type == curType)
                    models.push(self._MODELS[i]);

            for(var i=0; i<models.length; i++){

                // если модель не имеет группы
                if (!models[i].group)
                    catalogList.appendChild(
                        self._createCatalogListItem(
                            models[i].name,
                            models[i].img,
                            { group: null, id: models[i].idModel }
                        )
                    );
                // если модель принадлежит группе
                else {
                    // проходим по catalogList и ищем необходимую группу
                    var j, findItem = false;
                    for (j = 0; j < catalogList.children.length; j++)
                        if (catalogList.children[j].options.group == models[i].group) {
                            findItem = true;
                            break;
                        }

                    // если не нашли группу, добавляем итем
                    if (!findItem)
                        catalogList.appendChild(
                            self._createCatalogListItem(
                                models[i].group,
                                models[i].img,
                                { group: models[i].group, id: null }
                            ));
                }
            }
        }
        // отображаем каталог опр. группы
        else{
            catalogList.appendChild(
                self._createCatalogListItem(
                    CONSTRUCTOR_BACK_ITEM_NAME,
                    CONSTRUCTOR_BACK_ITEM_IMG,
                    null
                ));

            // получаем все модели необходимой группы
            for(var i=0; i<self._MODELS.length; i++)
                if(self._MODELS[i].group === curGroup)
                    models.push(self._MODELS[i]);

            // добавляем
            for(var i=0; i<models.length; i++)
                catalogList.appendChild(
                    self._createCatalogListItem(
                        models[i].name,
                        models[i].img,
                        { group: null, id: models[i].idModel }
                    ));
        }

    };

    return catalogList;
};

Constructor.prototype._createCatalogMenuItem = function(name, image){
    var div = document.createElement('div');
    div.className = 'catalog-menu__item';

    div._selection = false;
    div.isSelected = function(){
        return div._selection;
    };
    div.setSelectState = function(value){
        if(!arguments.length)
            return;

        if(value)
            div.classList.add('catalog-menu__item_select');
        else
            div.classList.remove('catalog-menu__item_select');

        div._selection = value;
    };

    div.name = name;
    div.innerHTML = name;
    div.style.backgroundImage = 'url('+image+')';

    return div;
};

Constructor.prototype._createCatalogListItem = function(name, image, options){
    var div = document.createElement('div');
    div.classList.add('catalog-list__item');

    div.setAttribute('name', name);
    div.style.backgroundImage = 'url('+image+')';

    div.options = options || null;

    return div;
};

Constructor.prototype._getModelByIdModel = function(idModel){
    for(var i=0; i<this._MODELS.length; i++)
        if(this._MODELS[i].idModel == idModel)
            return this._MODELS[i];
    return null;
};

Constructor.prototype._addByIdModel = function(idModel, args){
    var self = this;

    var model = this._getModelByIdModel(idModel);

    args = args || {};

    args.idModel = idModel;
    args.customShift = args.customShift != undefined ? args.customShift : 0;
    args.customX = args.customX || 0;
    args.customY = args.customY || 0;
    args.numberUnits = args.numberUnits || model.numberUnits || 0;

    var idConf = null;

    if(model.positionType == 'staticUnit'){
        this._removeByViewerType(model.positionType);

        idConf = this._config.add(args);
        this._layout.addStaticUnit(idConf, model.img);
        this._viewer.addStaticUnit(idConf, model.src);
    }
    else if(model.positionType == 'unit'){
        idConf = this._config.add(args);
        this._layout.addUnit(idConf, model.img,args.customX, args.customY);
        this._viewer.addUnit(idConf, model.src, args.customShift, args.customX, -args.customY);
    }
    else if(model.positionType == 'base'){
        this._removeByViewerType(model.positionType);

        idConf = this._config.add(args);
        this._layout.addBase(idConf, model.img);
        this._viewer.addBase(idConf, model.src, args.numberUnits, args.customShift, this._radiusSlider.value);
    }
    else if(model.positionType == 'frame'){
        this._removeByViewerType(model.positionType);

        idConf = this._config.add(args);
        this._layout.addFrame(idConf, model.img);
        this._viewer.addFrame(idConf, model.src, args.numberUnits, args.customShift, this._radiusSlider.value);
    }

    return idConf;
};

Constructor.prototype._removeByIdConf = function(idConf){
    console.log('remove');
    this._config.removeByIdConf(idConf);
    this._layout.removeById(idConf);
    this._viewer.removeById(idConf);
};

Constructor.prototype._removeByViewerType = function(positionType){
    var items = this._config.items;
    for(var i=0; i<items.length; i++) {
        var model = this._getModelByIdModel(items[i].idModel);

        if (model.positionType == positionType) {
            var id = items[i].idConf;
            this._removeByIdConf(id);
        }
    }
};

Constructor.prototype.loadConfig = function(url){
    var self = this;

    ajaxGetRequest(url, function(responseText){
        var config = JSON.parse(responseText);
        self.setConfig(config);
    });
};

Constructor.prototype.getConfig = function(){
    return this._config.get();
};

Constructor.prototype.setConfig = function(config){
    if(!config) return;

    while(this._config.length > 0)
        this._removeByIdConf(self._config.items[0].idConf);

    this._viewer.setDefaultView();

    this._config.R = config.R;
    this._layout.setRadius(config.R);
    this._viewer.setRadius(config.R);
    this._radiusSlider.value = config.R;

    for(var i=0; i<config.items.length; i++)
        this._addByIdModel(config.items[i].idModel,
            {
                customX: config.items[i].customX,
                customY: config.items[i].customY,
                customShift: config.items[i].customShift,
                numberUnits: config.items[i].numberUnits
            });
};