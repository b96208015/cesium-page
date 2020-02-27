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
});
