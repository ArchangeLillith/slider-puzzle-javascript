console.log('java loaded');
let VIDEO = null;
let CANVAS = null;
let CONTEXT = null;
let SCALER = 0.6;
let SIZE = {x:0,y:0,width:0, height:0, rows:3, columns:3};
let PIECES = [];
let SELECTED_PIECE = null;
let START_TIME = null;
let END_TIME = null;

function main() {
    console.log('main running');
    CANVAS = document.getElementById('myCanvas');
    CONTEXT = CANVAS.getContext("2d");
    addEventListeners();

//Video handler
    let promise = navigator.mediaDevices.getUserMedia({
        video:true
    });
    promise.then(function(signal) {
        VIDEO = document.createElement("video");
        VIDEO.srcObject = signal;
        VIDEO.play();
        console.log('video playing')

        VIDEO.onloadeddata = function(){
            handleResize();
            initializePieces(SIZE.rows, SIZE.columns);
            updateGame();
            console.log('resized complete')
        }
    }).catch(function(err) {
        alert("Camera Error: "+err);
    });
}

function setDifficulty() {
    let diff = document.getElementById('difficulty').value;
    switch(diff) {
        case "easy":
            initializePieces(3,3);
            break;
        case "medium":
            initializePieces(5,5);
            break;
        case "hard":
            initializePieces(10,10);
            break;
        case "insane":
            initializePieces(40,25);
            break;
    }
    
}

//refreshes the time and randomizes pieces
function restart() {
    START_TIME = new Date().getTime();
    END_TIME = null;
    randomizePieces();
}

//
function updateTime(){
    let now = new Date().getTime();
    if(START_TIME != null) {
        if(END_TIME != null) {
            document.getElementById('time').innerHTML = formatTime(END_TIME - START_TIME);
        }
        else{
            document.getElementById('time').innerHTML = formatTime(now - START_TIME);
        }
    }
}

//LOOP to see if all pieves are in the correct spot
function isComplete() {
    for(let i = 0;i < PIECES.length;i++) {
        if(PIECES[i].correct == false) {
            return false;
        }
    }
    return true;
}

function formatTime(milliseconds) {
    let seconds = Math.floor(milliseconds/1000);
    let s = Math.floor(seconds % 60);
    let m = Math.floor((seconds % (60*60))/60);
    let h = Math.floor((seconds % (60*60*24))/(60*60));

    let formattedTime = h.toString().padStart(2,'0');
    formattedTime += ":";
    formattedTime += m.toString().padStart(2,'0');
    formattedTime += ":";
    formattedTime += s.toString().padStart(2,'0');

    return formattedTime;
}

function addEventListeners() {
    console.log('mouse event listeners enabled')
    CANVAS.addEventListener("mousedown", onMouseDown);
    CANVAS.addEventListener("mousemove", onMouseMove);
    CANVAS.addEventListener("mouseup", onMouseUp);
}

function onMouseDown(evt) {
    console.log('mousedown')
    SELECTED_PIECE = getPressedPiece(evt);
    if(SELECTED_PIECE != null) {
        const index = PIECES.indexOf(SELECTED_PIECE);
        if(index > -1) {
            PIECES.splice(index, 1);
            PIECES.push(SELECTED_PIECE);
        }
        SELECTED_PIECE.offset = {
            x:evt.x-SELECTED_PIECE.x,
            y:evt.y-SELECTED_PIECE.y
        }
        SELECTED_PIECE.correct = false;
    }
}

//changing coords for the piece while it's being dragged
function onMouseMove(evt) {
    console.log('mouse move')
    if(SELECTED_PIECE != null) {
        SELECTED_PIECE.x = evt.x - SELECTED_PIECE.offset.x;
        SELECTED_PIECE.y = evt.y - SELECTED_PIECE.offset.y;
    }
}

//seeing if the piece is close and if it's within the defined radius it snaps in place
function onMouseUp(evt) {
    if(SELECTED_PIECE.isClose()) {
        SELECTED_PIECE.snap();
        if(isComplete() && END_TIME == null){
            let now = new Date().getTime();
            END_TIME = now;
        }
    }
    SELECTED_PIECE = null;
}

//check to see if piece is in the area user clicked
function getPressedPiece(loc){
    console.log('getPressedPiece initiated')
    //iterates over array backwards
    for(let i=PIECES.length-1; i >= 0; i--) {
        console.log('for loop running')
        if(loc.x > PIECES[i].x && 
           loc.x < PIECES[i].x + PIECES[i].width && 
           loc.y > PIECES[i].y && 
           loc.y < PIECES[i].y + PIECES[i].height){
            console.log('piece selected and logged');
            return PIECES[i];
        }
    }
    return null;
}


