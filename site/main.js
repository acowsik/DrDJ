
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
        songBuffer.workingAudio.pause();
        songBuffer.backgroundAudio.play();

        

        //this.pushAudio();

        tmp = songBuffer.workingAudio;
        songBuffer.workingAudio = songBuffer.backgroundAudio;
        songBuffer.backgroundAudio = tmp;

        tmp = songBuffer.workingTitle;
        songBuffer.workingTitle = songBuffer.backgroundTitle;
        songBuffer.backgroundTitle = tmp;

        tmp = songBuffer.workingDuration;
        songBuffer.workingDuration = songBuffer.backgroundDuration;
        songBuffer.backgroundDuration = tmp;

        tmp = songBuffer.workingSrc;
        songBuffer.workingSrc = songBuffer.backgroundSrc;
        songBuffer.backgroundSrc = tmp;

        document.title = songBuffer.workingTitle;


        songBuffer.getTitleAndURL();

        // Only call this after getting the new title just to make sure
        // that we have access to the page

        xhr = new XMLHttpRequest();
        xhr.open("POST", "/song/incrementlistencount");

        xhr.send(songBuffer.backgroundAudio.src);

        songBuffer.workingAudio.onended = songBuffer.switchAudio;
        songBuffer.workingAudio.onpaused = function(){
            if(songBuffer.workingAudio.duration - songBuffer.workingAudio.currentTime < .5){
                songBuffer.switchAudio();
            }
            };

        songBuffer.workingAudio.onerror = function(){
            console.log(songBuffer.workingAudio.error);
            songBuffer.switchAudio();
            
            };
        renewCookie();
    },


    getTitleAndURL: function(){
        xhr = new XMLHttpRequest();
        xhr.open("POST", "/title/random.txt", false);
        xhr.send(null);

        //xhr.onload = function(e){
            console.log(xhr.status);
            if(xhr.status == 401){
                window.location.replace("/login/index.html");
                return;
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


songBuffer.getTitleAndURL();
songBuffer.switchAudio();

function renewCookie(){
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
    //console.log("Cookie Renewed");
}

draw();


function switchPlay(){
    var play = document.getElementById("PlayButton");
    var pause = document.getElementById("PauseButton");

    if(!songBuffer.workingAudio.paused){
        songBuffer.workingAudio.pause();
    }else{
        songBuffer.workingAudio.play();
    }

}
