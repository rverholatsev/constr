var LAYOUT_ITEM_SIZE = 45;
var LAYOUT_ITEM_MARGIN = 2.5;

var LAYOUT_TEXT_HEIGHT = 25;

var LAYOUT_REMOVE_ITEM_IMG = 'images/service/cross.jpg';
var LAYOUT_CLEAR_ITEM_IMG = 'images/service/trash_box.jpg';

var LAYOUT_BASE_IMG = 'images/service/base.png';
var LAYOUT_FRAME_IMG = 'images/service/frame.png';
var LAYOUT_DECORE_IMG = 'images/service/decore.png';

function Layout(canvas){
    var self = this;

    canvas.width = canvas.getBoundingClientRect().width;
    canvas.height = canvas.getBoundingClientRect().height;
    this._context = canvas.getContext('2d');

    this._initComponents(canvas);

    /* VARIABLES */
    this._maxR = canvas.width < (canvas.height - (LAYOUT_TEXT_HEIGHT + LAYOUT_ITEM_SIZE))
        ? canvas.width/2 - LAYOUT_ITEM_MARGIN
        : (canvas.height - (LAYOUT_TEXT_HEIGHT + LAYOUT_ITEM_SIZE))/2 - LAYOUT_ITEM_MARGIN;
    this._R = 1;
    this._center = {
        x: canvas.width/2,
        y: LAYOUT_TEXT_HEIGHT + LAYOUT_ITEM_SIZE + (canvas.height - (LAYOUT_TEXT_HEIGHT + LAYOUT_ITEM_SIZE))/2
    };
    this._angle = 0;

    this._draggedItem = null;
    this._selectedItem = null;
    this._mouseShift = {x: 0, y: 0};

    /* EVENT LISTENERS */
    function globalToLocal(x,y){
        return {
            x: x - (canvas.getBoundingClientRect().left + window.pageXOffset),
            y: y - (canvas.getBoundingClientRect().top + window.pageYOffset)
        };
    }

    // внутренние обработчики событий
    canvas.addEventListener('mousedown', function(e){
        fixWhich(e);
        if(e.which!= 1)
            return;

        var local = globalToLocal(e.pageX,e.pageY);
        self._onMouseDown(local.x, local.y);
    });
    canvas.addEventListener('mousemove', function(e){
        var local = globalToLocal(e.pageX,e.pageY);
        self._onMouseMove(local.x, local.y);
    });
    canvas.addEventListener('mouseup', function(e) {
        fixWhich(e);
        if(e.which!= 1)
            return;

        self._onMouseUp();
    });
    canvas.addEventListener('mouseleave', function() {
        self._onMouseLeave();
    });

    // внешние обработчики событий
    this.onselect = null; // onselect(id)
    this.onmove = null; // onmove(id,customX,customY)
    this.onremove = null; // onremove(id)

    /* RENDERING */
    function animation(){
        self._render();
        requestAnimationFrame(animation);
    }
    animation();
}

Layout.prototype._initComponents = function(canvas){
    /* BUTTONS */
    this._removeItem = new LayoutItem(-99, LAYOUT_REMOVE_ITEM_IMG);
    this._removeItem._layout = this;
    this._removeItem.size = 60;
    this._removeItem.x = canvas.width - this._removeItem.size/2;
    this._removeItem.y = this._removeItem.size/2;

    this._clearItem = new LayoutItem(-100, LAYOUT_CLEAR_ITEM_IMG);
    this._clearItem._layout = this;
    this._clearItem.size = 35;
    this._clearItem.x = canvas.width - this._clearItem.size/2;
    this._clearItem.y = this._removeItem.size+this._clearItem.size/2;

    /* ITEMS */
    this._base = new LayoutItem(null, LAYOUT_BASE_IMG);
    this._base._layout = this;
    this._frame = new LayoutItem(null, LAYOUT_FRAME_IMG);
    this._frame._layout = this;
    this._staticUnit = new LayoutItem(null, LAYOUT_DECORE_IMG);
    this._staticUnit._layout = this;
    this._positingStaticItems();

    this._units = [];
};

