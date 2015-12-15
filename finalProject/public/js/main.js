/* Your code starts here */

var app = app || {};

app.main = (function() {
	console.log('Your code starts here!');

	var socket;

	var match;


	var socketSetup = function(){
		socket = io.connect();
		// socket.emit("saveClient",null);
		socket.on('welcome',function(data){
			console.log(data);
			$('#yourID').append('<h3>'+data+'</h3>');
		});
		socket.on("badName",function(){
			$("#msg").empty();
			$('#msg').append("<h3>Someone already named this name.</h3>");
		});
		socket.on("goodName",function(data){
			$("#yourName").hide();
			$("#enterPlace").show();
			$("#yourID").empty();
			$('#yourID').append("<h3>Hi "+data+"! Nice name!</br>Now you can invite your friend or give your friend your name to invite you!</h3>");
		});
		$("#NameButton").click(function(){
			var myName = $("#myName").val();
			socket.emit("saveClient",myName);
		});
	};

	var attachEvents = function(){
		//searching the friend
		$("#button").click(function(e){
			var friendName = $("#FriendID").val();
			console.log("search "+friendName);
			socket.emit("connectFriend",friendName);
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
					match = data.matchID;
					$("#go").show();
				}else{
					$("#FriendID").val("");
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
				match = data.matchID;
				//append the choose
				$('#msg').append("<h3>"+data.matchName+" want to play with you.</h3>");
				$("#go").show();
				$("#decline").show();
				// $("#msg").empty();
				// $('#msg').append('<input type="submit" id="go" value="start!">');
				// $('#msg').append('<input type="button" id="decline" value="No!">');
				
			});

		$("#go").click(function(e){
			console.log("ready");
			socket.emit("ready",match);
			$('#msg').append('Waiting for friend to ready');
			$("#enterPlace").hide();
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
		$("#enterPlace").hide();
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