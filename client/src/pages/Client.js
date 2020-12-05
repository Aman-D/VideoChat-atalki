import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import Peer from "peerjs";

const socket = io.connect("http://localhost:3001");
const peer = new Peer();

const Client = () => {
  const [newCall, updateNewCall] = useState(false);
  const [call, answerTheCall] = useState("onHold");
  const [peerId, updatePeerId] = useState(null);
  const [myId, updateMyId] = useState(null);
  const myVideo = useRef();
  const peerVideo = useRef();

  const addVideoStream = ({ current }, stream) => {
    current.srcObject = stream;
    current.addEventListener("loadedmetadata", () => {
      current.play();
    });
  };

  const connectUser = (stream) => {
    console.log(stream);
    console.log("client id", myId);
    console.log("owner id", peerId);
    peer.on("call", (call) => {
      console.log(call);
      call.answer(stream);
    });
    const call = peer.call(peerId, stream);
    call.on("stream", (userVideoStream) =>
      addVideoStream(peerVideo, userVideoStream)
    );
    call.on("close", () => {
      peerVideo.current.remove();
    });
  };

  useEffect(() => {
    socket.emit("newConnection", { roomId: "Room" });

    socket.on("call", ({ id }) => {
      updateNewCall(true);
      updatePeerId(id);
      console.log("Recieved Owner id", id);
    });

    // store the peer id
    peer.on("open", (id) => {
      console.log("Client id", id);
      updateMyId(id);
    });

    peer.on("call", (call) => {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          addVideoStream(myVideo, stream);
          call.answer(stream);
          call.on("stream", (userVideoStream) => {
            addVideoStream(peerVideo, userVideoStream);
          });
          call.on("close", () => peerVideo.remove());
        })
        .catch((err) => console.log(err));
    });
  }, []);

  useEffect(() => {
    if (call !== "onHold") {
      socket.emit(call, { roomId: "Room", id: myId });
    }
  }, [call]);

  return (
    <div>
      {newCall && (
        <div>
          {call === "onHold" && (
            <>
              <button onClick={() => answerTheCall("callAccepted")}>
                Accept
              </button>

              <button onClick={() => answerTheCall("callRejected")}>
                Reject
              </button>
            </>
          )}
        </div>
      )}
      <video ref={myVideo}></video>
      <video ref={peerVideo}></video>
    </div>
  );
};

export default Client;