function handleResize(){
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;

    let resizer = SCALER*
        Math.min(
            window.innerWidth/VIDEO.videoWidth,
            window.innerHeight/VIDEO.videoHeight
        );
        SIZE.width = resizer*VIDEO.videoWidth;
        SIZE.height = resizer*VIDEO.videoHeight;
        SIZE.x = window.innerWidth/2-SIZE.width/2;
        SIZE.y = window.innerHeight/2-SIZE.height/2;
        window.addEventListener('resize', handleResize);
}

//main game loop
function updateGame(){
    CONTEXT.clearRect(0,0,CANVAS.width,CANVAS.height);

    CONTEXT.globalAlpha = 0.5;
    CONTEXT.drawImage(VIDEO,
        SIZE.x, SIZE.y,
        SIZE.width, SIZE.height);
    CONTEXT.globalAlpha = 1;

    for(let i=0; i<PIECES.length;i++) {
        PIECES[i].draw(CONTEXT);
    }

    updateTime();
    window.requestAnimationFrame(updateGame);
    // console.log('refreshing frames, video running')
}

function initializePieces(rows,cols) {
    console.log('piece initializer engaged');
    SIZE.rows = rows;
    SIZE.columns = cols;
    // starting with an empty array
    PIECES = [];
    // assigning a count variable for the rows (i), then iterating over each piece with this variable and adding to the count to log where it is. 
    for(let i=0; i<SIZE.rows;i++) {
        //assigning the variable (j) to columns and doing the same thing, which will output a set of coordinates (i,j) to the function to tell the computer where pieces are. This is modular, and why we can change it form a 3x3 to whatever we want, because the variables will stop when they're over the size of the number of rows/columns. We use over, not exqual to, because if we did we'd be missing a final piece
        for(let j=0; j<SIZE.columns; j++) {
            //Pushing to the array now, filling the predefined empty array. 
            PIECES.push(new Piece(i,j));
            console.log('pieces initialized');
        }
    }

}

//randomizing the location of the pieces 
function randomizePieces() {
    console.log('randomize pieces engaged');
    for(let i = 0; i<PIECES.length; i++){
        let loc = {
            x:Math.random()*(CANVAS.width-PIECES[i].width),
            y:Math.random()*(CANVAS.height-PIECES[i].height)
        }
        PIECES[i].x = loc.x;
        PIECES[i].y = loc.y;
        PIECES[i].correct = false;
        console.log('randomize pieces complete');
        }
}

class Piece {
    constructor(rowIndex, colIndex) {
        console.log('piece draw engaged');
        this.rowIndex = rowIndex;
        this.colIndex = colIndex;
        this.x = SIZE.x + SIZE.width * this.colIndex/SIZE.columns;
        this.y = SIZE.y + SIZE.height * this.rowIndex/SIZE.rows;
        this.width = SIZE.width/SIZE.columns;
        this.height = SIZE.height/SIZE.rows;
        this.xCorrect = this.x;
        this.yCorrect = this.y;

        console.log('piece draw complete');
        //instead of defining this.x and this.y up above, you can also do the following:
        //this.x = SIZE.x+this.width*this.colIndex;
        //this.y = SIZE.y+this.height*this.rowIndex;
        //however this has to come after the width and height are defined
    }
    draw(context){
        // console.log('draw engaged'); WILL CONTINUE TO UPDATE
        context.beginPath();
        context.drawImage(VIDEO,
            this.colIndex*VIDEO.videoWidth/SIZE.columns,
            this.rowIndex*VIDEO.videoHeight/SIZE.rows,
            VIDEO.videoWidth/SIZE.columns,
            VIDEO.videoHeight/SIZE.rows,
            this.x,
            this.y,
            this.width,
            this.height);
        context.rect(this.x,this.y,this.width,this.height);
        context.stroke();
        // console.log('draw completed'); WILL CONTINUE TO UPDATE
    }
    isClose() {
        if(distance({x:this.x,y:this.y},
            {x:this.xCorrect,y:this.yCorrect}) < this.width/4) {
                return true;
            }
        return false;
    }
    snap() {
        this.x = this.xCorrect;
        this.y = this.yCorrect;
        this.correct = true;
    }
}

function distance(p1,p2) {
    return Math.sqrt(
        (p1.x-p2.x)*(p1.x-p2.x)+
        (p1.y-p2.y)*(p1.y-p2.y));
    }