Layout.prototype._render = function(){
    this._context.fillStyle = 'white';
    this._context.fillRect(0, 0, this._context.canvas.width, this._context.canvas.height);

    this._context.lineWidth = 2;
    this._context.strokeStyle = 'purple';
    this._context.beginPath();
    this._context.arc(this._center.x, this._center.y, this._R, 0, 2*Math.PI);
    this._context.stroke();

    // BUTTONS
    this._removeItem.render();
    this._clearItem.render();

    // STATIC ITEMS
    this._context.fillStyle = 'black';
    this._context.font = 'normal 12px Century Gothic';
    this._context.textAlign = 'center';
    this._context.textBaseline = 'top';

    this._context.fillText('База', LAYOUT_ITEM_SIZE/2, LAYOUT_TEXT_HEIGHT/2);
    this._context.fillText('Каркас', LAYOUT_ITEM_SIZE + LAYOUT_ITEM_SIZE/2, LAYOUT_TEXT_HEIGHT/2);
    this._context.fillText('Декор', 2*LAYOUT_ITEM_SIZE + LAYOUT_ITEM_SIZE/2, LAYOUT_TEXT_HEIGHT/2);

    this._base.render();
    this._frame.render();
    this._staticUnit.render();

    for(var i=0; i<this._units.length; i++)
        this._units[i].render();

    // повторно отрисовываем поверх всего
    if(this._selectedItem)
        this._selectedItem.render();
};

Layout.prototype.addBase = function(id, img){
    var item = new LayoutItem(id, img);
    
    this._base = item;
    
    item._layout = this;
    this._positingStaticItems();

    if(this._selectedItem) this._selectedItem.isSelect = false;
    this._selectedItem = item;
    item.isSelect = true;

    if(this.onselect) this.onselect(item.id);
};

Layout.prototype.addFrame = function(id, img){
    var item = new LayoutItem(id, img);
    
    this._frame = item;
    
    item._layout = this;
    this._positingStaticItems();

    if(this._selectedItem) this._selectedItem.isSelect = false;
    this._selectedItem = item;
    item.isSelect = true;

    if(this.onselect) this.onselect(item.id);
};

Layout.prototype.addStaticUnit = function(id, img){
    var item = new LayoutItem(id, img);
    
    this._staticUnit = item;

    item._layout  = this;
    this._positingStaticItems();

    if(this._selectedItem) this._selectedItem.isSelect = false;
    this._selectedItem = item;
    item.isSelect = true;

    if(this.onselect) this.onselect(item.id);
};

Layout.prototype.addUnit = function(id, img, customX, customY){
    var item = new LayoutItem(id, img);
    
    this._units.unshift(item);

    item._layout = this;
    item.custom( customX||0, customY||0 );

    if(this._selectedItem) this._selectedItem.isSelect = false;
    this._selectedItem = item;
    item.isSelect = true;

    if(this.onselect) this.onselect(item.id);
};

Layout.prototype.removeById = function(id){
    var item = null;
    for(var i=0; i<this._units.length; i++)
        if(this._units[i].id == id) {
            item = this._units[i];
            break;
        }
    // если принадлежит _units
    if(item)
        this._remove(item);
    // если явл статическим итемом
    else{
        if (this._base.id == id)
            this._remove(this._base);

        else if (this._frame.id == id)
            this._remove(this._frame);

        else if (this._staticUnit.id == id)
            this._remove(this._staticUnit);

        this._positingStaticItems();
    }
};

