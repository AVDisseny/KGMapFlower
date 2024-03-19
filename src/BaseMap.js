class BaseMap {

    map = null;
    threeLayer = null;   
    threeLegendLayer = null;   
    menuLayer = null;  
    flowers = [];
    lastPitch=0.0;
    lastBearing=0.0;
    lastRoll=0.0
    oldZoom = 14;    
    lastFactor = 1;   

    instances = [];

    visualObjects = new Map();

    static MAP_NOT_CREATED = -1;
    static MAP_CREATING = 0;
    static MAP_CREATED = 1; 

    menuOptions = {deployed:false,
                   dimension3D: false,
                   legend:true,
                   width:200,
                   height:150};

    buttonsMenu =[];

    status = this.MAP_NOT_CREATED;

    ctxMenu = null;    
      
    constructor(){                
    }

    create() {        

        console.log("LLAMANDO A CREATE !!!!");
        this.status = this.MAP_CREATING;
        this.createMap();
        this.createThreeLayer();   
        //this.createMenuLayer();
        //this.createThreeLegendLayer();   
        this.setMapCallBacks();
        
    }


    createMap() {
        //center: [-0.37267699999999904,39.47579838925009],
        
        this.map = new maptalks.Map("map", {
            center: [0,0],
            zoom: 4,
            maxZoom:15,
            minZoom:3,
            pitch: 60,
            control:true,
            maxExtent: [-170, -75, 170, 75],
            centerCross:false,
            enableInfoWindow:true,
            zoomControl: {
                'position'  : 'bottom-left',
                'zoomLevel' : true
            },            
            // bearing: 180,
            
            doubleClickZoom: false,
            baseLayer: new maptalks.TileLayer('custom', {
                 urlTemplate: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
                 subdomains: ['a', 'b', 'c', 'd'],                 
                 attribution: '&copy; <a href="http://osm.org">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>'
            })
        });



    }


    set2DView() {

        //this.set3DView();
        this.onMapDragRotateStart();
        this.map.setPitch(-90);
        this.map.setBearing(0);
        this.onMapDragRotating();
        //this.map.disablePitch();
        //this.map.dragRotatePitch=false;
        var options2D ={dragPitch:false, dragRotate:false, dragRotatePitch :false};
        this.map.setOptions(options2D);
    }

    set3DView(){
        this.onMapDragRotateStart();
        this.map.setPitch(45);
        this.map.setBearing(0);
        this.onMapDragRotating();
        var options3D ={dragPitch:true, dragRotate:true, dragRotatePitch :true};
        this.map.setOptions(options3D);
    }

    setMapCallBacks(){
        this.map.on('dragrotatestart', this.onMapDragRotateStart.bind(this));
        this.map.on('dragrotating', this.onMapDragRotating.bind(this));
        this.map.on('zoomend', this.onMapZoomEnd.bind(this));      
        
        if (this.status==this.MAP_CREATING) {
            this.status = this.MAP_CREATED;
            this.addData();
        }
    }

    onMapDragRotateStart(){
        var i = 0;
      

        //for (i=0;i<flowers.length;i++) {
        //    lastRotation[i] = flowers[i].flower.getObject3d().rotation;
        //}
        
        this.lastPitch = this.map.getPitch();
        this.lastBearing = this.map.getBearing();
        this.lastRoll = this.getRoll(this.lastPitch, this.lastBearing);
    
    };

    onMapDragRotating() {
                
        var camera = this.threeLayer.getCamera().position;
        var newPitch = this.map.getPitch();
        var newBearing = this.map.getBearing();
        var newRoll = this.getRoll(newPitch, newBearing);
        
        var incPitch = (newPitch - this.lastPitch)*(3.1415/180);     
        var incRoll = (newRoll - this.lastRoll)*(3.1415/180);           
        var incBearing = (newBearing - this.lastBearing)*(3.1415/180);
        
        var i = 0;
        var pitchChanged = false;
        var bearingChanged = false;
        
        //console.log("f.rz="+flowers[0].flower.dataPoint.rotation.x+".......NP="+newPitch);
        const z = 100;           

        for (i=0;i<this.flowers.length;i++) {     
             this.flowers[i].dataPoint.rotation.x = -Math.PI/2+this.degToRad(newPitch);                    
             this.flowers[i].getObject3d().rotation.z = this.degToRad(-newBearing);
        }                

        this.lastBearing = newBearing;
        this.lastPitch = newPitch;
        this.lastRoll = newRoll;    

        
    }

    onMapZoomEnd() {
        this.refresh();
    }

    refresh(){
           
        var latestZoom = this.oldZoom;
        var newZoom = this.map.getZoom();
        this.oldZoom = newZoom;
        var factor = Math.pow(2, latestZoom- newZoom)*this.lastFactor;
            
        this.lastFactor = factor;
        
        if (factor<1)
            factor = 1;
    
        //console.log("zoom desde :"+latestZoom+" hasta :"+newZoom+" factor --> "+factor);            
        
        var hideBase = true;
        
        if (newZoom<11.5)
            hideBase = true;
        else
            hideBase = false;
            

        var i = 0;
        for (i=0;i<this.flowers.length;i++) {
            
            this.flowers[i].scale(factor);  
            
            if (hideBase)
                this.flowers[i].base.getObject3d().visible=false;
            else    
                this.flowers[i].base.getObject3d().visible=true;        
        }
    }

    getRoll(pitch, bearing) {
        // Convertir ángulos de grados a radianes
        var pitchRad = this.degToRad(pitch);
        var bearingRad = this.degToRad(bearing);

        // Calcular el roll usando la fórmula
        var rollRad = Math.atan(Math.sin(bearingRad) * Math.tan(pitchRad));

        // Convertir el resultado de radianes a grados
        var rollDeg = this.radToDeg(rollRad);

        return rollDeg;
    }
    
    degToRad(deg){
        return (deg * Math.PI) / 180;
    }
    
    radToDeg(rad){
        return (rad *180) / Math.PI;
    }

    

    createThreeLayer() {
        // the ThreeLayer to draw buildings
        this.threeLayer = new maptalks.ThreeLayer('threelayer', {
            identifyCountOnEvent: 1,
            fixed:true,
        });
    
        this.threeLayer.prepareToDraw = this.prepareToDraw.bind(this);
        this.threeLayer.addTo(this.map);
    }

    createMenuLayer() {
        this.menuLayer = new maptalks.CanvasLayer('menu', {
            'forceRenderOnMoving' : true,
            'forceRenderOnZooming' : true
          });

        this.menuLayer.prepareToDraw = this.prepareToDrawMenu.bind(this);
    
        // param1 and param2 are prepareToDraw's return values.
        this.menuLayer.draw = this.drawMenu.bind(this);

          //draw when map is interacting
        this.menuLayer.drawOnInteracting = this.drawOnInteractingMenu.bind(this);
    
        this.map.addLayer(this.menuLayer);


    }

    deployMenuAction() {
        this.menuOptions.deployed = !this.menuOptions.deployed;
        this.updateMenu();
    }

    changeLegend() {
        //alert(this.threeLegendLayer.visisble);
        if (this.menuOptions.legend) {
            this.threeLegendLayer.hide();
            this.menuOptions.legend=false;
            this.buttonsMenu[2].setText("SHOW LEGEND");
        }
        else {
            this.threeLegendLayer.show();
            this.menuOptions.legend=true;
            this.buttonsMenu[2].setText("HIDE LEGEND");
        }
        this.updateMenu();
    }

    changeView() {
        //alert(this.threeLegendLayer.visisble);
        if (this.menuOptions.dimension3D) {
            this.set2DView();
            this.menuOptions.dimension3D=false;
            this.buttonsMenu[3].setText("3D VIEW");
        }
        else {
            this.set3DView();
            this.menuOptions.dimension3D=true;
            this.buttonsMenu[3].setText("2D VIEW");
        }
        this.updateMenu();
    }

    prepareToDrawMenu(ctx) {

        var buttonDeploy = new Button(ctx.canvas.width-40, 5, "\u2630",  ctx , this.deployMenuAction.bind(this));
        this.buttonsMenu.push(buttonDeploy);
        
        var buttonClose = new Button(ctx.canvas.width-40, 5, "x",  ctx , this.deployMenuAction.bind(this));
        buttonClose.setBorder(false);
        this.buttonsMenu.push(buttonClose);


        var xBut = ctx.canvas.width-this.menuOptions.width+25;

        var buttonLayer = new Button(xBut,40,"HIDE LEGEND",ctx, this.changeLegend.bind(this));
        this.buttonsMenu.push(buttonLayer);

        var textView = "3D VIEW";
        if (this.menuOptions.dimension3D)
            textView = "2D VIEW";

        var button3D = new Button(xBut, 80, textView,ctx, this.changeView.bind(this));
        this.buttonsMenu.push(button3D);

        this.ctxMenu = ctx;
        
        var buttonsMenu = this.buttonsMenu;

        window.onmousedown = function(e) {         
            var but = 0;
            var exit = false;
            while (but<buttonsMenu.length && !exit) {
                exit = buttonsMenu[but].isClicked(e.pageX, e.pageY);
                but = but +1;
            }            
        }
    }

    drawOnInteractingMenu(ctx, view, param1, param2) {
        this.updateMenu();
    }
    
    /*
    onClick() {
        //this.action();
    }
    */

    drawMenu( ctx, view, param1, param2) {

        const width = 100;
        const height = 100;
        const fontSize = 9;
        const headerFontSize = 11     
        
        const initX = ctx.canvas.width-width;
        const initY = 0;

    
        this.updateMenu();
    }

    updateMenu() {

        //console.log("UPDATING MENU BEFORE"+this.buttonsMenu[0].x+"--"+this.buttonsMenu[1].x);

        console.log("UPDATING "+this.threeLegendLayer.isVisible());
        var ctx = this.ctxMenu;
        var width = this.menuOptions.width;
        var height = this.menuOptions.height;        

        if (this.menuOptions.legend)
            this.threeLegendLayer.show();
        else
            this.threeLegendLayer.hide();

        if (!this.menuOptions.deployed)
            this.closeMenu(ctx, width, height);
        else
            this.deployMenu(ctx, width, height);

        //console.log("UPDATING MENU AFTER"+this.buttonsMenu[0].x+"--"+this.buttonsMenu[1].x);

    }

    closeMenu(ctx, width, height) {
        const initX = ctx.canvas.width-width;
        const initY = 0;
        var settings = "\u2630";

        ctx.clearRect(initX-1, initY,width,height+16);        

        this.buttonsMenu[0].setX(ctx.canvas.width-40);        
        this.buttonsMenu[0].draw();

    }

    deployMenu(ctx, width, height) {
        const initX = ctx.canvas.width-width;
        const initY = 0;
        //console.log("DEPLOYING "+initX+","+initY+","+width+","+height);
        ctx.clearRect(initX-1, initY,width,height+16);
        ctx.strokeRect(initX, initY,width,height);        
        ctx.fillStyle="rgba(255,255,255,0.65)";
        ctx.fillRect(initX, initY,width,height);

        this.buttonsMenu[0].setX(initX +25);        
        this.buttonsMenu[0].draw();
                
        this.buttonsMenu[1].setX(ctx.canvas.width-40);
        this.buttonsMenu[1].draw();

        this.buttonsMenu[2].setX(ctx.canvas.width-this.menuOptions.width+25);
        this.buttonsMenu[2].draw();

        this.buttonsMenu[3].setX(ctx.canvas.width-this.menuOptions.width+25);
        this.buttonsMenu[3].draw();
    }


    createThreeLegendLayer() {
        this.threeLegendLayer = new maptalks.CanvasLayer('c', {
            'forceRenderOnMoving' : true,
            'forceRenderOnZooming' : true
          });



    
        this.threeLegendLayer.prepareToDraw = this.prepareToDrawLegend.bind(this);
    
        // param1 and param2 are prepareToDraw's return values.
        this.threeLegendLayer.draw = this.drawLegend.bind(this);

          //draw when map is interacting
        this.threeLegendLayer.drawOnInteracting = this.drawOnInteractingLegend.bind(this);
    
        this.map.addLayer(this.threeLegendLayer);


    }

    prepareToDraw(gl, scene, camera) {
        var light = new THREE.DirectionalLight(0xffffff);
            
        light.position.set(0, -10, 10).normalize();
        scene.add(light);
        scene.add(new THREE.AmbientLight('0x004EB0', 0.5));
        this.animate();
    }

    prepareToDrawLegend() {
        return [''];
    }

    drawOnInteractingLegend(ctx, view, param1, param2) {
        if (this.menuOptions.legend)
            this.drawLegend(ctx, view, param1, param2);
    }


    /*
    onClick() {
        alert("hello");
    }*/

    drawLegend( ctx, view, param1, param2) {
        const radius =25;
        const width = radius*8;
        const height = radius*8;
        const fontSize = 9;
        const headerFontSize = 11     
        
        if (this.menuOptions.legend) {
        
            var vo = this.visualObjects.get( this.visualObjects.keys().next().value);
            var voName = vo.getName();
            var voPetals = vo.petals;

            ctx.strokeRect(0,0,width+2,height+headerFontSize+4+2);        
            ctx.fillStyle="rgba(255,255,255,0.65)";
            ctx.fillRect(1,1,width,height+headerFontSize+4);

            ctx.beginPath();
            ctx.fillStyle = vo.getColor();
            ctx.arc(width/2,height/2+fontSize,radius*0.75,0,2*Math.PI);
            ctx.fill();
            ctx.closePath();

            if (vo.petals.length>0) {
                ctx.beginPath();
                ctx.fillStyle = vo.petalColor[0];
                ctx.ellipse(width/2, (height/2)-radius*2+fontSize, radius*0.7, radius*1.25, 0, 0, 2 * Math.PI)
                ctx.fill();
                ctx.closePath();

                if (vo.petals.length>1) {
                    ctx.beginPath();
                    ctx.fillStyle = vo.petalColor[1];
                    ctx.ellipse(width/2+radius*1.3, (height/2)+radius*1.5+fontSize, radius*0.7, radius*1.25, -Math.PI/4, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.closePath();

                    if (vo.petals.length>2) {
                        ctx.beginPath();
                        ctx.fillStyle = vo.petalColor[2];
                        ctx.ellipse(width/2-radius*1.3, (height/2)+radius*1.5+fontSize, radius*0.7, radius*1.25, Math.PI/4, 0, 2 * Math.PI);                    
                        ctx.fill();
                        ctx.closePath();

                        if (vo.petals.length>3) {
                            ctx.beginPath();
                            ctx.fillStyle = vo.petalColor[3];
                            ctx.ellipse(width/2-radius*1.75, (height/2)-radius+fontSize, radius*0.7, radius*1.25, -Math.PI/3, 0, 2 * Math.PI);
                            ctx.fill();
                            ctx.closePath();

                            if (vo.petals.length>4) {                    
                                ctx.beginPath();
                                ctx.fillStyle = vo.petalColor[4];
                                ctx.ellipse(width/2+radius*1.75, (height/2)-radius+fontSize, radius*0.7, radius*1.25, Math.PI/3, 0, 2 * Math.PI);                            
                                ctx.fill();
                                ctx.closePath();
                            }
                        }
                    }
                }
            }

            var str = vo.getName().toUpperCase();
            ctx.fillStyle = '#000';            
            ctx.font = 'bolder 11px sans-serif';
            var len = ctx.measureText(str).width;       
            ctx.strokeRect((width- len)/2-2,height-2, len+3,headerFontSize+4);
            ctx.fillText(str, (width- len)/ 2, height+fontSize);
            
            ctx.font = 'bolder 9px sans-serif';

            if (vo.petals.length>0) {
                var petal1str = vo.petals[0].toUpperCase();
                var len = ctx.measureText(petal1str).width;
                ctx.fillText(petal1str, (width- len)/ 2, fontSize+5);
                
                if (vo.petals.length>1) {
                    var petal2str = vo.petals[1].toUpperCase();
                    len = ctx.measureText(petal2str).width;
                    ctx.fillText(petal2str, width/2+radius,height-(fontSize+5));                
                    
                    if (vo.petals.length>2) {
                        var petal3str = vo.petals[2].toUpperCase(); 
                        len = ctx.measureText(petal3str).width;                    
                        ctx.fillText(petal3str, 5,height-(fontSize+5));

                        if (vo.petals.length>3) {
                            var petal4str = vo.petals[3].toUpperCase(); 
                            len = ctx.measureText(petal4str).width;                        
                            ctx.fillText(petal4str, 5,height/3-(fontSize+5));

                            if (vo.petals.length>4) {
                                var petal5str = vo.petals[4].toUpperCase(); 
                                len = ctx.measureText(petal5str).width;                            
                                ctx.fillText(petal5str, width/2+radius,height/3-(fontSize+5));
                            }
                        }
                    }
                }
            }
            
            this.threeLegendLayer.completeRender();  

        }
    }


    addData() {        
        if (this.flowers.length==0) { 
            var i=0;
            for (i=0; i<this.instances.length; i++)  {
                this.flowers.push(new Flower3D(this.instances[i], this.threeLayer))
                this.addVisualObject(this.instances[i]);                
            }
        }
    }

    addFlower( instance) { 
        if (this.status == this.MAP_CREATED) {
            this.flowers.push( new Flower3D( instance, this.threeLayer )); 
            this.addVisualObject(instance);
        }
        else 
            this.instances.push(instance);
        
    }

    addVisualObject(instance) {
        console.log("REGISER VO "+this.visualObjects.size);
        console.log("REGISER VO 1 "+this.visualObjects.get(instance.instanceOf.getName()));
        if (!this.visualObjects.get(instance.instanceOf.getName())!=null)
            this.visualObjects.set(instance.instanceOf.getName(), instance.instanceOf);
        console.log("REGISER VO 2"+this.visualObjects.size);
    }

    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
       
        this.threeLayer._needsUpdate = !this.threeLayer._needsUpdate;
        if (this.threeLayer._needsUpdate && !this.threeLayer.isRendering()) {
            this.threeLayer.redraw();
        }
    }

    getMap() {
        return this.map;
    }

    initVisualization(visualObjects) {
        var vo = 0;
        var vi = 0;
        var xMin = -200;
        var yMin = -200;
        var xMax = -200;
        var yMax = -200;

        for (vo=0; vo<visualObjects.length;vo++)
            for (vi=0; vi<visualObjects[vo].getNumInstances(); vi++) {
                var coordinates = visualObjects[vo].getInstance(vi).getCoordinates();
                if (coordinates[0]>xMax) xMax = coordinates[0];
                if (coordinates[0]<xMin) xMin = coordinates[0];
                if (coordinates[1]>yMax) yMax = coordinates[1];
                if (coordinates[1]<yMin) yMin = coordinates[1];
            }
        
        const extent = new maptalks.Extent(xMin,yMin,xMax,yMax);

        const center = extent.getCenter();
        const zoom = this.map.getFitZoom(extent, true);

        console.log("THE CENTER ES "+center);
        console.log("THE ZOOM ES "+zoom);

        this.map.setCenterAndZoom(center, zoom+0.5);

    }




    
}

