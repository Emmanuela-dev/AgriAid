import {
  JSX,
  memo,
  ReactNode,
  RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLiveAPIContext } from "@/context/LiveAPIContext";
import { useWebcam } from "@/hooks/use-webcam";
import { useScreenCapture } from "@/hooks/use-screen-capture";
import { UseMediaStreamResult } from "@/hooks/use-media-stream-mux";
import { AudioRecorder } from "@/lib/audio-recorder";
import AudioPulse from "../audio-pulse/AudioPulse";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Play,
  Pause,
} from "lucide-react";

export type ControlTrayProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  children?: ReactNode;
  supportsVideo: boolean;
  onVideoStreamChange?: (stream: MediaStream | null) => void;
  onUserTranscriptChange?: (text: string, isFinal: boolean) => void;
  containerClassName?: string;
};

type MediaStreamButtonProps = {
  isStreaming: boolean;
  onIcon: JSX.Element;
  offIcon: JSX.Element;
  start: () => Promise<MediaStream>;
  stop: () => void;
  className?: string;
};

const MediaStreamButton = memo(
  ({
    isStreaming,
    onIcon,
    offIcon,
    start,
    stop,
    className,
  }: MediaStreamButtonProps) => (
    <button
      className={`
      p-2 
      rounded-lg 
      transition-all 
      duration-300 
      group 
      ${
        isStreaming
          ? "bg-red-600/20 text-red-500 hover:bg-red-600/30"
          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
      }
      ${className || ""}
    `}
      onClick={isStreaming ? stop : start}
    >
      {isStreaming ? onIcon : offIcon}
    </button>
  )
);

MediaStreamButton.displayName = "MediaStreamButton";