Layout.prototype.setRadius = function(customR){
    // принимает значения в Custom сис счисл
    if(!customR)
        return;

    // считаем коэфицент на сколько увеличился/уменьшился радиус
    var prevRadius = this._R / this._maxR;
    this._R = customR * this._maxR;
    var rateOfChange = customR / prevRadius;

    for(var i=0; i<this._units.length; i++) {
        // вычисляем новые координаты с учетом изменения радиуса
        var centerX = this._units[i].center().x * rateOfChange,
            centerY = this._units[i].center().y * rateOfChange;

        this._units[i].center(centerX, centerY);

        if(this._units[i].getDistanceToCenter() > this._R - this._units[i].size/2)
            this._moveOnEdgeOfCircle(this._units[i]);

        if(this.onmove) this.onmove(this._units[i].id, this._units[i].custom().x, this._units[i].custom().y);
    }
};

Layout.prototype.rotate = function(radians){
    // функция поворачивающая все динамические итемы
    // относительно текущего положения

    this._angle += radians;

    for(var i=0; i<this._units.length; i++){
        var centerX = this._units[i].center().x,
            centerY = this._units[i].center().y;

        this._units[i].center(
            centerX * Math.cos(radians) - centerY * Math.sin(radians),
            centerX * Math.sin(radians) + centerY * Math.cos(radians)
        );
    }
};

Layout.prototype._remove = function(item){
    if(!item) return;

    if(this.onremove) this.onremove(item.id);

    var i = this._units.indexOf(item);
    if(i > -1)
        this._units.splice(i,1);
    else {
        item.id = null;
        item.isSelect = false;

        if (item === this._base)
            item.setImage(LAYOUT_BASE_IMG);
        else if (item === this._frame)
            item.setImage(LAYOUT_FRAME_IMG);
        else if (item === this._staticUnit)
            item.setImage(LAYOUT_DECORE_IMG);

        this._positingStaticItems();
    }
};

Layout.prototype._positingStaticItems = function(){
    this._base.x = LAYOUT_ITEM_SIZE / 2;
    this._base.y = LAYOUT_TEXT_HEIGHT + LAYOUT_ITEM_SIZE / 2;
    
    this._frame.x = LAYOUT_ITEM_SIZE + LAYOUT_ITEM_SIZE / 2;
    this._frame.y = LAYOUT_TEXT_HEIGHT + LAYOUT_ITEM_SIZE / 2;

    this._staticUnit.x = 2*LAYOUT_ITEM_SIZE + LAYOUT_ITEM_SIZE / 2;
    this._staticUnit.y = LAYOUT_TEXT_HEIGHT + LAYOUT_ITEM_SIZE / 2;
};

Layout.prototype._moveOnEdgeOfCircle = function(item){
    // смещаем элемент на границу окружности
    
    var centerX = item.center().x,
        centerY = item.center().y;

    var r = this._R - item.size/2;

    var newCenterX = Math.sqrt( Math.pow(r,2) / (1 + Math.pow(centerY/centerX,2)) );
    var newCenterY = centerY/centerX * newCenterX;

    newCenterX = Math.abs(newCenterX);
    if(centerX < 0)
        newCenterX = -newCenterX;
    newCenterY = Math.abs(newCenterY);
    if(centerY < 0)
        newCenterY = -newCenterY;

    item.center(newCenterX, newCenterY);
};

Layout.prototype._isBelongTo = function(x, y){

    if(this._base.isBelong(x,y))
        return this._base;

    if(this._frame.isBelong(x,y))
        return this._frame;

    if(this._staticUnit.isBelong(x,y))
        return this._staticUnit;

    for(var i=0; i<this._units.length; i++)
        if(this._units[i].isBelong(x,y))
            return this._units[i];

    if(this._removeItem.isBelong(x,y))
        return this._removeItem;

    if(this._clearItem.isBelong(x,y))
        return this._clearItem;

    return null;
};

