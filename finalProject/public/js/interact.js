
//class......................................................................class

function box(myId,already,Color,position){
	this.Id = myId,
	this.already = already, 
	this.Color = Color,
	this.position = position
	this.player = [false,false];
};

function player(myName,myColor,myPostion,num){
	this.life = 5,
	this.Num = num,
	this.Name = myName,
	this.Color = myColor,
	this.position = myPostion
};


//--------------------------------------------------------------------------------

//setting..................................................................setting

var key_me = 1;
var key_friend = 1;
var boxes = {};
var playerOrder = [];
var startingBox = [1,5];
var originalSpot = startingBox;
// var isMe_player = new player("isMe_player","red",originalSpot,0);
// var isFriend_player = new player("isFriend_player","blue",originalSpot,1);
var goal = [5,1];
var isMe_player = null;
var isFriend_player= null;
var endingNow = false;
var nowPosibleMove = {};
var NextText = null;
var NextAni = null;
var endingMsg = "";
var endingMsgToFriend = "";

////////socket.io
var socket;
var isMe_socket;
var isFriend_socket;


//--------------------------------------------------------------------------------


//style relate.........................................................style relate

var unit = 15;//px
var boxWidth = unit *5;
var startTop = -unit*2 - boxWidth*2.5;
var startLeft = startTop;
var playerT = startTop;
var playerL = startLeft;

//--------------------------------------------------------------------------------

//function(main).....................................................function(main)

function game(socketL){
	socket = socketL;
	$(function(){
		$("#ending").hide();
		socketSetup();
		$(document).click(function(){
			socketUpdate_key();
			gameStage();
		});
		socket.on("yourFriendFinished",function(){
			console.log("Your friend end");
			socketDownloading();
			key_me = 1;
			socketUpdate_key();
			gameStage();
			textShow("#text","Your friend finished!", "animated pulse");
		});
		socket.on("IFinished",function(){
			console.log("I am finished");
			key_me = 1;
			isMe_socket.key = key_me;
			isMe_socket.Num = 1;
			socketUpdating();
			socketDownloading();
			// Playing();
		});
		socket.on("ended",function(data){
			$("#ending").css("color",isMe_player.Color);
			endingMsg = data.endingMsg;
			$("#ending").show();
			textShow("#ending",endingMsg, "animated bounceIn");
		});
	});
};

//--------------------------------------------------------------------------------

//function(part).....................................................function(part)

function socketUpdate_key(){
	isMe_socket.key = key_me;
	socket.emit("uploadKey",isMe_socket.key);
}

function socketDownloading(){
	socket.on("downloadData",function(data){
		console.log("download ");
		console.log(data);
		isMe_socket = data.me;
		isFriend_socket = data.friend;
		key_me = isMe_socket.key;
		key_friend = isFriend_socket.key;
		isMe_player = isMe_socket.player;
		isFriend_player = isFriend_socket.player;
		boxes = isMe_socket.boxes;
		console.log(boxes);
		ManipulateBox(2);
		ManipulateBox(3);
		// boxes = isFriend_player.boxes;;
	});

}

function socketUpdating(){
	isMe_socket.boxes = boxes;
	isMe_socket.player = isMe_player;
	// isMe_socket.key = key_me;
	socket.emit("uploadData",isMe_socket);
	
}

function socketSetup(){
	socket.emit("playerOrder");
	socket.on("myInfo",function(data){
		console.log("my info data: ");
		console.log(data);
		isMe_socket = data.me;
		isFriend_socket = data.friend;
		if(isMe_socket.Num==0){
			$('body').css("background","red");
			isMe_player = new player("isMe_player","red",originalSpot,0);
			isFriend_player = new player("isFriend_player","blue",originalSpot,1);
		}else{
			$('body').css("background","blue");
			isFriend_player = new player("isMe_player","red",originalSpot,0);
			isMe_player = new player("isFriend_player","blue",originalSpot,1);
		}
		isMe_socket.player = isMe_player;
		socket.emit("setupPlayerInfo",isMe_socket);
		startGame();
	});
	
}

function startGame(){
	//create game space
	ManipulateBox(1);//create boxes
	//show who first
	if(isMe_player.Num==0){
		textShow("#text","You go first!", "animated pulse");
	}else{
		textShow("#text","Your friend go first!", "animated pulse");
	}
	//place the starting
	placeBox(startingBox,"yellow",0);
	placeBox(startingBox,"yellow",1);
	placeBox(goal,"yellow",-1);
	ManipulateBox(2);//update
	playerPostionUpdate(-1,isMe_player);
};


