
class Shape{
	constructor(parts, x, y, scale){
		this.parts = parts;
		this.xmin = parts[0][0][0];
		this.ymin = parts[0][0][1];
		this.xmax = this.xmin;
		this.ymax = this.ymin;
		this.x = x;
		this.y = y;
		this.scale = scale;

		for(var i = 0; i < this.parts.length; i++){
			for(var j = 0; j < this.parts[i].length; j++){
				this.xmin = Math.min(this.xmin, this.parts[i][j][0]);
				this.ymin = Math.min(this.ymin, this.parts[i][j][1]);

				this.xmax = Math.max(this.xmax, this.parts[i][j][0]);
				this.ymax = Math.max(this.ymax, this.parts[i][j][1]);
			}
		}
	} 

	drawShape(context, filled=true, center=false){
		if(center){
			var dx = (this.xmin - this.xmax)*this.scale/2 + this.x;
			var dy = (this.ymin - this.ymax)*this.scale/2 + this.y;
		}else{
			var dx = this.x;
			var dy = this.y;
		}

		for(var i = 0; i < this.parts.length; i++){
			context.beginPath();

			context.moveTo(this.parts[i][0][0]*this.scale + dx, this.parts[i][0][1]*this.scale + dy);

			for(var j = 1; j < this.parts[i].length; j++){
				context.lineTo(this.parts[i][j][0]*this.scale + dx, this.parts[i][j][1]*this.scale + dy);
			}

			context.closePath();
			if(filled){
				ctx.fill();
			}
			ctx.stroke();

		}
	}

	clickedInside(mouseX, mouseY, center=true){
		if(center){
			var dx = (this.xmin - this.xmax)*this.scale/2 + this.x;
			var dy = (this.ymin - this.ymax)*this.scale/2 + this.y;
		}else{
			var dx = this.x;
			var dy = this.y;
		}

		
		/*for(var i = 0; i < this.parts.length; i++){
			var windingNumber = 0;
			var quadrant = Shape.getQuadrant(mouseX, mouseY, this.parts[i][0][0]*this.scale + dx, this.parts[i][0][1]*this.scale + dy);
			
			console.log(quadrant);

			for(var j = 1; j<this.parts[i].length; j++){
				var newQuadrant = Shape.getQuadrant(mouseX, mouseY, this.parts[i][j][0]*this.scale + dx, this.parts[i][j][1]*this.scale + dy);
				console.log(newQuadrant);

				if(quadrant == 3 && newQuadrant == 0){
					windingNumber += 1;
				}else if(quadrant == 0 && newQuadrant == 3){
					windingNumber -= 1;
				}else{
					windingNumber += newQuadrant - quadrant;
				}
				quadrant = newQuadrant;
			}

			if(windingNumber != 0){
				return true;
			}
		}

		return false;*/
		if(center){
			if(this.xmin * this.scale + dx < mouseX && 
				this.xmax * this.scale + dx > mouseX && 
				this.ymin * this.scale + dy < mouseY && 
				this.ymax * this.scale + dy > mouseY){
				return true;
			}
				return false;
			

		}else{
			if(this.xmin * this.scale < mouseX && 
				this.xmax * this.scale > mouseX && 
				this.ymin * this.scale < mouseY && 
				this.ymax * this.scale > mouseY){
				return true;
			}
				return false;
		}

	}

	setScale(scale){
		this.scale = scale;
	}

	setXY(x, y){
		this.x = x;
		this.y = y;
	}

	static getQuadrant(mouseX, mouseY, x, y){
		var dx = x - mouseX;
		var dy = y - mouseY;
		if(dx > 0 && dy > 0){
			return 0;
		}
		if(dx <= 0 && dy > 0){
			return 1;
		}

		if(dx <=0 && dy <= 0){
			return 2;
		}

		if(dx > 0 && dy <= 0){
			return 3;
		}

		return 0;
	}

}

function vote(s){
	xhr = new XMLHttpRequest();
	xhr.open("POST", "/song/vote", true);
	xhr.setRequestHeader("Content-Type", "application/json");

	xhr.send(JSON.stringify({song: songBuffer.workingSrc, vote: s}));
}

function handleMouseUp(event){
	if(!songBuffer.workingAudio.paused){
		if(play.clickedInside(event.x, event.y)){
			songBuffer.workingAudio.pause();
			
		}
	}else{
		if(pause.clickedInside(event.x, event.y)){
			songBuffer.workingAudio.play();	
			
		}
	}
	

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
					songBuffer.workingTitle = "\u2022" + songBuffer.workingTitle + "\u2022";// "~" + songBuffer.workingTitle + "~";
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
	cvs = canvas;

	cvs.width = window.innerWidth;
	cvs.height = window.innerHeight;

	ctx = cvs.getContext('2d');
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, cvs.width, cvs.height);

	ctx.fillStyle = 'rgb(255,255,255)';
	ctx.strokeStyle = 'rgb(255,255,255)';

	play.setScale(cvs.width);
	play.setXY(cvs.width/2, cvs.height*17/27);

	pause.setScale(cvs.width);
	pause.setXY(cvs.width/2, cvs.height*17/27);

	if(songBuffer.workingAudio.paused){
		play.drawShape(ctx, true, true);
	}else{
		pause.drawShape(ctx, true, true);
	}
	

	secondsElapsed = Math.floor(songBuffer.workingAudio.currentTime);
	secondsTotal = songBuffer.workingDuration;

	var timestring = getTimeString(secondsElapsed) +" | " + getTimeString(secondsTotal);
	var titlestring = songBuffer.workingTitle;

	ctx.font = "32pt Monospace";
	ctx.textAlign = "center";

	ctx.fillText(timestring, cvs.width / 2, cvs.height*2/7);

	var size = 32;

	while(size > 10 && ctx.measureText(titlestring).width > cvs.width*3/4){
		size-=2;
		ctx.font = size+"pt Monospace";
	}

	ctx.fillText(titlestring, cvs.width/2, cvs.height/5);	

	window.requestAnimationFrame(draw);
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
			jresponse = JSON.parse(xhr.responseText);
			songBuffer.backgroundTitle = jresponse.song_title;
			songBuffer.backgroundAudio.src = jresponse.song_url;
			songBuffer.backgroundSrc = jresponse.song_url;
			songBuffer.backgroundDuration = parseInt(jresponse.duration);
			songBuffer.backgroundAudio.load();
		//}
	}
};

var canvas = document.getElementById("myCanvas1");
canvas.addEventListener("mouseup", handleMouseUp);

canvas.width = window.innerWidth;
canvas.width = window.innerWidth;

var play = new Shape([ [[0,0], [.15, 0.075], [0, .15]] ], canvas.width/2, canvas.height/3*2);
var pause = new Shape([ [[0,0], [.06, 0], [.06,.12], [0, .12]], [[.09, 0], [.15, 0], [.15, .12], [.09, .12]] ])
//var pause = new Shape([])


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
                console.log("renewed cookie");
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