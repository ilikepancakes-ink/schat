"use client";

import React, { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { PhoneOff } from "lucide-react";

type CallMode = "audio" | "video";

type Props = {
  socket: Socket;
  chatroomId: string;
  mode: CallMode;
  role: "caller" | "callee";
  onClose: () => void;
};

export default function DMCallOverlay({ socket, chatroomId, mode, role, onClose }: Props) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<string>(role === "caller" ? "Calling..." : "Incoming...");

  // Track async setup so we can await readiness inside signal handler
  const setupPromiseRef = useRef<Promise<void> | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);

  const ensurePeerReady = async () => {
    if (!setupPromiseRef.current) {
      setupPromiseRef.current = setupPeer();
    }
    try {
      await setupPromiseRef.current;
    } catch (e) {
      console.error("Peer setup failed", e);
    }
  };

  // Start caller flow after callee accepts
  const startCallerOffer = async () => {
    await ensurePeerReady();
    if (!pcRef.current) return;
    try {
      setStatus("Connecting...");
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      socket.emit("call:signal", {
        type: "offer",
        chatroomId,
        sdp: offer,
        mode,
      });
    } catch (e) {
      console.error("Offer error", e);
    }
  };

  const setupPeer = async () => {
    // Basic public STUN
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
    });
    pcRef.current = pc;

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        socket.emit("call:signal", {
          type: "ice-candidate",
          chatroomId,
          candidate: ev.candidate,
        });
      }
    };

    pc.ontrack = (ev) => {
      const [stream] = ev.streams;
      if (remoteVideoRef.current && stream) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    // Get local media
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: mode === "video",
    };
    const local = await navigator.mediaDevices.getUserMedia(constraints);
    localStreamRef.current = local;

    local.getTracks().forEach((track) => pc.addTrack(track, local));

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = local;
      localVideoRef.current.muted = true;
      await localVideoRef.current.play().catch(() => {});
    }
  };

  const cleanup = () => {
    try {
      pcRef.current?.getSenders().forEach((s) => {
        try { s.track?.stop(); } catch {}
      });
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setupPromiseRef.current = null;
    pendingIceRef.current = [];
  };

  useEffect(() => {
    let mounted = true;

    const onSignal = async (payload: any) => {
      if (!mounted) return;
      if (payload.chatroomId !== chatroomId) return;

      switch (payload.type) {
        case "accept": {
          if (role === "caller") {
            await startCallerOffer();
          }
          break;
        }
        case "offer": {
          await ensurePeerReady();
          if (!pcRef.current) return;
          setStatus("Connecting...");
          await pcRef.current.setRemoteDescription(payload.sdp);
          // Add any buffered ICE candidates now that remote description is set
          if (pendingIceRef.current.length) {
            for (const c of pendingIceRef.current) {
              try { await pcRef.current.addIceCandidate(c); } catch {}
            }
            pendingIceRef.current = [];
          }
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          socket.emit("call:signal", { type: "answer", chatroomId, sdp: answer });
          break;
        }
        case "answer": {
          await ensurePeerReady();
          if (!pcRef.current) return;
          await pcRef.current.setRemoteDescription(payload.sdp);
          // Drain any buffered ICE candidates
          if (pendingIceRef.current.length) {
            for (const c of pendingIceRef.current) {
              try { await pcRef.current.addIceCandidate(c); } catch {}
            }
            pendingIceRef.current = [];
          }
          setStatus("Connected");
          break;
        }
        case "ice-candidate": {
          await ensurePeerReady();
          if (!pcRef.current) return;
          try {
            if (pcRef.current.remoteDescription) {
              await pcRef.current.addIceCandidate(payload.candidate);
            } else {
              // Buffer until remote description is applied
              pendingIceRef.current.push(payload.candidate);
            }
          } catch (e) {
            console.warn("ICE add failed", e);
          }
          break;
        }
        case "end": {
          setStatus("Call ended");
          cleanup();
          onClose();
          break;
        }
      }
    };

    // Register listener BEFORE starting async setup to avoid missing early signals
    socket.on("call:signal", onSignal);

    // Kick off local setup
    setupPromiseRef.current = setupPeer();
    if (role === "caller") {
      // Wait for accept; invite already sent by parent
      setStatus("Ringing...");
    } else {
      // Callee: ready to receive offer
      setStatus("Connecting...");
    }

    return () => {
      mounted = false;
      socket.off("call:signal", onSignal);
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endCall = () => {
    socket.emit("call:signal", { type: "end", chatroomId });
    cleanup();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[120]">
      <div className="bg-gray-900 text-white rounded-lg w-full max-w-3xl p-4 relative">
        <div className="absolute top-2 right-2">
          <button className="p-2 bg-red-600 rounded-lg hover:bg-red-700" onClick={endCall} title="End call">
            <PhoneOff size={18} />
          </button>
        </div>
        <div className="mb-2 text-sm text-gray-300">{mode === "video" ? "Video" : "Voice"} call • {status}</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-black rounded overflow-hidden aspect-video">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
          <div className="bg-black rounded overflow-hidden aspect-video">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </div>
  );
}