class Button {
    x = 0;
    y = 0;
    width = 0;
    height = 0;
    text = "";
    ctx = null;
    bgColor ="rgba(255,255,255,0.65)";         
    textColor = "rgba(0,0,0,1)";
    marginLeft = 5;
    marginTop = 5;
    font = 'bolder 16px sans-serif';   
    action=null; 
    active = true;
    border=true;

    textMeasure = 0;

    constructor(x,y,text, ctx, action) {
        this.x = x;
        this.y = y;
        this.ctx = ctx;
        this.text = text;
        this.action = action;
        this.width = this.getWidth();
        this.height = this.getHeight();
    }

    deactivate() {
        this.active = false;
    }

    activate() {
        this.active = true;
    }

    setBorder(border) {
        this.border = border;
    }
    
    setX(x){
        this.x = x;
    }

    setY(y){
        this.y = y;
    }

    isClicked(x,y) {

        console.log("checking ("+x+","+y+") clicked on "+this.text+","+this.active+", ("+this.x+","+this.y+")");

        if (this.active) {
            var withBut = this.x + this.width;
            if ((x>=this.x) && (y>=this.y) && (x<this.x+this.width) && (y <=(this.y+this.height))) {
                if (this.action!=null)
                    this.action();
                return true;
            }
        }

        return false;
    }

    setFontSize(size) {

    }

    setTextColor(textColor) {

    }

    setBgColor(bgColor) {

    }
    
    setText(text) {
        this.text = text;
        this.width = this.getWidth();
        this.height = this.getHeight()
        this.mesaureText = this.getMeasureText();
    }

    draw() {
        this.ctx.font = this.font;
        var len = this.getMeasureText();     

        if (this.border) {
            this.ctx.strokeRect(this.x, this.y, this.width,this.height); //this.width, this.height);        
            this.ctx.fillStyle=this.bgColor;;
            this.ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        this.ctx.font = this.font
        this.ctx.fillStyle=this.textColor;
        this.ctx.textBaseline = "bottom";
        this.ctx.fillText(this.text, this.x+this.marginLeft, this.y+this.marginTop+16);

    }

    getMeasureText() {
        this.ctx.font=this.font;
        return this.ctx.measureText(this.text).width;
    }

    getMeasureTextHeight() {
        this.ctx.font=this.font;
        return this.ctx.measureText(this.text).height;
    }

    getWidth() {        
        return this.marginLeft + this.getMeasureText() + this.marginLeft;
    }

    getHeight() {        
        return this.marginTop + 16 + this.marginTop;
    }
}
