class Flower3D extends maptalks.BaseObject {
    flower=null;
    base = null;
    flowerLabel = null;
    layer = null;

    materialFlower = null;
    petals = [];

    instance = null;

    dataPoint = new THREE.Group();    

    OPTIONS_FLOWER = {
        radius: 100,
        altitude: 0};

    baseMap = null;

    infoWindow = null;
    
    constructor(instance, layer, map) { 

        super();  

        this.createBasicMesh();

        this.instance = instance;
        
        var radius = 100;
        var altitude = 30;

        var center = instance.getCoordinates();
        var percentages = instance.getPercentagePetals();
        var label = instance.getLabel();        

        this.layer = layer;

        var options = {radius:radius, altitude:altitude, interactive:true};
        options = maptalks.Util.extend({}, this.OPTIONS_FLOWER, options, { layer, center });                
        this._initOptions(options);

        this.createBase(center, instance.instanceOf.getBaseColor());

        this.on('click', this.onClick.bind(this));
                  
        this.layer.addMesh(this.base); 

        //const materialFlower = new THREE.MeshLambertMaterial({ color: '#004EB0', transparent: true });
        this.createFlower(center, label, percentages, radius, altitude);

        this.layer.addMesh(this.flower);

        this.baseMap = map;


    }

    onClick() {        
        var options = {    
            'title':' ',  
            'autoCloseOn':true, 
            'autoOpenOn':false,                 
            'single' : false,            
            'width'  : 283,
            'height' : 105,            
            'dx' : -3,
            'dy' : -12,
            'content'   : this.getInfoWindowContent()
          };
          this.infoWindow = new maptalks.ui.InfoWindow(options);          
          this.baseMap.addInfoWindow(this.infoWindow, this.instance.getCoordinates());
          
    }


    getInfoWindowContent() {

        //var content = '<div style=\"border:1px solid black;background-color: #2ecc71;padding:10px;border-radius:4px\">';
        var content = "<div>"

        content = content + '<b><a href=\"'+this.instance.uri+'\" target=\"_blank\">'+this.instance.getLabel()+'</a></b><br><br>';

        var iter = this.instance.getDataValuesKeys();

        console.log(iter);

        let result = iter.next();
        while (!result.done) {
          if (result.value!="label" && result.value!="uri" && result.value!="Latitud" && result.value!="Longitud")
            content = content + '<b>'+result.value + " : </b><br>" + this.instance.getDataValue(result.value) + '<br>';          
          result = iter.next();
        }            
        
        content = content + '<hr style=\"border-top: 3px solid #bbb\">';

        var p = 0;

        for (p=0; p<this.instance.getNumPetals(); p++)
            content = content + '<p style=\"color:'+this.instance.instanceOf.getPetalColor()[p]+'\"><b>'+ this.instance.instanceOf.getPetal(p)+" : </b>"+this.instance.getPetal(p)+'</p>';

        content = content + '</div>';

        console.log(content);

        return content;
    }

    createBasicMesh() {
        const materialFlower = new THREE.MeshLambertMaterial({ color: '#004EB0', transparent: true });
        const geometry2 = new THREE.SphereGeometry(0.01, 2,2);
        this._createMesh(geometry2, materialFlower);
    }

    createBase(center, baseColor) {
        const extrudePolygons = [];            
        const f = { "type": "Feature", "geometry": { "type": "Polygon", "coordinates":[[[center[0]-0.000116, center[1]+0.000172], 
                [center[0]+0.000120, center[1]+0.000185], 
                [center[0]+0.000109, center[1]-0.000185], 
                [center[0]-0.000113, center[1]-0.000172], 
                [center[0]-0.000116, center[1]+0.000172]]] }, "properties": { "name": "1-3cf0006e", "_color": "#4b3aff", "center": center } };

        const materialBase =  new THREE.MeshLambertMaterial({ color:baseColor , transparent: true });  

        this.base = this.layer.toExtrudePolygon(f, { height: 60 }, materialBase);
    }


