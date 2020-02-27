document.addEventListener('DOMContentLoaded', function(event) {
    var options = {
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: true,
        infoBox : false,
        sceneModePicker: false,
        timeline: false,
    };    
    var viewer = new Cesium.Viewer('cesiumContainer', options);
    var scene = viewer.scene;
    var camera = viewer.camera;
    var canvas = scene.canvas;
    var imageryLayers = viewer.imageryLayers;
    var handler = new Cesium.ScreenSpaceEventHandler(canvas);
});
