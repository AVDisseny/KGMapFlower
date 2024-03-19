class VisualObject {

    name ="";
    petals = [];
    attributes = [];
    apiQuery ="";
    results="";
    sourceExpression="";
    dataQuery = "";
    instances = [];
    maxPetalValue = [0,0,0,0,0];

    color = '#004EB0';
    petalColor = ['#004EB0','#BF0000','#00A400','#DAB50E','#8080FF'];
    baseColor = '#FF0000';

    dataVariables = new Map();

    loadStatus = -1;
      
    constructor(data){
        this.name = data.name;
        this.setResults(data.arrayResults); 
        
        this.loadPetals(data);
        this.loadDataVariables(data);              

        this.apiQuery = this.formatAPIQuery(data.apiQuery, data.sourceExpression);
        this.dataQuery = this.formatAPIQuery(data.apiQuery, data.dataExpression);
    }

    getColor() {
        return this.color;
    }

    getPetalColor(){
        return this.petalColor;
    }

    getBaseColor() {
        return this.baseColor;
    }

    loadPetals(data) {
        var p = 0;
        var numPetals = data.petals.length;
        for (p=0; p<numPetals; p++) {
            var petalName = "petal"+(p+1);                    
            this.addPetal(eval("data.petals[p]."+petalName));
        }  
    }

    getMaxPetalValue(i) {
        return this.maxPetalValue[i];
    }

    checkToUpdateMaxPetalValueWith(petal, value) {
        var valueNumber = Number(value);
        if (this.getMaxPetalValue(petal)<valueNumber)
            this.maxPetalValue[petal] = valueNumber;
    }

    getName() {
        return this.name;
    }

    getPercentagePetalsOfInstance(instance) {
        var i =0;
        var petalsPercentage = [0.0,0.0,0.0,0.0,0.0];

        var voInstance = this.getInstance(instance);

        for (i=0;i<this.getNumPetals();i++) {
            //console.log("petal i --> "+Number(voInstance.getPetal(i))+" , "+this.getMaxPetalValue(i));
            petalsPercentage[i] = parseFloat(Number(voInstance.getPetal(i))/this.getMaxPetalValue(i));
        }
        
        return petalsPercentage;
    }

    roundToTwo(num) {
        return +(Math.round(num + "e+2")  + "e-2");
    }
    

    loadDataVariables(data) {
        var d = 0;
        for (d=0;d<data.dataVariables.length;d++)
            this.dataVariables.set( data.dataVariables[d].name, data.dataVariables[d].var );
    }

    getDataVariablesValues() {
        return this.dataVariables.values;
    }

    getDataVariables() {
        return this.dataVariables;
    }

    getLoadStatus() {
        return this.loadStatus;
    }

    loadInstances(fMap) {

        this.loadStatus = 0;

        fetch(this.getAPIQuery())
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                    this.loadStatus = -2;
                }
                return response.json();
            })
            .then(data => {                        
                var results = eval("data."+this.getResults());             
                var b = 0;            
                for (b=0;b<results.length;b++) 
                    this.instances.push(new VisualObjectInstance(this, results[b]));

                this.loadStatus = 1;
                
                this.loadObjectData(fMap);                
            })
            .catch(error => {
                console.error('Error:', error);
                this.loadStatus = -2;
            });

    }

    loadData() {
        var vObjectInstance = 0;

        for (vObjectInstance=0; vObjectInstance<this.getNumInstances(); vObjectInstance++) {
            this.getInstance(vObjectInstance).loadData();
        }
    }

    loadObjectData(fMap) {

        this.updateDataQuery();

        fetch(this.getDataQuery())
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                    this.loadStatus = -2;
                }
                return response.json();
            })
            .then(data => {                        
                var results = eval("data."+this.getResults());             
                var b = 0;            
                for (b=0;b<results.length;b++) {                    
                    this.getInstanceWithURI(results[b].uriVO.value).setData(results[b]);
                }

                this.loadStatus = 2;
                
                fMap.addLoadedObject(this);                
            })
            .catch(error => {
                console.error('Error:', error);
                this.loadStatus = -2;
            });



    } 
    updateDataQuery() {
        var visualObjectURIs = "";
        var v = 0;

        for (v=0; v<this.getNumInstances(); v++) {
            
            if (v > 0)
                visualObjectURIs = visualObjectURIs + ',';

            visualObjectURIs = visualObjectURIs + '<'+this.getInstance(v).getURI()+'>'
        }

        this.dataQuery = this.dataQuery.replace('SET_OF_VO_URI', visualObjectURIs);
    }

    getInstances() {
        return this.instances;
    }

    getInstance(num) {
        return this.instances[num];
    }

    getInstanceWithURI(uri) {
        var found = false;
        var n = 0;
        var auxInstance = null;

        while (!found && n<this.getNumInstances()) {
            found = (this.getInstance(n).getURI()==uri)
            n++;
        }

        if (found)
            auxInstance = this.getInstance(n-1);

        return auxInstance;
    }

    getNumInstances() {
        return this.instances.length;
    }

    addPetal(petalName) {
        this.petals.push(petalName);
    }

    getPetal(num) {
        return this.petals[num];
    }

    getNumPetals() {
        return this.petals.length;
    }

    formatAPIQuery(queryIni, sourceExpression){
        return queryIni + this.encondeURIVirtuoso(sourceExpression);
    }

    getAPIQuery() {
        return this.apiQuery;
    }

    getDataQuery() {
        return this.dataQuery;
    }

    setResults(results) {
        this.results=results;
    }

    getResults(){
        return this.results;
    }

    log() {
        console.log("---------------------------");
        console.log("VO Name "+this.name);
        var p = 0;
        for (p=0; p<this.getNumPetals(); p++)
            console.log("Petal "+p+" name ="+this.petals[p]);
        
        console.log("query "+this.getAPIQuery());
        console.log("results "+this.getResults());
        console.log("dataVariables");
        for (const [key, value] of this.dataVariables.entries()) {
            console.log(key + " ---> " + value);
        }
        console.log("data query= "+ this.dataQuery);
        console.log("---------------------------");
        console.log("-------- INSTANCES --------");
        for (p=0;p<this.getNumInstances(); p++)
            this.getInstance(p).log();
        console.log("---------------------------");            
    }

    encondeURIVirtuoso(str) {
        var encoded = encodeURIComponent(str);

        return encoded.replace('%20','+');
    }

}