    createFlower(coordinate, label, percentage, radius, altitude){

        // Initialize flower position
        var viewerPosition = new THREE.Vector3();
        viewerPosition.setFromMatrixPosition(this.layer.getCamera().matrixWorld);
        var objectPosition = new THREE.Vector3();
        objectPosition.setFromMatrixPosition(this.getObject3d().matrixWorld);
                
        var direction = new THREE.Vector3(0,0,0);        
        this.getObject3d().quaternion.setFromUnitVectors(this.getObject3d().up, direction.normalize() );       
        this.getObject3d().add(this.dataPoint);

        const z = this.layer.altitudeToVector3(altitude, altitude).x;
        const position = this.layer.coordinateToVector3(coordinate, z);
        position.z += 10;
        this.getObject3d().position.copy(position);
                       
        // Create the center of the flower
        this.dataPoint.add(this.createCenter());
     
        // Create the petals
        var petalsColor = this.instance.instanceOf.getPetalColor();        
        var p = 0;
        for (p=0; p<this.instance.getNumPetals(); p++) {
            if (percentage[p]>0)
                this.dataPoint.add(this.createPetal(p, percentage[p], petalsColor[p], radius));

        }        
         
        // Create the bottom label
        this.createFlowerLabel(label);
        
        this.dataPoint.add(this.flowerLabel);

        this.layer.addMesh(this);
    }

    createCenter() {
        var centerColor = this.instance.instanceOf.getColor();
        const materialCenter = new THREE.MeshLambertMaterial({ color: centerColor, transparent: true });        
        const geometry3 = new THREE.CylinderGeometry(1, 1, 1, 32, 1);
        var centerF = new THREE.Mesh(geometry3, materialCenter);      

        return centerF;
    }

    createFlowerLabel(label) {
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 512;

        // Draw text onto the canvas
        context.font = 'Bold 60px Arial';
        context.fillStyle = this.instance.instanceOf.getColor();
        context.fillText(label, 50, 100);

        // Create a texture from the canvas
        var texture = new THREE.CanvasTexture(canvas);

        // Create a plane geometry to apply the texture to
        var geometryT = new THREE.PlaneGeometry(10, 10);
        var materialT = new THREE.MeshBasicMaterial({ map: texture});
        this.flowerLabel = new THREE.Mesh(geometryT, materialT);
        this.flowerLabel.position.z = -8;
        this.flowerLabel.rotation.x = -Math.PI/2;
        this.flowerLabel.rotation.y = Math.PI;
        this.flowerLabel.rotation.z = -Math.PI;  
    }

    createPetal(numPetal, percentage, color, radius) {

        const r = this.layer.distanceToVector3(radius, radius).x;
        const geometry = new THREE.SphereGeometry(r, 20, 8);

        var hipo =2*1.5;
        var petalarea = 1.5*0.6;

        var petalMaterial  = new THREE.MeshLambertMaterial({ color: color, transparent: true });
            
        var petalMesh =  new THREE.Mesh(geometry, petalMaterial);
        petalMesh.rotation.x = -Math.PI;
        petalMesh.rotation.y = this.getPetalRotationY(numPetal);
        petalMesh.rotation.z = -Math.PI;
        
        petalMesh.scale.z = 0.6-0.3*(1-percentage);
        petalMesh.scale.x = (petalarea*percentage)/petalMesh.scale.z; 
        petalMesh.scale.y = 0.3;                                    

        var positionInc = this.getPetalPositionInc(numPetal, hipo, percentage, petalMesh.scale.x);
        petalMesh.position.x += positionInc.x;
        petalMesh.position.y += positionInc.y;
        petalMesh.position.z += positionInc.z;

        return petalMesh;
    }

    getPetalRotationY(numPetal) {
        var rotation = Math.PI/2;

        if (numPetal==1 || numPetal==2)
            rotation = rotation + Math.PI/6;
        
        if (numPetal==3 || numPetal==4)
            rotation = Math.PI/6;

        if (numPetal == 2 || numPetal == 3)
            rotation = -rotation;

        return rotation;
    }

    getPetalPositionInc(numPetal, hipo, percentage, scale) {

        var incPosition = new THREE.Vector3(0,0,0);

        if (numPetal==0)
            incPosition.z = (-1)*(0.4+(hipo/2)*(1-percentage)-3.25);

        if (numPetal==1 ||numPetal==2){
            incPosition.z =-(((0.8660*hipo)+1.85+percentage)-3.25);
            incPosition.x = (0.5*hipo-(1-percentage));
        }

        if (numPetal==3 || numPetal==4) {
            incPosition.z =-((0.5*hipo+(1-percentage+0.5))-3.25); 
            incPosition.x = scale+1;              
        }

        if (numPetal==2 || numPetal==3)
            incPosition.x = (-1)*incPosition.x;

        return incPosition;
    }


    scale(factor) {
        this.getObject3d().scale.set(factor, factor,factor);
        this.base.getObject3d().scale.set(factor, factor,factor);
        
    }
}