Layout.prototype._onMouseDown = function(x,y){
    var item = this._isBelongTo(x,y);

    // при нажатии в свободное место
    if(item == null)
        return;

    // при нажатии на кнопку удалить
    if(item == this._removeItem) {
        if(this._selectedItem) {
            this._remove(this._selectedItem);
            this._selectedItem = null;
        }

        this._removeItem.isSelect = true;
    }
    // при нажатии на кнопку очистить
    else if(item == this._clearItem){
        this._remove(this._base);
        this._remove(this._frame);
        this._remove(this._staticUnit);

        while(this._units.length > 0)
            this._remove(this._units[0]);

        this._selectedItem = null;

        this._clearItem.isSelect = true;
    }
    // при нажатии на итем
    else if(item != null){
        // если нажали на один из неактивных статических элементов
        if(item.id === null) return;

        if (this._selectedItem) this._selectedItem.isSelect = false;

        this._selectedItem = item;
        this._draggedItem = item;
        this._selectedItem.isSelect = true;

        this._mouseShift.x = x - item.x;
        this._mouseShift.y = y - item.y;

        if(this.onselect) this.onselect(item.id);
    }
};

Layout.prototype._onMouseMove = function(x,y){
    if(!this._draggedItem) return;

    // расчитываем новые координаты отн положения мыши с учетом смещения
    var newX = x - this._mouseShift.x,
        newY = y - this._mouseShift.y;

    // если новые координаты выходят за границы canvas, возвращаем
    if(newX < this._draggedItem.size/2)
        newX = this._draggedItem.size/2;
    else if (newX > this._context.canvas.width - this._draggedItem.size/2)
        newX = this._context.canvas.width - this._draggedItem.size/2;
    if(newY < this._draggedItem.size/2)
        newY = this._draggedItem.size/2;
    else if(newY > this._context.canvas.height - this._draggedItem.size/2)
        newY = this._context.canvas.height - this._draggedItem.size/2;

    this._draggedItem.x = newX;
    this._draggedItem.y = newY;

    // Подсвечиваем
    if(this._removeItem.isOverlap(this._draggedItem))
        this._removeItem.isSelect = true;
    else
        this._removeItem.isSelect = false;

    // если итем - unit, сообщаем о перемещении
    for(var i=0; i<this._units.length; i++)
        if(this._units[i] == this._draggedItem)
            if(this.onmove)
                this.onmove(this._draggedItem.id, this._draggedItem.custom().x, this._draggedItem.custom().y);
};

Layout.prototype._onMouseUp = function(){
    // если нажали на кнопку очистить
    if(this._clearItem.isSelect){
        this._clearItem.isSelect = false;
    }
    // в случае нажатия на кнопку удалить
    else if(this._removeItem.isSelect && !this._draggedItem){
        this._removeItem.isSelect = false;
    }
    // если перетащили на кнопку удалить
    else if(this._draggedItem && this._removeItem.isOverlap(this._draggedItem)){

        if(this.onremove) this.onremove(this._draggedItem.id);

        this._remove(this._draggedItem);

        this._selectedItem = null;
        this._draggedItem = null;
        this._removeItem.isSelect = false;
    }
    // если принадлежит Dinamic
    else if(this._draggedItem && this._units.indexOf(this._draggedItem) != -1) {
        // если выходит за границы окружности
        if (this._draggedItem.getDistanceToCenter() > this._R - this._draggedItem.size / 2) {
            this._moveOnEdgeOfCircle(this._draggedItem);
            if(this.onmove)
                this.onmove(this._draggedItem.id, this._draggedItem.custom().x, this._draggedItem.custom().y);
        }
        this._draggedItem = null;
    }
    // если база
    else if(this._draggedItem &&
            (this._draggedItem == this._base
            || this._draggedItem == this._frame
            || this._draggedItem == this._staticUnit) ) {
        // расположение по умолчанию
        this._positingStaticItems();
        this._draggedItem = null;
    }
};

