const express = require("express");
const { userInfo } = require("os");
const { emit } = require("process");
const app = express();
var http = require( "http" ).Server( app );
var io = require( "socket.io" )( http );

app.set("view engine", "ejs");
app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.get("/", (req, res) => {
    res.render("test_index");
})

// key - index
// value - socket.id
var users = {};



// key - index
// value - [index, name]
var users_data = {};

// socket.id
var users_id = [];

var user_index = 0;
io.on( "connection", function( socket ){
    var my_index;
    //broadcast
    // io.emit("welcome from server", {
    //     name: "non",
    // })

    //anycast 발신
    // socket.emit("welcome", {
    //     msg: "hello",
    // })

    // //anycast 수신
    // socket.on("welcome", (msg) => {
    //     console.log(msg)
    // });

    // 입장했을 때
    
    socket.on('enter', (nickname) => {

        console.log('---------')
        
        // 이름 설정 안할 시 ㅇㅇ으로 변경
        if (nickname.name == ''){
            nickname.name = 'ㅇㅇ'
        }
        // console.log( "Server Socket Connected - name:", nickname.name, "- id:",  socket.id );
        
        if (users_id.indexOf(socket.id) != -1){
            // 닉변
            io.emit('notice', {
                result: 2,
                new_name: nickname.name,
                old_name: users_data[nickname.user_index][1],
                user_index: nickname.user_index
            })
            
            // users[my_index] = socket.id;
            users_data[my_index] = [my_index, nickname.name];
        }else{
            // 새로 가입
            my_index = user_index;
            users_data[my_index] = [my_index, nickname.name];
            users_id.push(socket.id);   
            users[my_index] = socket.id;
            
            socket.emit('set_user_index', {
                user_index: my_index,
            })
            
            io.emit('notice', {
                result: 1,
                user: nickname.name,
                users: users_data,
                user_index: my_index,
            })
            user_index++;
        }
        
        console.log('user', users)
        console.log('user_data',  users_data)
    })

    // msg 받았을 때 뿌려주기
    socket.on('msg', (data) => {
        if (data.recv_user_index == -1){
            io.emit('recv_msg', {
                send_user_index: data.send_user_index,
                recv_user_index: data.recv_user_index,
                msg: data.msg,
            })
        }else{
            io.to(users[data.recv_user_index]).emit('direct_message', {
                send_user_index: data.send_user_index,
                msg: data.msg
            })
        }
    })

    // 퇴장 메세지
    socket.on("disconnect", () =>{
        if (my_index != undefined){
            io.emit("notice", {
                result: 0,
                user: users_data[my_index]
            })
            delete users[my_index];
            delete users_data[my_index];
            my_index = undefined;
        }
        console.log('del', users_data)
    })
});

http.listen(8000, () => {
    console.log("server open: 8000");
});