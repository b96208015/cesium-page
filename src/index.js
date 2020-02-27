document.addEventListener('DOMContentLoaded', function(event) {
    var options = {
        navigationHelpButton: false,
    };

    var viewer = new Cesium.Viewer('cesiumContainer', options);
    var scene = viewer.scene;
    var camera = viewer.camera;
    var canvas = scene.canvas;
    var imageryLayers = viewer.imageryLayers;
    var handler = new Cesium.ScreenSpaceEventHandler(canvas);

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

    var contourOldBtn = document.getElementById('contour-old');
    var contourNewBtn = document.getElementById('contour-new');
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
});
