class FlowerMap {

    visualObjects =[];

    loaded = 0;

    iniTime = null;

    graphicMap = null;

    
    constructor(data){

            // Parse de JSON received as a parameter
            var content = JSON.parse(data);
            var n = 0;
            var p = 0;                        
            
            this.iniTime = Date.now();
            // Create and load the VisualObjects from the JSON data and its instances from the KG
            for (n=0; n<content.visualObjects.length; n++) {
                var auxVisualObject = new VisualObject(content.visualObjects[n]);    
                auxVisualObject.loadInstances(this); 
                this.visualObjects.push(auxVisualObject);                             
            }                    
    }

    defineGraphicMap() {

    }

    createGraphicMap() {
        this.graphicMap = new BaseMap();
        this.graphicMap.create();
    }


    /**
     * Function invoked from the VisualObject when it is loaded.
     * @param {VisualObject} visualObject 
     */
    addLoadedObject(visualObject) {
        this.loaded = this.loaded+1;

        visualObject.loadData();

        if (this.loaded==this.visualObjects.length) {
            console.log("ALL OBJECTS LOADED");
            var v = 0;
            this.createMapStructures();
        }
    }

    createMapStructures() {

        const end = Date.now();
        console.log(`Load data Execution time: ${end - this.iniTime} ms`);
        console.log("CREATING MAP STRUCTURES");

        if (this.graphicMap==null)        
            this.createGraphicMap();        

        this.addFlowersToMap()
            .then (result=> {                                                    
            })
            .catch(error => {
                console.error('MAP IS NO READY. RETRY.', error);                    
                setTimeout(() => {            
                    this.createMapStructures();        
                }, 1000);  
            });
        
    }

    async addFlowersToMap() {

        var vo = 0;

        for (vo=0;vo<this.visualObjects.length;vo++) {

            var voi = 0;

            for (voi=0;voi<this.visualObjects[vo].getNumInstances();voi++) {
                console.log(this.visualObjects[vo].getInstance(voi).dataValues);
                if (this.visualObjects[vo].getInstance(voi).dataValues.size>0) 
                    this.graphicMap.addFlower(this.visualObjects[vo].getInstance(voi));                 
            }
        }  
        
        this.graphicMap.set2DView();
        this.graphicMap.createThreeLegendLayer();
        this.graphicMap.createMenuLayer();
        this.graphicMap.initVisualization(this.visualObjects);
        this.graphicMap.refresh();
    }

}