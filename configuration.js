function Configuration() {
    this.R = 1;
    this.items = [];

    this._idConf = 0;
}

Configuration.prototype.add = function(args){
    var item = new ConfigurationItem(
        args.idModel,
        this._idConf++,
        args.customShift||0,
        args.customX||0,
        args.customY||0,
        args.numberUnits||0
    );

    this.items.push(item);

    return item.idConf;
};

Configuration.prototype.removeByIdConf = function(idConf){
    for(var i=0; i<this.items.length; i++)
        if(this.items[i].idConf == idConf) {
            this.items.splice(i, 1);
            break;
        }

    if(this.items.length == 0)
        this._idConf = 0;
};

Configuration.prototype.getByIdConf = function(idConf){
    for(var i=0; i<this.items.length; i++)
        if(this.items[i].idConf == idConf)
            return this.items[i];
    return null;
};

Configuration.prototype.get = function(){
    var items = [];
    for(var i=0; i<this.items.length; i++){
        items.push( new ConfigurationItem(
            this.items[i].idModel,
            i,
            this.items[i].customShift,
            this.items[i].customX,
            this.items[i].customY,
            this.items[i].numberUnits
        ));
    }

    // возвращает коллецию из элементов конфигурации
    return {
        R: this.R,
        items: items
    };
};

function ConfigurationItem(idModel, idConf, customShift, customX, customY, numberUnits){
    this.idModel = idModel;
    this.idConf = idConf;
    this.customShift = customShift||0;
    this.customX = customX||0;
    this.customY = customY||0;
    this.numberUnits = numberUnits||0;
};