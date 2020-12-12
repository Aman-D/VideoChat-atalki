import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import Peer from "peerjs";
import "./style.css";

const socket = io.connect("http://localhost:3001");
const peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: 3001,
});

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

  useEffect(() => {
    peer.on("open", (id) => {
      socket.emit("newConnection", "Room", id);
      updateMyId(id);

      socket.on("initiateTheCall", (clientId) => {
        console.log("Recieved client id", clientId);
        updatePeerId(clientId);
        updateAnswer("Call Accepted, Now begin the vide call");

        navigator.mediaDevices
          .getUserMedia({ video: true, audio: true })
          .then((stream) => {
            addVideoStream(myVideo, stream);
            peer.on("call", (call) => call.answer(stream));
            console.log(peerId);
            const call = peer.call(clientId, stream);
            call.on("stream", (userVideoStream) => {
              addVideoStream(peerVideo, userVideoStream);
            });
            call.on("close", () => peerVideo.remove());
          })
          .catch((err) => console.log(err));
      });
      socket.on("callDeclined", () => {
        updateAnswer("Call Declined");
      });
    });
  }, []);

  const makeACall = () => {
    if (myId) {
      socket.emit("startCall", { roomId: "Room", id: myId });
    }
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
