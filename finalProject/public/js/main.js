/* Your code starts here */

var app = app || {};

app.main = (function() {
	console.log('Your code starts here!');

	var socket;

	var match;


	var socketSetup = function(){
		socket = io.connect();
		socket.emit("saveClient",null);
		socket.on('welcome',function(data){
			console.log(data);
			$('#yourID').append('<h3>'+data+'</h3>');
		});
	};

	var attachEvents = function(){
		//searching the friend
		$("#button").click(function(e){
			match = $("#FriendID").val();
			console.log("search "+match);
			socket.emit("connectFriend",match);
		});
	};

	var showMatch = function(){//matching events
		//to invitor
		socket.on('matchOutcome',
			function(data){
				console.log(data);//show the outcome
				$("#msg").empty();
				$('#msg').append("<h3>"+data.msg+"</h3>");
				if(data.outcome){
					$("#go").show();
				}else{
					match = null;
				}
				
			});

		socket.on("rejected",function(){
			console.log("rejected");
			$("#msg").empty();
			$("#msg").append("You've been declined.");
			$("#go").hide();
		});

		//to friend
		socket.on('someOneMatch',
			function(data){
				match = data;
				//append the choose
				$('#msg').append("<h3>"+data+" want to play with you.</h3>");
				$("#go").show();
				$("#decline").show();
				// $("#msg").empty();
				// $('#msg').append('<input type="submit" id="go" value="start!">');
				// $('#msg').append('<input type="button" id="decline" value="No!">');
				
			});

		$("#go").click(function(e){
			console.log("ready");
			socket.emit("ready",match);
			$('#msg').append('waiting for friend to ready');
			$("#decline").hide();
			$("#go").hide();
		});

		$("#decline").click(function(e){
			console.log("no, you suck");
			socket.emit("decline",match);
			$("#decline").hide();
			$("#go").hide();
			$('#msg').empty();
		});

	}

	var startGame = function(){
			socket.on("goToGame",function(){
				console.log("goToGame");
				$("#container").hide();
				$("#game").show();
				game(socket);
			});
		};
		
	var init = function(){
		console.log('Initializing app.');
		$("#decline").hide();
		$("#go").hide();
		$("#game").hide();
		socketSetup();
		attachEvents();
		showMatch();
		startGame();
	};

	return {
		init: init
	};

})();

window.addEventListener('DOMContentLoaded', app.main.init);