Layout.prototype._onMouseLeave = function(){
    this._removeItem.isSelect = false;
    this._clearItem.isSelect = false;

    if(this._draggedItem){
        if(this._units.indexOf(this._draggedItem) >= 0) {
            this._moveOnEdgeOfCircle(this._draggedItem);

            console.log('onmouseleave with dragged unit');
            if(this.onmove)
                this.onmove(this._draggedItem.id, this._draggedItem.custom().x, this._draggedItem.custom().y);
        }
        else
            this._positingStaticItems();

        this._draggedItem = null;
    }
};

function LayoutItem(id, image,customX,customY) {
    this.id = id;

    this.x = 0;
    this.y = 0;
    if(customX != undefined && customY != undefined)
        this.custom(customX, customY);

    this.size = LAYOUT_ITEM_SIZE;

    this._img = new Image();
    this._img.src = image;

    this._layout = null;

    this.isSelect = false;
}

LayoutItem.prototype.render = function(){
    // отступ между итемами 2.5px
    var r = this.size/2 - LAYOUT_ITEM_MARGIN;
    var left = this.x - r;
    var top = this.y - r;

    var ctx = this._layout._context;

    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'puple';

    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, 2*Math.PI, true);
    ctx.fill();
    ctx.drawImage(this._img, left, top, 2*r, 2*r);

    if(this.isSelect) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, 2 * Math.PI);
        ctx.stroke();
    }
};

LayoutItem.prototype.setImage = function(src){
    if(!src) return;

    this._img.src = src;
};

LayoutItem.prototype.center = function(x,y){
    // принимает координаты центра итема относительно центра окружности
    // и преобразует в локальные координаты;
    // возвращает координаты центра итема относительно центра окружности;
    if(!arguments.length)
        return {
            x: this.x - this._layout._center.x,
            y: - this.y + this._layout._center.y
        };

    this.x = x + this._layout._center.x;
    this.y = - y + this._layout._center.y;
};

LayoutItem.prototype.custom = function(x,y){
    // принимает кастомные координаты итема, преобразует в центральные и устанавливает;
    // возвращает кастомные координаты преобразуя из центральных;

    var angle = this._layout._angle;

    if(!arguments.length) {
        // вычисляем custom координаты
        var customX = this.center().x / this._layout._maxR,
            customY = this.center().y / this._layout._maxR;

        // поворачиваем их против часовой
        // Math.sin(-angle),
        // Math.cos(-angle);

        return {
            x: customX * Math.cos(-angle) - customY * Math.sin(-angle),
            y: customX * Math.sin(-angle) + customY * Math.cos(-angle)
        };
    }

    // вычисляем центральные коорд
    var centerX = x * this._layout._maxR,
        centerY = y * this._layout._maxR;

    // поворачиваем по часовой
    // Math.sin(angle)
    // Math.cos(angle)

    this.center(
        centerX * Math.cos(angle) - centerY * Math.sin(angle),
        centerX * Math.sin(angle) + centerY * Math.cos(angle)
    );
};

LayoutItem.prototype.getDistanceToCenter = function(){
    return Math.sqrt( Math.pow(this.center().x, 2) + Math.pow(this.center().y, 2) );
};

LayoutItem.prototype.isBelong = function isBelong(x,y){
    // в функцию передается локальная координата,
    // проверяется принадлежит ли точка окружности итема
    var r = this.size/2 - LAYOUT_ITEM_MARGIN;

    if(x >= this.x - r && x <= this.x + r) {
        var rangeX = Math.abs(this.x - x);
        var rangeY = Math.sqrt( Math.pow(r,2) - Math.pow(rangeX,2));

        if (y >= this.y - rangeY && y <= this.y + rangeY)
            return true;
    }
    return false;
};

LayoutItem.prototype.isOverlap = function(item){
    // проверяем перекрывают окружности 2х итемов друг друга

    var _R = Math.sqrt(Math.pow(this.x - item.x,2) + Math.pow(this.y - item.y,2));

    return _R < (this.size/2 - LAYOUT_ITEM_MARGIN) + (item.size/2 - LAYOUT_ITEM_MARGIN);
};