function ControlTray({
  videoRef,
  children,
  onVideoStreamChange = () => {},
  onUserTranscriptChange,
  containerClassName,
  supportsVideo,
}: ControlTrayProps) {
  const videoStreams = [useWebcam(), useScreenCapture()];
  const [activeVideoStream, setActiveVideoStream] =
    useState<MediaStream | null>(null);
  const [webcam, screenCapture] = videoStreams;
  const [inVolume, setInVolume] = useState(0);
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const connectButtonRef = useRef<HTMLButtonElement>(null);
  const elapsedTimerRef = useRef<number | null>(null);
  const transcriptCallbackRef = useRef(onUserTranscriptChange);
  const lastTranscriptRef = useRef("");

  useEffect(() => {
    transcriptCallbackRef.current = onUserTranscriptChange;
  }, [onUserTranscriptChange]);

  const {
    client,
    connected,
    connect,
    disconnect,
    volume,
    clearLatestResponse,
    clearLatestUserTranscript,
    latestUserTranscript,
    detectedInputLanguage,
    sendTextAndGetResponse,
  } =
    useLiveAPIContext();

  // Note: removed auto-focus on connectButton to prevent stealing focus from form inputs on other pages

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--volume",
      `${Math.max(5, Math.min(inVolume * 200, 8))}px`
    );
  }, [inVolume]);

  useEffect(() => {
    if (!isRecording) return;
    if (latestUserTranscript === lastTranscriptRef.current) return;

    lastTranscriptRef.current = latestUserTranscript;
    transcriptCallbackRef.current?.(latestUserTranscript, false);
  }, [isRecording, latestUserTranscript]);

  useEffect(() => {
    if (!isRecording) {
      if (elapsedTimerRef.current) {
        window.clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
      return;
    }

    elapsedTimerRef.current = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => {
      if (elapsedTimerRef.current) {
        window.clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    };
  }, [isRecording]);

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        { mimeType: "audio/pcm;rate=16000", data: base64 },
      ]);
    };
    if (connected && isRecording && !muted && audioRecorder) {
      audioRecorder.on("data", onData).on("volume", setInVolume).start();
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.off("data", onData).off("volume", setInVolume);
    };
  }, [connected, client, muted, audioRecorder, isRecording]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = activeVideoStream;
    }
    let timeoutId = -1;

    function sendVideoFrame() {
      const video = videoRef.current;
      const canvas = renderCanvasRef.current;
      if (!video || !canvas) return;
      const ctx = canvas.getContext("2d")!;
      canvas.width = video.videoWidth * 0.25;
      canvas.height = video.videoHeight * 0.25;
      if (canvas.width + canvas.height > 0) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 1.0).split(",")[1];
        client.sendRealtimeInput([{ mimeType: "image/jpeg", data: base64 }]);
      }
      if (connected) {
        timeoutId = window.setTimeout(sendVideoFrame, 1000 / 0.5);
      }
    }
    if (connected && activeVideoStream !== null) {
      requestAnimationFrame(sendVideoFrame);
    }
    return () => clearTimeout(timeoutId);
  }, [connected, activeVideoStream, client, videoRef]);

  const changeStreams = (next?: UseMediaStreamResult) => async () => {
    if (next) {
      const mediaStream = await next.start();
      setActiveVideoStream(mediaStream);
      onVideoStreamChange(mediaStream);
      return mediaStream;
    } else {
      setActiveVideoStream(null);
      onVideoStreamChange(null);
      return Promise.resolve(null as unknown as MediaStream);
    }
  };

  const formatElapsedTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const startRecording = async () => {
    await connect();
    setElapsedSeconds(0);
    clearLatestUserTranscript();
    lastTranscriptRef.current = "";
    onUserTranscriptChange?.("", false);

    setIsRecording(true);
  };

  const stopRecordingAndSubmit = async () => {
    setIsRecording(false);
    audioRecorder.stop();

    const transcript = latestUserTranscript.trim();
    lastTranscriptRef.current = transcript;
    onUserTranscriptChange?.(transcript, true);

    if (!transcript) return;

    sendTextAndGetResponse(transcript, detectedInputLanguage);
  };

  return (
    <section className={containerClassName || `fixed bottom-4 right-4 bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-800/50 ring-1 ring-white/10 z-50 w-auto`}>
      <canvas className="hidden" ref={renderCanvasRef} />

      {/* Header - always visible */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={() => setMinimized((v) => !v)}
      >
        <div>
          <h2 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
            AgriAid
          </h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
            {isRecording ? `Recording... ${formatElapsedTime(elapsedSeconds)}` : connected ? "Live" : "Multilingual Assistant"}
          </p>
        </div>
        <span className="text-gray-400 text-lg leading-none ml-4">{minimized ? "▲" : "▼"}</span>
      </div>

      {/* Collapsible body */}
      {!minimized && (
        <div className="flex flex-col items-center space-y-4 px-4 pb-4">
          <nav className="flex items-center justify-center gap-4 w-full">
            <div className="flex items-center gap-2">
              <button
                className={`p-2 rounded-lg transition-all duration-300 ${
                  muted ? "bg-red-600/20 text-red-500 hover:bg-red-600/30" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
                onClick={() => setMuted(!muted)}
              >
                {muted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
              <div className="flex items-center justify-center w-12 h-12 bg-gray-800 rounded-lg hover:bg-gray-700">
                <AudioPulse volume={volume} active={connected} hover={false} />
              </div>
            </div>

            {supportsVideo && (
              <div className="flex items-center gap-2">
                <MediaStreamButton
                  isStreaming={screenCapture.isStreaming}
                  start={changeStreams(screenCapture)}
                  stop={changeStreams()}
                  onIcon={<MonitorOff size={24} />}
                  offIcon={<Monitor size={24} />}
                />
                <MediaStreamButton
                  isStreaming={webcam.isStreaming}
                  start={changeStreams(webcam)}
                  stop={changeStreams()}
                  onIcon={<VideoOff size={24} />}
                  offIcon={<Video size={24} />}
                />
              </div>
            )}
            {children}
          </nav>

          <div className="flex flex-col items-center space-y-2 w-full">
            <button
              ref={connectButtonRef}
              className={`p-3 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                connected ? "bg-red-600/20 text-red-500 hover:bg-red-600/30" : "bg-green-600/20 text-green-500 hover:bg-green-600/30"
              }`}
              onClick={connected ? disconnect : connect}
            >
              {connected ? <Pause size={24} /> : <Play size={24} />}
              <span className="text-sm">{connected ? "Pause" : "Start"} Streaming</span>
            </button>

            <button
              type="button"
              onClick={isRecording ? stopRecordingAndSubmit : startRecording}
              disabled={muted}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                isRecording ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isRecording ? "Stop & Submit" : "Start Recording"}
            </button>

            <span className="text-xs text-gray-400 text-center">
              {isRecording
                ? `Recording... ${formatElapsedTime(elapsedSeconds)}`
                : "Tap start recording, speak, then submit."}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

export default memo(ControlTray);
