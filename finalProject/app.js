/*---------- BASIC SETUP ----------*/
var express		= require('express'),
	bodyParser	= require('body-parser');	// helper for parsing HTTP requests
var app = express();						// our Express app
var PORT = 4000;

// Body Parser
app.use(bodyParser.urlencoded({ extended: false }));// parse application/x-www-form-urlencoded
app.use(bodyParser.json());							// parse application/json

// Express server
app.use(function(req, res, next) {
    // Setup a Cross Origin Resource sharing
    // See CORS at https://en.wikipedia.org/wiki/Cross-origin_resource_sharing
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log('incoming request from ---> ' + ip);
    var url = req.originalUrl;
    console.log('### requesting ---> ' + url);	// Show the URL user just hit by user
    next();
});

app.use('/', express.static(__dirname + '/public'));


/*-------------- socket.io --------------*/
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(PORT,function(){
    console.log("express sever is running on "+ PORT);
});

/*-------------- APP --------------*/
//everything happened inside

var clients =[];

io.on("connection",function(socket){
    console.log("client connect");
    console.log(socket.id);
    // key value pair
    //1 - a string that identifies the messafe
    //2 - message(data)
    //socket refer to ONE user
    socket.emit('welcome','Welcome! Please enter your name!');
    
    // //io.sockets refer to ALL
    // io.sockets.emit("hey-everyone","hey~ welcome "+socket.id);

    //Listeners
    socket.on("saveClient",function(data){//save the client
        console.log("saveClient from "+socket.id);
        var alreadyHave = false;
        for(var i =0;i<clients.length;i++){
            var c = clients[i];
            if(c.name==data){
                alreadyHave = true;
            }
        }
        if(!alreadyHave){
                clients.push({
                id:socket.id,
                name: data,
                ready:false,
                boxes:{},
                key: 1,
                Num:-1,
                player: null
            });
            socket.emit("goodName",data);
        }else{
            socket.emit("badName");
        }
        
        // console.log("clients "+clients[clients.length-1]);
    });

    socket.on("connectFriend",function(data){
        console.log("connectFriend from "+socket.id);
        console.log(data);

        var msg = "Not found!";
        var found = false;
        var friendID = null;
        var myName = null;
            for( var i=0, len=clients.length; i<len; ++i ){
                var c = clients[i];
                if(c.id==socket.id){
                    myName = c.name;
                }
                if(c.name == data){
                    if(c.id == socket.id){//if yourself
                        msg = "You cannot play with yourself";
                    }else{
                        msg = "Found!";
                        found = true;//if found friend
                        friendID = c.id;
                    }
                }
            }

            if(found){//send msg to friend
                io.to(friendID).emit('someOneMatch',{
                    matchID:socket.id,
                    matchName: myName
                });
            }
            //send the outcome to myself
            socket.emit('matchOutcome',{
                msg: msg,
                outcome: found,
                matchID:friendID
            });

        // if(data==socket.id){//typing your own id is not allow
        //     socket.emit('matchOutcome',{
        //         msg: "You cannot play with yourself",
        //         outcome: false
        //     });
        // }else{
        //     var msg = "Not found!";
        //     var found = false;
        //     for( var i=0, len=clients.length; i<len; ++i ){
        //         var c = clients[i];
        //         if(c.id == data){
        //             msg = "Found!";
        //             found = true;//if found friend
        //             break;
        //         }
        //     }

        //     if(found){//send msg to friend
        //         io.to(data).emit('someOneMatch',socket.id);
        //     }
        //     //send the outcome to myself
        //     socket.emit('matchOutcome',{
        //         msg: msg,
        //         outcome: found
        //     });
        // }
    });

    socket.on("ready",function(data){
        for( var i=0, len=clients.length; i<len; ++i ){
            var c = clients[i];

            //you are ready
            if(c.id == socket.id){
                c.ready = true;
            }
            //check if your friend is ready
            if(c.id == data){
                if(c.ready){
                    console.log("your friend is ready");
                    findMatch(socket.id,data,function(me,friend){
                        me.match = friend.id;
                        friend.match = me.id;
                        me.key = 1;
                        friend.key = 1;
                        me.boxes = {};
                        friend.boxes = {};

                        coinR = Math.random() * 10;
                        if(coinR>=5){
                            me.Num = 0;
                            friend.Num = 1;
                        }else{
                            me.Num = 1;
                            friend.Num = 0;
                        }

                        io.to(data).emit("goToGame");
                        socket.emit("goToGame");
                    });
                }
            }
        }
    });

    function findMatch(myID,friendID,callback){
        var c_me = null;
        var c_friend = null;

         // console.log(clients);
        // console.log("myID "+myID);
        // console.log("friendID "+friendID);
        
        for(var i=0,len = clients.length;i<len;i++){
                var c = clients[i];
                if(c.id == myID){
                    c_me = c;
                    // console.log("find myself "+ c_me.id);
                }
                if(c.id == friendID){
                    c_friend = c;
                    // console.log("find friend "+ c_friend.id);
                }
            }

        if(friendID==null){
            for(var i=0,len = clients.length;i<len;i++){
                var c = clients[i];
                if(c.id == c_me.match){
                    c_friend = c;
                    // console.log("find friend "+ c_friend.id);
                }
            }
        }
        callback(c_me,c_friend);
    };

    socket.on("playerOrder",function(){

        console.log("in player order");

        findMatch(socket.id, null,function(me,friend){
        // console.log("me "+me);
        // console.log("friend "+friend);
        var data = {
            me: me,
            friend: friend
        };
        socket.emit("myInfo",data);
        
        });
    });

    socket.on("setupPlayerInfo",function(data){
        console.log("setupPlayerInfo from "+socket.id);
        console.log(data);
        findMatch(socket.id,null,function(me,firend){
            me.boxes = data.boxes;
            me.key = data.key;
            me.Num = data.Num;
            me.player = data.player;
        }); 
    });

    socket.on("uploadKey",function(data){
        console.log("uploadKey from "+socket.id);
        console.log(data);
        findMatch(socket.id,null,function(me,friend){
            me.key = data;
            if(me.key == 6){//your turn end end
                //update the key
                friend.key = 1;
                me.key = 1;
                me.Num = 1;//you end turn Num 0->1 
                friend.Num = 0;
                //trigger your firend's turn
                io.to(friend.id).emit("yourFriendFinished");
                socket.emit("IFinished");
            }
        });  
    });

    socket.on("uploadData",function(data){
        console.log("uploadData from "+socket.id);
        // console.log(data);
        findMatch(socket.id,null,function(me,friend){
            if(data.Num==1){//if was my turn update box to 
                // console.log("Passing boxes data");
                friend.boxes = data.boxes;
                // console.log(friend.boxes);
            }
            me.boxes = data.boxes;
            me.key = data.key;
            me.Num = data.Num;
            me.player = data.player;
            // socket.emit("downloadData",{
            //     me: me,
            //     friend: friend
        //     // });
        // console.log(me);
        // console.log(clients);
        // console.log(friend);
        socket.emit("downloadData",{
            friend :friend,
            me: me
        });
        io.to(friend.id).emit("downloadData",{
                friend: me,
                me: friend
            });
        });
    });

    socket.on("end",function(data){
        console.log("end from "+socket.id);
        console.log(data);
        findMatch(socket.id,null,function(me,friend){
            io.to(friend.id).emit("ended",data);
        });
    });

    socket.on("decline",function(data){
        io.to(data).emit("rejected");
    });

    socket.on("disconnect",function(data){
        console.log(data);
        //delete the user
        for( var i=0, len=clients.length; i<len; ++i ){
                var c = clients[i];

                if(c.id == socket.id){
                    clients.splice(i,1);
                    console.log(clients);
                    break;
                }
            }
    });
});

