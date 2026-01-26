import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const VideoCall = () => {
    const { appointmentId } = useParams<{ appointmentId: string }>();
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [status, setStatus] = useState('Initializing...');

    const userVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        // Initialize Socket
        socketRef.current = io(SOCKET_URL);

        // Get User Media
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((currentStream) => {
                setStream(currentStream);
                if (userVideoRef.current) {
                    userVideoRef.current.srcObject = currentStream;
                }

                // Join Room after Getting Media
                setStatus('Joining Room...');
                socketRef.current?.emit('join-room', appointmentId);
            })
            .catch(err => {
                console.error("Error accessing media:", err);
                setStatus('Error accessing camera/microphone');
            });

        // Socket Events
        socketRef.current.on('user-connected', async (userId) => {
            console.log('User connected:', userId);
            setStatus('User connected. Calling...');
            createOffer();
        });

        socketRef.current.on('offer', async ({ offer }) => {
            console.log('Received Offer');
            setStatus('Incoming call...');
            await handleOffer(offer);
        });

        socketRef.current.on('answer', async ({ answer }) => {
            console.log('Received Answer');
            if (peerConnectionRef.current) {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                setStatus('Connected');
            }
        });

        socketRef.current.on('ice-candidate', async (candidate) => {
            if (peerConnectionRef.current) {
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });

        return () => {
            socketRef.current?.disconnect();
            stream?.getTracks().forEach(track => track.stop());
            peerConnectionRef.current?.close();
        };
    }, [appointmentId]);

    const createPeerConnection = () => {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }, // Free STUN server
            ]
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current?.emit('ice-candidate', {
                    roomId: appointmentId,
                    candidate: event.candidate
                });
            }
        };

        pc.ontrack = (event) => {
            console.log("Remote Stream Received");
            setRemoteStream(event.streams[0]);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        if (stream) {
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
        }

        peerConnectionRef.current = pc;
        return pc;
    };

    const createOffer = async () => {
        const pc = createPeerConnection();
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socketRef.current?.emit('offer', {
            roomId: appointmentId,
            offer
        });
    };

    const handleOffer = async (offer: RTCSessionDescriptionInit) => {
        const pc = createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketRef.current?.emit('answer', {
            roomId: appointmentId,
            answer
        });
        setStatus('Connected');
    };

    const toggleMute = () => {
        if (stream) {
            stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
            setIsMuted(!stream.getAudioTracks()[0].enabled);
        }
    };

    const toggleVideo = () => {
        if (stream) {
            stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled;
            setIsVideoOff(!stream.getVideoTracks()[0].enabled);
        }
    };

    // --- Consultation Logic ---
    const handleStartConsultation = async () => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${SOCKET_URL}/api/v1/consultations/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ appointmentId })
            });
            alert('Consultation Started & Logged');
        } catch (err) {
            console.error('Failed to start', err);
            alert('Error starting consultation');
        }
    };

    const handleEndConsultation = async () => {
        const diagnosis = prompt("Enter Diagnosis (optional):");
        if (diagnosis === null) return; // Cancelled
        const notes = prompt("Enter Internal Notes (optional):");

        try {
            const token = localStorage.getItem('token');
            await fetch(`${SOCKET_URL}/api/v1/consultations/end`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    appointmentId,
                    diagnosis: diagnosis || '',
                    notes: notes || '',
                    prescription: 'Prescription details would go here...' // Placeholder for MVP
                })
            });
            alert('Consultation Ended');
            window.close(); // Close the window
        } catch (err) {
            console.error('Failed to end', err);
            alert('Error ending consultation');
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-900 p-4">
            <div className="flex-grow relative bg-black rounded-2xl overflow-hidden flex items-center justify-center">
                {/* Remote Video (Main) */}
                {remoteStream ? (
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                ) : (
                    <div className="text-white text-center">
                        <div className="animate-pulse text-xl font-medium mb-2">{status}</div>
                        <p className="text-slate-400 text-sm">Waiting for other party to join...</p>
                    </div>
                )}

                {/* Local Video (PiP) */}
                <div className="absolute bottom-6 right-6 w-48 h-36 bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
                    <video ref={userVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`} />
                    {isVideoOff && (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                            Camera Off
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="h-20 flex items-center justify-center gap-6 mt-4">
                {/* Logic Helper: Usually strictly role based, simplified here for MVP */}
                <button
                    onClick={handleStartConsultation}
                    className="px-4 py-2 rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold text-sm"
                >
                    Start
                </button>

                <button
                    onClick={toggleMute}
                    className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                >
                    {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                </button>

                <button
                    onClick={() => window.close()}
                    className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
                >
                    <PhoneOff className="w-6 h-6 text-white" />
                </button>

                <button
                    onClick={toggleVideo}
                    className={`p-4 rounded-full transition-colors ${isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                >
                    {isVideoOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
                </button>

                <button
                    onClick={handleEndConsultation}
                    className="px-4 py-2 rounded-full bg-slate-700 hover:bg-red-900 text-white font-semibold text-sm border-2 border-red-500"
                >
                    End & Save
                </button>
            </div>

            <div className="text-center text-slate-500 text-xs mt-2">
                Secure Room ID: {appointmentId}
            </div>
        </div>
    );
};
