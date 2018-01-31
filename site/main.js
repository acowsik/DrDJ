
function vote(s){
    xhr = new XMLHttpRequest();
    xhr.open("POST", "/song/vote", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.send(JSON.stringify({song: songBuffer.workingSrc, vote: s}));
}



var rightReleased = true;
var leftReleased = true;
var upReleased = true;
var downReleased = true;

function handleonKeyDown(e){
    if(e.ctrlKey){
        switch(e.keyCode){
            case 37:
                if(leftReleased){
                    
                    leftReleased = false;
                }
            break;
            case 38:
                if(upReleased){
                    vote('upvote');
                    console.log('upvote');
                    songBuffer.workingTitle = "\u2022" + songBuffer.workingTitle + "\u2022";
                    upReleased = false;
                }
                
            break;
            case 39:
                if(rightReleased){
                    songBuffer.switchAudio();
                    rightReleased = false;
                }
                
            break;
            case 40:
                if(downReleased){
                    vote('downvote');
                    console.log('downvote');
                    songBuffer.switchAudio();
                    downReleased = false;
                }
            break;
        }
    }
}

function handleKeyUp(e){
    switch(e.keyCode){
        case 37:
            leftReleased = true;
            break;
        case 38:
            upReleased = true;
            break;
        case 39:
            rightReleased = true;
            break;
        case 40:
            downReleased = true;
            break;
    }
}

function handleKeyPress(e){
    if(e.keyCode == 32){ // space
            if(!songBuffer.workingAudio.paused){
                songBuffer.workingAudio.pause();
            }else{
                songBuffer.workingAudio.play(); 
            }
    }

}


document.onkeydown = handleonKeyDown;
document.onkeyup = handleKeyUp;
document.onkeypress = handleKeyPress;


function getTimeString(seconds){
    minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    ts = "" + minutes + ":" + (seconds < 10 ? "0" + seconds : seconds)
    return ts;
}

var stime= Date.now();
function draw(){
    secondsElapsed = Math.floor(songBuffer.workingAudio.currentTime);
    secondsTotal = songBuffer.workingDuration;

    var timestring = getTimeString(secondsElapsed) +" | " + getTimeString(secondsTotal);
    var titlestring = songBuffer.workingTitle;

    if(document.getElementById("Song_Title").innerHTML !== titlestring){
        document.getElementById("Song_Title").innerHTML = titlestring;
    }

    if(document.getElementById("Song_Time").innerHTML !== timestring){
        document.getElementById("Song_Time").innerHTML = timestring;
    }

    try{

        var play = document.getElementById("PlayButton");
        var pause = document.getElementById("PauseButton");

        if(!songBuffer.workingAudio.paused){
            if(!play.classList.contains("hidden")){
                play.classList.add("hidden");
            }

            if(pause.classList.contains("hidden")){
                pause.classList.remove("hidden");
            }
        }else{
            if(play.classList.contains("hidden")){
                play.classList.remove("hidden");
            }

            if(!pause.classList.contains("hidden")){
                pause.classList.add("hidden");
            }
        }

    }catch(e){}


    setTimeout(draw, 50);

}

var songBuffer = {
    workingAudio: document.getElementById("music1"),
    backgroundAudio: document.getElementById("music2"),
    workingTitle: "",
    backgroundTitle: "",
    workingDuration: 0,
    backgroundDuration: 0,
    workingSrc: "",
    backgroundSrc: "",
    songHistory: [],

    switchAudio: function(){
        this.workingAudio.pause();
        this.backgroundAudio.play();

        //this.pushAudio();

        tmp = this.workingAudio;
        this.workingAudio = this.backgroundAudio;
        this.backgroundAudio = tmp;

        tmp = this.workingTitle;
        this.workingTitle = this.backgroundTitle;
        this.backgroundTitle = tmp;

        tmp = this.workingDuration;
        this.workingDuration = this.backgroundDuration;
        this.backgroundDuration = tmp;

        tmp = this.workingSrc;
        this.workingSrc = this.backgroundSrc;
        this.backgroundSrc = tmp;

        document.title = this.workingTitle;


        this.getTitleAndURL();
    },

    /*pushAudio: function(){
        this.songHistory.push([this.workingTitle, this.workingDuration, this.workingSrc]);
    },

    rewindAudio: function(steps){

    },*/

    getTitleAndURL: function(){
        xhr = new XMLHttpRequest();
        xhr.open("POST", "/title/random.txt", false);
        xhr.send(null);

        //xhr.onload = function(e){
            if(xhr.status == 401){
                window.location.replace("/login/index.html");
            }
            try{
                jresponse = JSON.parse(xhr.responseText);
            }catch(e){
                console.log(xhr);
                console.log(e);
                this.getTitleAndURL();
            }
            songBuffer.backgroundTitle = jresponse.song_title;
            songBuffer.backgroundAudio.src = jresponse.song_url;
            songBuffer.backgroundSrc = jresponse.song_url;
            songBuffer.backgroundDuration = parseInt(jresponse.duration);
            songBuffer.backgroundAudio.load();
        //}
    }
};

//var canvas = document.getElementById("myCanvas1");
//canvas.addEventListener("mouseup", handleMouseUp);

//canvas.width = window.innerWidth;
//canvas.width = window.innerWidth;

// var play = new Shape([ [[0,0], [.15, 0.075], [0, .15]] ], canvas.width/2, canvas.height/3*2);
// var pause = new Shape([ [[0,0], [.06, 0], [.06,.12], [0, .12]], [[.09, 0], [.15, 0], [.15, .12], [.09, .12]] ])

songBuffer.getTitleAndURL();
songBuffer.switchAudio();

// this is a dumb hack but this js still runs without window focus
// so the songs changes if you're not on the page
var w = new Worker('worker.js');
w.onmessage = function(i){
    if(i.data === "songCheck"){
        cursong = songBuffer.workingAudio;
        if(cursong.ended){
            songBuffer.switchAudio();
        }
        

    }else if(i.data === "cookie"){
        xhr = new XMLHttpRequest();
        xhr.open("POST", "/renewcookie", true);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onload = function(e){
            if(e.status == 401){
                window.location.replace("/login/index.html");
            }else{
                //console.log("renewed cookie");
            }
        };

        xhr.send(JSON.stringify({'cookie':'renew'}));
        //console.log("renewed cookie");
    }else{
        console.log(i);
        console.log(i.data);
    }

}
draw();

/*function interpolateShapes(shape1, shape2, factor, clip = true){
    if(clip){
        factor = Math.max(Math.min(factor, 1), 0);
    }
    shape3 = [];
    for(i = 0; i < shape2.length; i++){
        t = [0, 0];
        t[0] = shape1[i][0] * (1-factor) + shape2[i][0] * factor;
        t[1] = shape1[i][1] * (1-factor) + shape2[i][1] * factor;
        shape3.push(t);
    }

    return shape3;
}*/

function switchPlay(){
    var play = document.getElementById("PlayButton");
    var pause = document.getElementById("PauseButton");

    /*var tmpPE = play.style.pointerEvents;
    var tempVis = play.style.visibility;

    play.style.pointerEvents = pause.style.pointerEvents;
    play.style.visibility = pause.style.visibility;

    pause.style.pointerEvents = tmpPE;
    pause.style.visibility = tempVis;*/

    if(!songBuffer.workingAudio.paused){
        songBuffer.workingAudio.pause();
    }else{
        songBuffer.workingAudio.play();
    }

}
