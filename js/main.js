// 設定  ------------------------------------------
var config = {};

config.fps = 60; // なめらかなアニメーションにしたい場合は30 or 60を入れる
// config.gameSpeed = 10; // デフォルト値 2,3と入れるとスピードも2,3倍する

config.canvas = {
    // iphone4サイズ
    width   : 400,
    height  : 400,
};

config.mass = {
    size   : 20,
    length : 20,
    TYPE   : {
        NON_BLOCK : 1, // 通れる
        BLOCK     : 2, // 通れない
        START     : 3, // スタート
        GOAL      : 4  // ゴール
    }
};

config.color = {
    block : 'rgb(0, 0, 0)',
    start : 'rgb(0, 255, 0)',
    goal  : 'rgb(255, 0, 0)'
};
// 設定  ------------------------------------------

/**
 * 初期読み込み
 * @param  {[type]} window [description]
 * @return {[type]}        [description]
 */
(function (window) {

    // member --------------------
    var context     = null;
    var masses      = [];
    var traceCounts = [];

    window.addEventListener('load', main);

    function main () {
        window.removeEventListener('load', main);
        var canvas        = document.getElementById('board');
        context           = canvas.getContext('2d');
        canvas.width      = config.canvas.width;
        canvas.height     = config.canvas.height;
        
        
        // キャンパスイベント -------------------
        addCanvasEvent( canvas );

        // ボタンイベント ----------------------
        addButtonEvent();


        // マス情報初期化, 作成 -----------------------------
        createMasses();
        // createMassView();
        

        // 更新処理スタート
        (function _update(){
            setTimeout(function() {
                update();
                _update();
            }, 1000/config.fps)
        })();
    }


    // キャンパス イベント ---------------------------
    function addCanvasEvent (canvas) {
        canvas.addEventListener('mousedown', start, false);
        canvas.addEventListener('mousemove', move,  false);
        // canvas.addEventListener('click',     click, false);
        window.addEventListener('mouseup',   stop,  false);

        var isDrag   = false;
        var lastMass = {
            row    : null,
            column : null
        };

        function start (event) {
            isDrag = true;
            var row    = Math.floor( event.clientY / config.mass.size );
            var column = Math.floor( event.clientX / config.mass.size );
            toggleMassStateWithRowAndColumn(row, column);
            setLastMass(row, column);
        }

        function move (event) {
            if (!isDrag) return;

            var row    = Math.floor( event.clientY / config.mass.size );
            var column = Math.floor( event.clientX / config.mass.size );

            if ( isLastMass(row, column) ) return;

            toggleMassStateWithRowAndColumn(row, column);
            setLastMass(row, column);
        }

        /*
        function click(event) {
            var row    = Math.floor( event.clientY / config.mass.size );
            var column = Math.floor( event.clientX / config.mass.size );
            if ( isLastMass(row, column) ) return;

            toggleMassStateWithRowAndColumn(row, column);
            resetLastMass();
        }
        */

        function stop(event) {
            isDrag = false;
            resetLastMass();
        }

        // ----------------------------------------------------
        function setLastMass (row, column) {
            lastMass['row']    = row;
            lastMass['column'] = column;
        }

        function resetLastMass () {
            lastMass['row']    = null;
            lastMass['column'] = null;
        }

        function isLastMass(row, column) {
            var flag = false;

            if (lastMass['row'] === row && lastMass['column'] === column) {
                flag = true;
            }

            return flag;
        }
    }

    function addButtonEvent() {
        var startButton = document.getElementById('start_button');
        startButton.addEventListener('click', start, false);

        function start(event) {
            traceroute();
        }
    }

    function toggleMassStateWithRowAndColumn(row, column) {
        // スタートかゴールの位置はトグルさせない(色を変更させない)
        if ( row === 0 && column === (config.mass.length - 1) ) {
            return;
        } else if ( row === (config.mass.length - 1) && column === 0 ) {
            return;
        }


        var mass = masses[row][column];

        if (mass === config.mass.TYPE.NON_BLOCK) {
            masses[row][column] = config.mass.TYPE.BLOCK;
        } else {
            masses[row][column] = config.mass.TYPE.NON_BLOCK;
        }
    }

    // マスの配列初期化 -------------------------------------
    function createMasses() {
        var row;    // 行
        var column; // 列

        for (row = 0; row < config.mass.length; row++) {
            masses.push( [] );

            for (column = 0; column < config.mass.length; column++) {
                masses[row][column] = config.mass.TYPE.NON_BLOCK;

                if ( row === 0 && column === (config.mass.length - 1) ) {
                    masses[row][column] = config.mass.TYPE.GOAL;
                } else if ( row === (config.mass.length - 1) && column === 0 ) {
                    masses[row][column] = config.mass.TYPE.START;
                }
            }
        }
    }

    // マス配列情報を元にマス目を作成 -------------------------
    function createMassView() {
        var row;    // 行
        var column; // 列
        var x, y, mass;

        for (row = 0; row < config.mass.length; row++) {
            for (column = 0; column < config.mass.length; column++) {
                y = row * config.mass.size;
                x = column * config.mass.size;
                mass = masses[row][column];

                if (mass === config.mass.TYPE.NON_BLOCK) {
                    context.strokeRect(x, y, config.mass.size, config.mass.size);
                } else {
                    if ( mass === config.mass.TYPE.START ) {
                        context.fillStyle = config.color.start;
                    } else if ( mass === config.mass.TYPE.GOAL ) {
                        context.fillStyle = config.color.goal;
                    } else {
                        context.fillStyle = config.color.block;
                    }

                    context.fillRect(x, y, config.mass.size, config.mass.size);
                }
                // drawNumber(row+1, column);
            }
        }
    }

    function traceroute() {
        var row;    // 行
        var column; // 列

        for (row = 0; row < config.mass.length; row++) {
            for (column = 0; column < config.mass.length; column++) {
                
            }
        }
    }

    function drawNumber() {
        var row;    // 行
        var column; // 列

        for (row = 0; row < config.mass.length; row++) {
            for (column = 0; column < config.mass.length; column++) {
                var y = (row + 1) * config.mass.size;
                var x = column * config.mass.size;
                context.font = "12pt Arial";
                context.fillStyle = config.color.block;

                context.fillText("1", x, y);  
            }
        }
    }

    // キャンパスの描画を消す -------------------------------
    function clearCanvas() {
        context.clearRect(0, 0, config.canvas.width, config.canvas.height);
    }
    

    // 更新処理 --------------------------------------------
    function update() {
        clearCanvas();
        createMassView();
        drawNumber();
    }

})(window)