function Catalog(models, types){
    this.items = [];
    this.types = types;

    var curType;
    this.setType = function(type){
        curType = models[i].type;

        while(this.items.length)
            this.items.pop();
        
        for(var i=0; i<models.length; i++){
            if(models[i].type != type) continue;

            // если модель не имеет группы
            if (models[i].group == null){
                var item = new CatalogItem();
                item.type = 'model';
                item.id = i;
                item.name = models[i].name;
                item.img = models[i].img;

                this.items.push(item);
            }
            // если модель принадлежит группе
            else {
                // проходим по items и ищем уже добавленную группу
                var j, findItem = false, reachTheEnd = true;
                for (j = 0; j < this.items.length; j++)
                    if (this.items[i].type == 'group' && this.items[i].name == models[i].group) {
                        findItem = true;
                        reachTheEnd = false;
                        break;
                    }
                // если не нашли добавляем новый итем типа группа
                if (!findItem && reachTheEnd){
                    var item = new CatalogItem();
                    item.type = 'group';
                    item.name = models[i].group;
                    item.img = models[i].img;

                    this.items.push(item);
                }
            }
        }
    };

    this.setGroup = function(group){
        while(this.items.length)
            this.items.pop();

        var back = new CatalogItem();
        back.type = 'back';
        back.name = BACK_ITEM_NAME;
        back.img = BACK_ITEM_IMG;

        this.items.push(back);

        for(var i=0; i<models.length; i++)
            if(models[i].type == curType && models[i].group == group){
                var item = new CatalogItem();
                item.type = 'model';

                item.id = i;
                item.name = models[i].name;
                item.img = models[i].img;

                this.items.push(item);
            }
    };

}

function CatalogItem(){
    this.type; // back, group, model;
    this.id = null; // in MODELS[]
    this.name = null;
    this.img = null;
};