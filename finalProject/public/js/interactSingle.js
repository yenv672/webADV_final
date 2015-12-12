
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

var Key = 1;
var boxes = {};
var playerOrder = [];
var startingBox = [1,5];
var originalSpot = startingBox;
var player1 = new player("player1","red",originalSpot,0);
var player2 = new player("player2","blue",originalSpot,1);
var goal = [5,1];
var thisTurnPlayer = null;
var notThisTurnPlayer = null;
var endingNow = false;
var nowPosibleMove = {};
var NextText = null;
var NextAni = null;
var endingMsg = "";

//--------------------------------------------------------------------------------

//Linking...................................................................Linking
// var nameOfTheClass;
// var GameClass;
// var CreateOBJ;
// var readOBJ;
//--------------------------------------------------------------------------------

//style relate.........................................................style relate

var unit = 15;//px
var startTop = 8*unit;
var startLeft = 24*unit;
var playerT = startTop;
var playerL = startLeft;

//--------------------------------------------------------------------------------

//function(main).....................................................function(main)

function game(){
	$(function(){
		$("#ending").hide();
		startGame();
		$(document).click(function(){
			gameStage();
		});
	});
};

//--------------------------------------------------------------------------------

//function(part).....................................................function(part)

function startGame(){
	//create game space
	ManipulateBox(1);//create boxes
	//decide who first
	playerOrder = whoFirst();
	textShow("#text",playerOrder[0].Name+" go first!", "animated pulse");
	//place the starting
	placeBox(startingBox,"yellow",0);
	placeBox(startingBox,"yellow",1);
	placeBox(goal,"yellow",-1);
	ManipulateBox(2);//update
	//Local function~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

	function whoFirst(){
		var coin = Math.floor(Math.random()*100%2);
		if (coin == 0){
			return [player1,player2];
		}else{
			return [player2,player1];
		}
	};
};


function Playing(){
	console.log("key "+Key);
	if(Key==1){
			//take turn
		thisTurnPlayer = whoTurn();
		changePlayer();
		textShow("#text","It's "+thisTurnPlayer.Name+" turn.", "animated pulse");
		textShow("#PlayerInfo","Life: "+thisTurnPlayer.life, "animated pulse");
		Key=2;
	}else if(Key==2){
			//first, player have to decide where to move
		textShow("#text","Click to move your character", "animated pulse");
		showPosible(thisTurnPlayer.position);
		Key=3;
	}else if(Key==3){
		$(".box").click(function(event){
			var thisID = $(this).attr('id');
			checkMove(thisID);
		});
	}else if(Key==4){
		textShow("#text",NextText, NextAni);
		NextText = "Now Place a new box";
		NextAni = "animated pulse";
		textShow("#PlayerInfo","Life: "+thisTurnPlayer.life, NextAni);
		Key=5;
	}else if(Key==5){
			//then, player have to decide place or destroy the box
		textShow("#text",NextText, NextAni);
		$(".box").click(function(event){
			var thisID = $(this).attr('id');
			PlayerBoxMovement(thisID);
		});
	}else if(Key==6){
		textShow("#text",NextText, NextAni);
		Key=1;
	}



	//Local function~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	function whoTurn(){
		if(thisTurnPlayer == null || thisTurnPlayer == playerOrder[1]){
			notThisTurnPlayer = playerOrder[1];
			return playerOrder[0];
		}else{
			notThisTurnPlayer = playerOrder[0];
			return playerOrder[1];
		}
	};

	function changePlayer(){
		//change bg and unplace boxes to player's color
		//and show the player's position
		playerPostionUpdate(-1,thisTurnPlayer);
		ManipulateBox(3);
		ManipulateBox(2);
	};

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
		console.log("which: "+which+"thisTurnPlayer: "+thisTurnPlayer.life);
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
				playerPostionUpdate(clickPos,thisTurnPlayer);
				NextText = "Valid move!";
				NextAni = "animated fadeIn";
				Key=4;
				if(equal(thisTurnPlayer.position,goal)){
					endingMsg = "You get to the goal!\n";
					Key = 10;
				}
			}else{
				console.log("--");
				thisTurnPlayer.life --;
				NextText = "Lava!!!!! Cost one life";
				NextAni = "animated shake";
				if(thisTurnPlayer.life==0){
					endingMsg = "You lose all your life!\n";
					Key = 10;
				}else{
					Key = 4;
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
		console.log(which+" which.already "+boxes[clickPos].already+" key "+Key);
		if(equal(clickPos,goal) || equal(clickPos,startingBox)){
			NextText = "You cannot place at Goal or Start! Press again";
			NextAni = "animated shake";
		}else if (equal(clickPos,thisTurnPlayer.position)){
			NextText = "You cannot destroy your own position! Press again";
			NextAni = "animated shake";
		}else{
			if(boxes[clickPos].already){
				//destroy
				console.log("Destroy!");
				NextText = "Destroy!";
				NextAni = "animated shake";
				removeBox(clickPos);
				checkSomeoneDieOrNot(notThisTurnPlayer,clickPos);
			}else{
				//place your color
				console.log("Create!");
				NextText = "Create!";
				NextAni = "animated fadeIn";
				placeBox(clickPos,notThisTurnPlayer.Color,-1);
				Key=6;
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
			endingMsg = "You destroy enemies' place!\n"
			Key = 10;
		}else{
			Key=6;
		}
	};
};

function ending(){
	
	if(player1.life==0 || player2.life ==0 ||
	 equal(player1.position,goal) ||  equal(player2.position,goal)){
		endingNow = true;
		if(player1.life==0 ||  equal(player2.position,goal)){
			endingMsg += "player2 win";
			$("#ending").css("color",player2.Color);
		}else{
			endingMsg += "player1 win";
			$("#ending").css("color",player1.Color);
		}
	}
	if(endingNow){
		//ending scene
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
	if(Key<7){
		Playing();
	}
	if(Key==10){
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
	$("#token").css("top",(player.position[0]-1)*6*unit+playerT);
	$("#token").css("left",(player.position[1]-1)*6*unit+playerL);
	addAnimation("#token","animated zoomIn");
}

function ManipulateBox(Mode){
	for(var i=1;i<=5;i++){
		for(var j=1;j<=5;j++){
			switch(Mode){
				case 1://create
					var newBoxId = "box"+i+"_"+j;
					var newBox = new box(newBoxId,false,"green",[i,j]);
					boxes[[i,j]] = newBox;
					var appendContent='<div id="'+newBoxId+'" class="box"></div>';
					$("#putHere").append(appendContent);
					$("#"+newBoxId).css("background-color",newBox.Color);
					$("#"+newBoxId).css("top",startTop+(i-1)*unit*5+"px");
					$("#"+newBoxId).css("left",startLeft+(j-1)*unit*5+"px");
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
						if(!nowBox.already || nowBox.Color !=notThisTurnPlayer.Color ){
							//filled the lava
							nowBox.Color = thisTurnPlayer.Color;
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
