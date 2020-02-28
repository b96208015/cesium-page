document.addEventListener('DOMContentLoaded', function(event) {
    const options = {
        animation: false,
        infoBox: false,
        navigationHelpButton: false,
        sceneModePicker: false
    };

    const viewer = new Cesium.Viewer('cesiumContainer', options);
    const scene = viewer.scene;
    const camera = viewer.camera;
    const canvas = scene.canvas;
    var imageryLayers = viewer.imageryLayers;
    var handler = new Cesium.ScreenSpaceEventHandler(canvas);

    const infoPanel = document.getElementById('infoPanel');
    const charts = document.getElementById('charts');

    /**
     * Override the default behavior of homeButton
     */
    viewer.homeButton.viewModel.command.beforeExecute.addEventListener(function (commandInfo) {
        camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(
                121,
                23.5,
                800000
            )
        });

        // Tell the home button not to do anything
        commandInfo.cancel = true;
    });
    viewer.baseLayerPicker.viewModel.selectedTerrain = viewer.baseLayerPicker.viewModel.terrainProviderViewModels[1];

    scene.globe.enableLighting = false;
    scene.globe.showWaterEffect = false;

    camera.setView({
        destination : Cesium.Cartesian3.fromDegrees(
            121,
            23.5,
            800000
        )
    });
    camera.changed.addEventListener(
        function() {
            if (camera._suspendTerrainAdjustment && scene.mode === Cesium.SceneMode.SCENE3D) {
                camera._suspendTerrainAdjustment = false;
                camera._adjustHeightForTerrain();
            }
        }
    );

    // 等高線圖 92 ~ 94年 (2003 ~ 2005)
    var contourOld = new Cesium.WebMapTileServiceImageryProvider({
        url: 'https://wmts.nlsc.gov.tw/wmts',
        layer: 'MOI_CONTOUR',
        style: 'default',
        format: 'image/png',
        tileMatrixSetID: 'GoogleMapsCompatible',
        maximumLevel : 15,
    });
    var contourLayerOld = new Cesium.ImageryLayer(contourOld);
    // 等高線圖 99 ~ 104年 (2010 ~ 2015)
    var contourNew = new Cesium.WebMapTileServiceImageryProvider({
        url: 'https://wmts.nlsc.gov.tw/wmts',
        layer: 'MOI_CONTOUR_2',
        style: 'default',
        format: 'image/png',
        tileMatrixSetID: 'GoogleMapsCompatible',
        maximumLevel : 15,
    });
    var contourLayerNew = new Cesium.ImageryLayer(contourNew);

    const contourOldBtn = document.getElementById('contour-old');
    const contourNewBtn = document.getElementById('contour-new');
    contourOldBtn.addEventListener('click', function(){
        contourOldBtn.classList.toggle('btn-checked');
        if (contourOldBtn.classList.contains('btn-checked')) {
            imageryLayers.add(contourLayerOld);
        } else {
            imageryLayers.remove(contourLayerOld, false);
        }
    });
    contourNewBtn.addEventListener('click', function(){
        contourNewBtn.classList.toggle('btn-checked');
        if (contourNewBtn.classList.contains('btn-checked')) {
            imageryLayers.add(contourLayerNew);
        } else {
            imageryLayers.remove(contourLayerNew, false);
        }
    });
    
    /**
     * 地形剖面分析
     */
    const terrainProfileEstimationBtn = document.getElementById('terrainProfileEstimation');
    var terrainProfileEstimationPoint = [];
    var terrainProfileEstimationShape = [];
    var floatingPoint;
    var activeShape;
    terrainProfileEstimationBtn.addEventListener('click', function(){
        var actived = false;
        terrainProfileEstimationBtn.classList.toggle('btn-checked');
        if (terrainProfileEstimationBtn.classList.contains('btn-checked')) {
            infoPanel.style.display = 'block';
            
            var newRow0 = infoPanel.insertRow(-1);
            var newCell = newRow0.insertCell(0);
            var newText = document.createTextNode('* 點擊滑鼠左鍵新增路徑的頂點');
            newCell.appendChild(newText);

            var newRow1 = infoPanel.insertRow(-1);
            newCell = newRow1.insertCell(0);
            newText = document.createTextNode('* 點擊滑鼠右鍵完成新增路徑');
            newCell.appendChild(newText);
            
            var newRow2 = infoPanel.insertRow(-1);
            newCell = newRow2.insertCell(0);
            newText = document.createTextNode('**附註：本功能所輸出之高程值乃透過線性內插求得，僅供參考');
            newCell.appendChild(newText);

            function createPoint(worldPosition) {
                var point = viewer.entities.add({
                    position : worldPosition,
                    point : {
                        color : Cesium.Color.YELLOW,
                        pixelSize : 12,
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                    }
                });
                return point;
            }
            function drawShape(positionData) {
                var shape;
                shape = viewer.entities.add({
                    polyline : {
                        positions : positionData,
                        clampToGround : true,
                        material: new Cesium.ColorMaterialProperty(Cesium.Color.BLUE.withAlpha(0.8)),
                        width : 3
                    }
                });
                return shape;
            }
            
            var activeShapePoints = [];

            handler.setInputAction(function(event) {
                if (!Cesium.Entity.supportsPolylinesOnTerrain(scene)) {
                    console.log('This browser does not support polylines on terrain.');
                    return;
                }

                if (actived === true) {
                    terrainProfileEstimationShape.forEach(function(element){
                        viewer.entities.remove(element);
                    });
                    terrainProfileEstimationPoint.forEach(function(element){
                        viewer.entities.remove(element);
                    });                    
            
                    echarts.dispose(charts);
                    charts.style.display = 'none';
                    
                    actived = false;
                }

                // We use `scene.pickPosition` here instead of `camera.pickEllipsoid` so that we get the correct point when mousing over terrain.
                var earthPosition = scene.pickPosition(event.position);
                // `earthPosition` will be undefined if our mouse is not over the globe.
                if (Cesium.defined(earthPosition)) {
                    if (activeShapePoints.length === 0) {
                        floatingPoint = createPoint(earthPosition);
                        activeShapePoints.push(earthPosition);
                        var dynamicPositions = new Cesium.CallbackProperty(function () {
                            return activeShapePoints;
                        }, false);
                        activeShape = drawShape(dynamicPositions);
                    }
                    activeShapePoints.push(earthPosition);
                    var pointEntity = createPoint(earthPosition);
                    terrainProfileEstimationPoint.push(pointEntity);
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

            handler.setInputAction(function(event) {
                if (Cesium.defined(floatingPoint)) {
                    var newPosition = scene.pickPosition(event.endPosition);
                    if (Cesium.defined(newPosition)) {
                        floatingPoint.position.setValue(newPosition);
                        activeShapePoints.pop();
                        activeShapePoints.push(newPosition);
                    }
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

            // Redraw the shape so it's not dynamic and remove the dynamic shape.
            function terminateShape() {
                activeShapePoints.pop();
                var shapeEntity = drawShape(activeShapePoints); 
                terrainProfileEstimationShape.push(shapeEntity);
                
                var positions = [];
                var distance = [];                
                var count; // DTM的精度為20米 
                var offset;
                if (shapeEntity.polyline.positions._value.length > 1) {
                    count = new Array(shapeEntity.polyline.positions._value.length-1);

                    distance[0] = 0;

                    var rows = 0;
                    for (var i = 0; i < shapeEntity.polyline.positions._value.length-1; i++) {
                        count[i] = Math.floor(Cesium.Cartesian3.distance(shapeEntity.polyline.positions._value[i], shapeEntity.polyline.positions._value[i+1]) / 20);

                        for (var j = 0; j < count[i]; j++) {
                            offset = j / (count[i] - 1);
                            // 先取經緯度
                            positions[rows + j] = Cesium.Cartesian3.lerp(shapeEntity.polyline.positions._value[i], shapeEntity.polyline.positions._value[i+1], offset, new Cesium.Cartesian3());

                            if (rows + j > 0) {
                                distance[rows + j] = distance[rows + j -1] + Cesium.Cartesian3.distance(positions[rows + j -1], positions[rows + j]);
                            }
                        }
                        rows += count[i];
                    }
                } else {
                    positions = [shapeEntity.polyline.positions._value[0]];
                    distance = [0];
                }
                // 再反求高程
                var positionsCarto = [];
                positions.forEach(function(element) {
                    positionsCarto.push(
                        Cesium.Cartographic.fromDegrees(
                            Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(element).longitude), 
                            Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(element).latitude)
                        )
                    );
                });
                var promise = Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, positionsCarto);                
                Cesium.when(promise, function(updatedPositions) {
                    charts.style.display = 'block';
                    var myChart = echarts.init(charts);
                    var option = {
                        xAxis: {
                            type: 'category',
                            data: distance.map(function(e) {return (e/1000).toFixed(2);}),
                            name: '距離(km)',
                        },
                        yAxis: {
                            type: 'value',
                            name: '高程(m)',
                        },
                        toolbox: {
                            feature: {
                                dataView: {
                                    readOnly: true
                                },
                                saveAsImage: {}
                            }
                        },
                        tooltip: {
                            trigger: 'axis',
                            axisPointer: {
                                animation: false,
                            },
                        },
                        series: [{
                            name: '高程',
                            data: updatedPositions.map(function(e) {
                                return e.height.toFixed(2);
                            }),
                            type: 'line',
                            smooth: true
                        }]
                    };
                    myChart.setOption(option, true);
                });
                
                viewer.entities.remove(floatingPoint);
                viewer.entities.remove(activeShape);
                floatingPoint = undefined;
                activeShape = undefined;
                activeShapePoints = [];

                var handlerLabeling = new Cesium.ScreenSpaceEventHandler(canvas);
                var labelEntity = viewer.entities.add({
                    label : {
                        show : false,
                        showBackground : true,
                        font : '14px monospace',
                        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
                        horizontalOrigin : Cesium.HorizontalOrigin.LEFT,
                        verticalOrigin : Cesium.VerticalOrigin.TOP,
                        pixelOffset : new Cesium.Cartesian2(15, 0)
                    }
                });
                handlerLabeling.setInputAction(function(movement) {
                    var foundPosition = false;
                    if (scene.mode !== Cesium.SceneMode.MORPHING) {
                        var pickedObject = scene.pick(movement.endPosition);
                        if (scene.pickPositionSupported && Cesium.defined(pickedObject) && pickedObject.id === shapeEntity) {
                            var cartesian = scene.pickPosition(movement.endPosition);
            
                            if (Cesium.defined(cartesian)) {
                                var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                                var longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(2);
                                var latitudeString = Cesium.Math.toDegrees(cartographic.latitude).toFixed(2);
                                var heightString = cartographic.height.toFixed(2);
            
                                labelEntity.position = cartesian;
                                labelEntity.label.show = true;
                                labelEntity.label.text =
                                    '經度：' + ('   ' + longitudeString).slice(-7) + '\u00B0' +
                                    '\n緯度：' + ('   ' + latitudeString).slice(-7) + '\u00B0' +
                                    '\n高程：' + ('   ' + heightString).slice(-7) + 'm';
            
                                labelEntity.label.eyeOffset = new Cesium.Cartesian3(0.0, 0.0, -cartographic.height * (scene.mode === Cesium.SceneMode.SCENE2D ? 1.5 : 1.0));
            
                                foundPosition = true;
                            }
                        }
                    }
            
                    if (!foundPosition) {
                        labelEntity.label.show = false;
                    }
                }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

                actived = true;
            };

            handler.setInputAction(function(event) {
                terminateShape();
            }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        } else {
            infoPanel.style.display = 'none';
            var rows = {length: infoPanel.rows.length};
            for (var i=0; i<rows.length; i++) {
                infoPanel.deleteRow(-1);
            }

            handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
            
            viewer.entities.remove(activeShape);
            terrainProfileEstimationShape.forEach(function(element){
                viewer.entities.remove(element);
            });
            viewer.entities.remove(floatingPoint);
            terrainProfileEstimationPoint.forEach(function(element){
                viewer.entities.remove(element);
            });
            
            echarts.dispose(charts);
            charts.style.display = 'none';
        }
    });
});
