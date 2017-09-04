function redirect(){
	window.location.href = "/index.html";

}

$("#login-button").click(function(event){
	event.preventDefault();
	 
	xhr = new XMLHttpRequest();

	xhr.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			if(this.responseText == "Good Response"){
				$('form').fadeOut(500);
				$('.wrapper').addClass('form-success');
				setTimeout(redirect, 500);
			}else{
                $("#inputBoxes").effect("shake", {distance:10});
            }
		}
	};

	xhr.open("POST", "/login/login", true);
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.send("username="+document.getElementById('usernameform').value+ 
		"&password=" + document.getElementById('passwordform').value);

	
});

