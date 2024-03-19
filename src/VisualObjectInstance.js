

class VisualObjectInstance{

    vars ="";
    petals = [];
    uri ="";

    instanceOf = null;

    dataValues = new Map();

    constructor(visualObject, data){

        this.instanceOf = visualObject;

        this.uri = data.uriVO.value;

        var petal = 0;
        for (petal = 0 ; petal<this.instanceOf.getNumPetals(); petal++) {
            this.petals.push(eval("data.petal"+(petal+1)+".value"));
            this.instanceOf.checkToUpdateMaxPetalValueWith(petal, this.petals[petal]);
        }
        
    }


    getLabel() {
        return this.dataValues.get("label");
    }

    getCoordinates() {
        var longitud = this.dataValues.get("Longitud");
        var latitud = this.dataValues.get("Latitud");

        return [Number(longitud), Number(latitud)];
    }

    getVisualObject() {
        return this.instanceOf;
    }

    getPercentagePetals() {
        var i =0;
        var petalsPercentage = [0.0,0.0,0.0,0.0,0.0];

        //var voInstance = this.getInstance(instance);

        for (i=0;i<this.petals.length;i++) {
            //console.log("petal i --> "+Number(voInstance.getPetal(i))+" , "+this.getMaxPetalValue(i));
            petalsPercentage[i] = parseFloat(Number(this.petals[i])/this.instanceOf.getMaxPetalValue(i));
        }
        
        return petalsPercentage;
    }

    setData(data) {
        for (const key of this.instanceOf.getDataVariables().keys())             
            this.setDataValue(key, eval('data.'+this.instanceOf.getDataVariables().get(key)+'.value'));              
    }

    setDataValue(key, value) {
        this.dataValues.set(key, value);
    }

    getDataValuesKeys(){
        return this.dataValues.keys();
    }

    getDataValue(key){
        return this.dataValues.get(key);
    }

    getURI() {
        return this.uri;
    }

    getPetal(num){
        return this.petals[num];
    }

    getNumPetals() {
        return this.petals.length;
    }

    log() {
        console.log("------> Instance "+this.getURI());
        for (const [key, value] of this.dataValues.entries()) {
            console.log(key + " ---> " + value);
        }
        var p = 0;
        for (p=0; p<this.getNumPetals(); p++)
            console.log( this.instanceOf.getPetal(p)+" ---> "+this.getPetal(p));
        console.log("------------------------------------------");
    }

    loadData() {

    }


    
}