function Playing(){
	console.log("key "+key_me);
	if(key_me==1){
		// $("#playground").show();
		textShow("#PlayerInfo","Life: "+isMe_player.life, NextAni);
			//if you are this turn player go to key 2 else go to key 7
		if(isMe_socket.Num==0){
			key_me=2;
			textShow("#text","Your turn", "animated pulse");
		}else{
			key_me=7;
			textShow("#text","Your friend's turn.", "animated pulse");
		}
		
	}else if(key_me==2){
			//first, player have to decide where to move
		
		textShow("#text","Click to move your character", "animated pulse");
		showPosible(isMe_player.position);
		key_me=3;
	}else if(key_me==3){
		$(".box").click(function(event){
			var thisID = $(this).attr('id');
			checkMove(thisID);
		});
	}else if(key_me==4){
		textShow("#text",NextText, NextAni);
		NextText = "Now Place a new box";
		NextAni = "animated pulse";
		textShow("#PlayerInfo","Life: "+isMe_player.life, NextAni);
		key_me=5;
	}else if(key_me==5){
			//then, player have to decide place or destroy the box
		textShow("#text",NextText, NextAni);
		$(".box").click(function(event){
			var thisID = $(this).attr('id');
			PlayerBoxMovement(thisID);
		});
	}else if(key_me==6){
		textShow("#text",NextText, NextAni);
	}else if(key_me==7){
		//not your turn
		// $("#playground").hide();a
		textShow("#text","Not your turn!", "animated pulse");
	}


};

// function whoTurn(){
// 		if(isMe_player == null || isMe_player == playerOrder[1]){
// 			isFriend_player= playerOrder[1];
// 			return playerOrder[0];
// 		}else{
// 			isFriend_player= playerOrder[0];
// 			return playerOrder[1];
// 		}
// 	};

// function changePlayer(){
// 		//change bg and unplace boxes to player's color
// 		//and show the player's position
// 		playerPostionUpdate(-1,isMe_player);
// 		ManipulateBox(3);
// 		ManipulateBox(2);
// 	};

function showPosible(origin){
		//shing the 4 nearby box til mouse click
		//except out of the border;
		//return player's click's id(which has to be box's id)
		nowPosibleMove = {};
		$("#box"+origin[0]+"_"+origin[1]).addClass("showPos");
		nowPosibleMove["me"] = "box"+origin[0]+"_"+origin[1];

		if(origin[0]+1<6){
			$("#box"+(origin[0]+1)+"_"+origin[1]).addClass("showPos");
			nowPosibleMove["down"] = "box"+(origin[0]+1)+"_"+origin[1];
		}
		if(origin[1]+1<6){
			$("#box"+origin[0]+"_"+(origin[1]+1)).addClass("showPos");
			nowPosibleMove["right"] = "box"+origin[0]+"_"+(origin[1]+1);
		}
		if(origin[0]-1>0){
			$("#box"+(origin[0]-1)+"_"+origin[1]).addClass("showPos");
			nowPosibleMove["up"] = "box"+(origin[0]-1)+"_"+origin[1];
		}
		if(origin[1]-1>0){
			$("#box"+origin[0]+"_"+(origin[1]-1)).addClass("showPos");
			nowPosibleMove["left"] = "box"+origin[0]+"_"+(origin[1]-1);
		}
		//console.log(nowPosibleMove);
	};

function checkMove(which){
		//check if the move is valid move, that is, not move to unplace box
		//if valid update player's position
		//else player lose 1 life
		var clickPos = []; 
		var validOrNot = false;
		var costOneLife = false;
		console.log("which: "+which+"isMe_player: "+isMe_player.life);
		for(pos in nowPosibleMove){
			if(which == nowPosibleMove[pos]){
				clickPos = [parseInt(which[3]),parseInt(which[5])];
				//console.log("clickPos: "+ clickPos);
				validOrNot = true;
				if(!boxes[clickPos].already){
					costOneLife = true;
				}
			}
		}
		if(validOrNot){
			//move
			if(!costOneLife){
				playerPostionUpdate(clickPos,isMe_player);
				NextText = "Valid move!";
				NextAni = "animated fadeIn";
				key_me=4;
				if(equal(isMe_player.position,goal)){
					endingMsg = "You get to the goal!\n";
					endingMsgToFriend = "Your friend got to the goal!\n";
					key_me = 10;
				}
			}else{
				console.log("--");
				isMe_player.life --;
				NextText = "Lava!!!!! Cost one life";
				NextAni = "animated shake";
				if(isMe_player.life==0){
					endingMsg = "You lose all your life!\n";
					endingMsgToFriend = "Your friend lose all their life!\n";
					key_me = 10;
				}else{
					key_me = 4;
				}
			}
			ManipulateBox(3);
		}else{
			textShow("#text","Please click valid box.", "animated shake");
		}
		$(".box").unbind("click");
		//gameStage();
	};

function PlayerBoxMovement(which){
		//player can create/destroy a box by click the box
		//any kind move should show on the text
		var clickPos = [parseInt(which[3]),parseInt(which[5])];
		console.log(which+" which.already "+boxes[clickPos].already+" key "+key_me);
		if(equal(clickPos,goal) || equal(clickPos,startingBox)){
			NextText = "You cannot place at Goal or Start! Press again";
			NextAni = "animated shake";
		}else if (equal(clickPos,isMe_player.position)){
			NextText = "You cannot destroy your own position! Press again";
			NextAni = "animated shake";
		}else{
			if(boxes[clickPos].already){
				//destroy
				console.log("Destroy!");
				NextText = "Destroy!";
				NextAni = "animated shake";
				removeBox(clickPos);
				checkSomeoneDieOrNot(isFriend_player,clickPos);
			}else{
				//place your color
				console.log("Create!");
				NextText = "Create!";
				NextAni = "animated fadeIn";
				placeBox(clickPos,isFriend_player.Color,-1);
				key_me=6;
			}
			ManipulateBox(3);
		}
		$(".box").unbind("click");
		//gameStage();
	};

