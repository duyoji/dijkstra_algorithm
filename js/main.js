// 設定  ------------------------------------------
var config = {};

config.fps = 60; // なめらかなアニメーションにしたい場合は30 or 60を入れる
// config.gameSpeed = 10; // デフォルト値 2,3と入れるとスピードも2,3倍する

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

config.canvas = {
    // iphone4サイズ
    width   : config.mass.size * config.mass.length,
    height  : config.mass.size * config.mass.length,
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
    var nodes       = [];

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
        createNodes();
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

        function stop(event) {
            isDrag = false;
            resetLastMass();

            checkBlockMasses();
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

    /**
     * 開始マスと終点マスのデータを取得することを想定
     * @param  {[type]} type config.mass.TYPE
     * @return {[type]}      [description]
     */
    function getMassDataWithType(type) {
        var row;    // 行
        var column; // 列
        var mass;
        var massObj = null; // {row : 0, column : 0};

        for (row = 0; row < config.mass.length; row++) {
            for (column = 0; column < config.mass.length; column++) {
                mass = masses[row][column];
                if ( mass === type ) {
                    massObj = {
                        row    : row,
                        column : column
                    };

                    break;
                }
            }

            if (massObj) break;
        }

        if (!massObj) throw new Error('error getStartMass');

        return massObj;
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

    function createNodes() {
        var row;    // 行
        var column; // 列
        var node;

        for (row = 0; row < config.mass.length; row++) {
            nodes.push( [] );
            for (column = 0; column < config.mass.length; column++) {
                node = createNode(row, column);
                nodes[row].push( node );
            }
        }
    }

    function createNode(row, column) {
        var top, right, bottom, left;
        top = right = bottom = left = null;

        if (row - 1 >= 0)                    top    = {row : row - 1, column : column};
        if (row + 1 < config.mass.length)    bottom = {row : row + 1, column : column};
        if (column - 1 >= 0 )                left   = {row : row, column : column - 1};
        if (column + 1 < config.mass.length) right  = {row : row, column : column + 1};

        var node = {
            cost   : 1,     // 全ての距離は1で固定,
            total  : null,  // 最短距離
            done   : false, // 確定フラグ
            row    : row,
            column : column,
            top    : top,
            bottom : bottom,
            left   : left,
            right  : right,
        };

        if (masses[row][column] === config.mass.TYPE.START) {
            node.done  = true;
            node.total = 0;
        }

        return node;
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
            }
        }
    }

    function checkBlockMasses () {
        var row;    // 行
        var column; // 列
        var x, y, mass;

        for (row = 0; row < config.mass.length; row++) {
            for (column = 0; column < config.mass.length; column++) {
                mass = masses[row][column];
                if ( mass === config.mass.TYPE.NON_BLOCK || mass === config.mass.TYPE.GOAL ) {
                    nodes[row][column].done = false;
                } else {
                    nodes[row][column].done = true;
                }
            }
        }

    }

    function traceroute() {
        var startMass = getMassDataWithType( config.mass.TYPE.START );
        var goalMass  = getMassDataWithType( config.mass.TYPE.GOAL );

        var currentNode = {
            row    : startMass['row'],
            column : startMass['column']
        };

        var row, column, node, top, right, bottom, left, nextNode;
        var i, n;

        while(true) {
            top = right = bottom = left = minTotal = null;
            row    = currentNode['row'];
            column = currentNode['column'];
            node   = nodes[row][column];

            // 上 ------------------------------------
            if (node.top) {
                top = nodes[ node.top.row ][node.top.column];
                if (!top.done) {
                    if (!top.total || top.total > node.total + top.cost) {
                        top.total = node.total + top.cost;
                    }
                }
            }

            // 右 ------------------------------------
            if (node.right) {
                right = nodes[ node.right.row ][node.right.column]
                if (!right.done) {
                    if (!right.total || right.total > node.total + right.cost) {
                        right.total = node.total + right.cost;
                    }
                }
            }

            // 下 ------------------------------------
            if (node.bottom) {
                bottom = nodes[ node.bottom.row ][node.bottom.column]
                if (!bottom.done) {
                    if (!bottom.total || bottom.total > node.total + bottom.cost) {
                        bottom.total = node.total + bottom.cost;
                    }
                }
            }

            // 左 ------------------------------------
            if (node.left) {
                left = nodes[ node.left.row ][node.left.column]
                if (!left.done) {
                    if (!left.total || left.total > node.total + left.cost) {
                        left.total = node.total + left.cost;
                    }
                }
            }

            nextNode = getNextNode();
            // 次の検索が無くなったら or ゴールについたら 終了 -----------------------
            if (!nextNode || ( nextNode['row'] === goalMass['row'] && nextNode['column'] === goalMass['column'] ) ) {
                break;
            }

            nextNode.done = true;
            currentNode['row']    = nextNode.row;
            currentNode['column'] = nextNode.column;
        }
    }

    function getNextNode() {
        var row;    // 行
        var column; // 列
        var mass;
        var node     = null;
        var nextNode = null;
        var minTotal = null;

        for (row = 0; row < config.mass.length; row++) {
            for (column = 0; column < config.mass.length; column++) {
                mass = masses[row][column];
                if ( mass === config.mass.TYPE.BLOCK ) {
                    continue;
                }

                node = nodes[row][column];
                if (node.done || !node.total) {
                    continue;
                }

                if (!minTotal || minTotal > node.total) {
                    minTotal = node.total;
                    nextNode = node;
                }

            }
        }

        return nextNode;
    }

    function drawNumber() {
        var row;    // 行
        var column; // 列
        var total;

        for (row = 0; row < config.mass.length; row++) {
            for (column = 0; column < config.mass.length; column++) {
                var y = (row + 1) * config.mass.size;
                var x = column * config.mass.size;
                context.font = "8pt Arial";
                context.fillStyle = config.color.block;
                total = nodes[row][column].total || 0;

                context.fillText(total, x, y);
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