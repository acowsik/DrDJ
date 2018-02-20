onmessage = function(d){
	console.log(d.data);
};


function nextSong(){
	/*cursong = window.songBuffer.workingAudio;
	if(cursong.currentTime == cursong.duration){
			window.songBuffer.switchAudio();
	}*/
	//postMessage("songCheck");
	//setTimeout(nextSong, 1100);
	
}

function resetCookie(){
    postMessage("cookie");
    setTimeout(resetCookie, 1000 * 30);
}

//nextSong();
resetCookie();