function checkSomeoneDieOrNot(player,destroySpot){
		//console.log(player.position +" "+destroySpot);
		if(equal(player.position,destroySpot)){
			player.life = 0;//playerDead
			endingMsg = "You destroy enemies' place!\n";
			endingMsgToFriend = "Your place was destroyed!\n";
			key_me = 10;
		}else{
			key_me=6;
		}
	};

function ending(){
	
	if(isMe_player.life==0 || isFriend_player.life ==0 ||
	 equal(isMe_player.position,goal) ||  equal(isFriend_player.position,goal)){
		endingNow = true;
		if(isMe_player.life==0 ||  equal(isFriend_player.position,goal)){
			endingMsg += "You Lose!";
			endingMsgToFriend += "You Win!";
			$("#ending").css("color",isFriend_player.Color);
		}else{
			endingMsg += "You Win!";
			endingMsgToFriend += "You Lose!";
			$("#ending").css("color",isMe_player.Color);
		}
	}
	if(endingNow){
		//ending scene
		socket.emit("end",{
			endingMsg: endingMsgToFriend
		});
		$("#ending").show();
		textShow("#ending",endingMsg, "animated bounceIn");
	}
	console.log("ending? "+endingMsg);

};

// function Restart(){

// };

//--------------------------------------------------------------------------------


//function(tool).....................................................function(tool)

function gameStage(){
	console.log("gameStage "+key_me);
	if(key_me<8){
		Playing();
	}
	if(key_me==10){
		ending();
		$(document).unbind("click");
	}
};

function equal(place1,place2){
	//console.log(place1,place2);
	if(place1[0]==place2[0]&&place1[1]==place2[1]){
		//console.log("true");
		return true;
	}else{
		return false;
	}
}

function playerPostionUpdate(newPos,player){
	if(newPos!=-1){
		//console.log("old box: "+boxes[player.position].player[player.Num]);
		placeBox(newPos,-1,player.Num);
		boxes[player.position].player[player.Num] = false;
		player.position = newPos;
		//console.log("new box: "+boxes[player.position].player[player.Num]);
	}
	$("#token").css("margin-top",(player.position[0]-1)*6*unit+playerT);
	$("#token").css("margin-left",(player.position[1]-1)*6*unit+playerL);
	addAnimation("#token","animated zoomIn");
}

function ManipulateBox(Mode){
	for(var i=1;i<=5;i++){
		for(var j=1;j<=5;j++){
			switch(Mode){
				case 1://create
					var newBoxId = "box"+i+"_"+j;
					var newBox = new box(newBoxId,false,isMe_player.Color,[i,j]);
					boxes[[i,j]] = newBox;
					var appendContent='<div id="'+newBoxId+'" class="box"></div>';
					$("#putHere").append(appendContent);
					$("#"+newBoxId).css("background-color",newBox.Color);
					$("#"+newBoxId).css("margin-top",startTop+(i-1)*unit*5+"px");
					$("#"+newBoxId).css("margin-left",startLeft+(j-1)*unit*5+"px");
					addAnimation("#"+newBoxId,"animated zoomIn");
					startLeft += unit;
				break;
				case 2://refresh
					var nowBox = boxes[[i,j]];
					$("#"+nowBox.Id).css("background-color",nowBox.Color);
					//addAnimation("#"+nowBox.Id,"animated fadeIn");
				break;
				case 3://change to current player's color and refresh
					var nowBox = boxes[[i,j]];
					if(nowBox!=boxes[goal] && nowBox!=boxes[startingBox]){
						if(!nowBox.already || nowBox.Color !=isFriend_player.Color ){
							//filled the lava
							nowBox.Color = isMe_player.Color;
						}
					}
					$("#"+nowBox.Id).css("background-color",nowBox.Color);
					$("#"+nowBox.Id).removeClass("showPos");
					//addAnimation("#"+nowBox.Id,"animated fadeIn");
				break;
			}
			
		}
		if(Mode==1){
			startTop+=unit;
			startLeft-=unit*5;
		}
	}
}

function removeBox(thisBox){
	var GetBox = boxes[thisBox];
	GetBox.already = false;
	addAnimation("#"+GetBox.Id,"animated shake");
}

function placeBox(thisBox,color,placeWho){
	var GetBox = boxes[thisBox];
	addAnimation("#"+GetBox.Id,"animated fadeIn");
	if(color!=-1){
		GetBox.Color = color;
		GetBox.already = true;
	}
	if(placeWho>-1){
		GetBox.player[placeWho] = true;
	}
};

function addAnimation(ID,animate){
	$(ID).addClass(animate);
	$(ID).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend',
		function(){$(ID).removeClass(animate);})
}

function textShow(divHere,stringHere,ani){
	//console.log(stringHere);
	$(divHere).text(stringHere);
	addAnimation(divHere,ani);
};
