import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import Peer from "peerjs";
import "./style.css";

const socket = io.connect("http://localhost:3001");
const peer = new Peer();

const Owner = () => {
  const [callAnswer, updateAnswer] = useState(null);
  const [myId, updateMyId] = useState(null);
  const [peerId, updatePeerId] = useState(null);
  const myVideo = useRef();
  const peerVideo = useRef();

  const addVideoStream = ({ current }, stream) => {
    current.srcObject = stream;
    current.addEventListener("loadedmetadata", () => {
      current.play();
    });
  };

  const turnOnTheVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        addVideoStream(myVideo, stream);
        peer.on("call", (call) => call.answer(stream));
        const call = peer.call(peerId, stream);
        call.on("stream", (userVideoStream) => {
          addVideoStream(peerVideo, userVideoStream);
        });
        call.on("close", () => peerVideo.remove());
      })
      .catch((err) => console.log(err));
  };
  useEffect(() => {
    socket.emit("newConnection", { roomId: "Room" });

    // store the peer id
    peer.on("open", (id) => {
      console.log("owner id", id);
      updateMyId(id);
    });

    socket.on("callDeclined", () => {
      updateAnswer("Call Declined");
    });

    socket.on("initiateTheCall", ({ id }) => {
      console.log("Recieved client id", id);
      updatePeerId(id);
      updateAnswer("Call Accepted, Now begin the vide call");
    });
  }, []);

  useEffect(() => {
    if (peerId) {
      turnOnTheVideo();
    }
  }, [peerId]);

  const makeACall = () => {
    socket.emit("startCall", { roomId: "Room", id: myId });
  };

  return (
    <div className="container">
      <button onClick={makeACall}>
        {!callAnswer && <p>Call the client</p>}
      </button>
      <p>{callAnswer && callAnswer}</p>
      <div className="my-video-container">
        <video ref={myVideo} className="my-video"></video>
        <video ref={peerVideo} className="peer-video"></video>
      </div>
    </div>
  );
};

export default Owner;
