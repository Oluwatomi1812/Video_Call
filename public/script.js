const socket = io('/')
const videoGrid = document.getElementById("video-grid")
const chatInputBox = document.getElementById("chat_message")
const all_messages = document.getElementById("all_messages")
const leave_meeting = document.getElementById("leave_meeting")
const main_chat_window = document.getElementById("main_chat_window")
const myVideo = document.createElement("video")
let arr = []
myVideo.muted = true;
const myPeer = new Peer(undefined, {
    host: "/",
    port: "3001"
})
let myVideoStream;
const peers = {}
let pendingMsg = 0;
let currentUserId;

navigator.mediaDevices.getUserMedia({
    video : true,
    audio: true
}).then(stream =>{
    myVideoStream = stream
    addVideoStream(myVideo, stream)

    myPeer.on("call", call =>{
        call.answer(stream)
        const video = document.createElement("video")
        
        call.on("stream", (userVideoStream) =>{
        addVideoStream(video, userVideoStream)
        })
    })
    socket.on('user-connected', userId =>{
        connectToNewUser(userId, stream)
        })
    socket.on('user-disconnected', userId =>{
        if(peers[userId]) peers[userId].close()
    })

    document.addEventListener("keydown",(e) => {
        if(e.which ===13 ){
            socket.emit("messages", {
                msg: chatInputBox.value,
                user: currentUserId
            })
            chatInputBox.value = ""
        }
    })
    document.getElementById("sendMsg").addEventListener("click", () =>{
        if(chatInputBox.value != "") {
             socket.emit("message", {
                msg: chatInputBox.value,
                user: currentUserId
            })
            chatInputBox.value = ""
        }
    })
    socket.on("createMessage", (message) =>{
        console.log(message)
        let li = document.createElement("li")
        if(message.user === currentUserId){
            li.innerHTML = `<div><b>Me :</b>${message.msg}</div>`
            console.log(`${message.msg}`)
        }
        else{
            li.classList.add("otherUser")
            li.innerHTML = `<div><b>User<small>${message.user}</small>:</b>${message.msg}</div>`
        }
        all_messages.append(li)
        main_chat_window.scrollTop = main_chat_window.scrollHeight
        if(message.user != currentUserId){
            pendingMsg++
            document.getElementById("chat_Btn").classList.add("has_new")
            document.getElementById("chat_Btn").innerHTML = `Chat (${pendingMsg})`
        }
    })
})
myPeer.on('open', id =>{
    socket.emit('join-room', ROOM_ID, id)
})

socket.on("disconnect", () =>{
    socket.emit("leave-room", ROOM_ID, currentUserId)
})
function connectToNewUser(userId, stream){
    const call = myPeer.call(userId, stream)
    const video = document.createElement("video")
    call.on("stream", userVideoStream =>{
        addVideoStream(video, userVideoStream)
    })
    call.on("close", ()=>{
        video.remove()
    })
    peers[userId] = call
}

function playStop(){
    let enabled = myVideoStream.getVideoTracks()[0].enabled
    if (enabled){
        setStopVideo();
        myVideoStream.getVideoTracks()[0].enabled = false;
    }
    else{
        setPlayVideo();   
        myVideoStream.getVideoTracks()[0].enabled = true
    }
}

function muteUnmute(){
    let enabled = myVideoStream.getAudioTracks()[0].enabled
    if (enabled){
        setMuteButton();
        myVideoStream.getAudioTracks()[0].enabled = false;
    }
    else{
        setUnmuteButton();   
        myVideoStream.getAudioTracks()[0].enabled = true;
    }

}


function addVideoStream(video, stream){
    video.srcObject = stream
    video.addEventListener("loadedmetadata", () => {
        video.play()
        
    })
    videoGrid.append(video)
    let totalUsers = document.getElementsByTagName('video').length
    if (totalUsers > 1){
        for(let i = 0; i++< totalUsers; i++)
        document .getElementsByTagName('video')[i].style.width = 100/ totalUsers + "%"
    }
}

//Functionalities of the Buttons
const showChat = (e) => {
    e.classList.toggle("active");
    document.body.classList.toggle("showChat");
}

const setStopVideo = () =>{
    document.getElementById("playPauseVideo").innerHTML = `<div class="main_controls_button"><i class="fa fa-video-camera"></i><span>Pause Video</span></div>`
    document.getElementById("playPauseVideo").style.padding = "0px"
}

const setPlayVideo = () =>{
    document.getElementById("playPauseVideo").innerHTML = `<div class="main_controls_button"><i class="fa fa-video-camera"></i><span>Pause Video</span></div`
    document.getElementById("playPauseVideo").style.padding = "0px"
}

const setUnmuteButton= ()=>{
    document.getElementById('muteButton').innerHTML = `<div class="main_controls_button"><i class = "fa fa-microphone"></i><span class="unmute">Unmuted</span></div>`
    document.getElementById("muteButton").style.padding = "0px"
}

const setMuteButton = ()=>{
    document.getElementById('muteButton').innerHTML = `<div class="main_controls_button"><i class = "fa fa-microphone-slash"></i><span>Muted</span></div>`
    document.getElementById("muteButton").style.padding = "0px"
}

const popUp = (e) => {
    const inviteButton = document.getElementById("invite");
    const popUp = document.getElementById("invitePopup");
      if (popUp.style.display === "block") {
        popUp.style.display = "none";
      } else {
        popUp.style.display = "block";
      };
    document.getElementById("roomLink").value = window.location.href;
    
    }

const copyToClipboard = () =>{
    const copyText = document.getElementById("roomLink")
    copyText.select()
    copyText.setSelectionRange(0, 99999);
    document.execCommand("copy");
    hideInvitePopup()
}