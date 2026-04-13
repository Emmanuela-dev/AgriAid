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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const connectButtonRef = useRef<HTMLButtonElement>(null);
  const elapsedTimerRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");

  const { client, connected, connect, disconnect, volume, clearLatestResponse } =
    useLiveAPIContext();

  // Note: removed auto-focus on connectButton to prevent stealing focus from form inputs on other pages

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--volume",
      `${Math.max(5, Math.min(inVolume * 200, 8))}px`
    );
  }, [inVolume]);

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
    if (!connected) {
      await connect();
    }

    setElapsedSeconds(0);
    finalTranscriptRef.current = "";
    onUserTranscriptChange?.("", false);

    const SpeechRecognitionCtor =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition
        : undefined;

    if (SpeechRecognitionCtor) {
      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || "en-US";

      recognition.onresult = (event: any) => {
        let interim = "";
        let finalText = finalTranscriptRef.current;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0]?.transcript || "";
          if (event.results[i].isFinal) {
            finalText = `${finalText} ${transcript}`.trim();
          } else {
            interim += transcript;
          }
        }

        finalTranscriptRef.current = finalText;
        const merged = `${finalText} ${interim}`.trim();
        onUserTranscriptChange?.(merged, false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event?.error || event);
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (error) {
        console.error("Failed to start speech recognition:", error);
      }
    }

    setIsRecording(true);
  };

  const stopRecordingAndSubmit = async () => {
    setIsRecording(false);
    audioRecorder.stop();
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.stop();
      } catch (error) {
        console.error("Failed to stop speech recognition:", error);
      }
    }

    onUserTranscriptChange?.(finalTranscriptRef.current.trim(), true);

    if (connected) {
      try {
        clearLatestResponse();
        client.send({
          text:
            "The farmer has finished speaking. Please answer in the same language as the recording.",
        });
      } catch (error) {
        console.error("Failed to submit recording:", error);
      }
    }
  };

  return (
    <section
      className={
        containerClassName ||
        `
        fixed 
        bottom-4 
        right-4
        bg-gray-900/90 
        backdrop-blur-xl 
        rounded-2xl 
        shadow-2xl 
        border 
        border-gray-800/50 
        p-4
        w-auto
        flex 
        flex-col 
        items-center 
        space-y-4
        ring-1
        ring-white/10
        z-50
      `
      }
    >
      <div className="flex flex-col items-center mb-2">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
          AgriAid
        </h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium">
          Multilingual Assistant
        </p>
      </div>
      <canvas className="hidden" ref={renderCanvasRef} />
      <nav className="flex items-center justify-center gap-4 w-full">
        <div className="flex items-center gap-2">
          <button
            className={`
              p-2 
              rounded-lg 
              transition-all 
              duration-300 
              ${
                muted
                  ? "bg-red-600/20 text-red-500 hover:bg-red-600/30"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }
            `}
            onClick={() => setMuted(!muted)}
          >
            {muted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          <div
            className="
              flex 
              items-center 
              justify-center 
              w-12 
              h-12 
              bg-gray-800 
              rounded-lg 
              transition-all 
              duration-300 
              hover:bg-gray-700
            "
          >
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

      <div className="flex flex-col items-center space-y-2">
        <button
          ref={connectButtonRef}
          className={`
            p-3 
            rounded-lg 
            transition-all 
            duration-300 
            flex 
            items-center 
            gap-2 
            ${
              connected
                ? "bg-red-600/20 text-red-500 hover:bg-red-600/30"
                : "bg-green-600/20 text-green-500 hover:bg-green-600/30"
            }
          `}
          onClick={connected ? disconnect : connect}
        >
          {connected ? <Pause size={24} /> : <Play size={24} />}
          <span className="text-sm">
            {connected ? "Pause" : "Start"} Streaming
          </span>
        </button>

        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={isRecording ? stopRecordingAndSubmit : startRecording}
            disabled={muted}
            className={`
              px-4
              py-2
              rounded-lg
              text-sm
              font-medium
              transition-all
              duration-300
              ${
                isRecording
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }
              disabled:opacity-50
              disabled:cursor-not-allowed
            `}
          >
            {isRecording ? "Stop & Submit" : "Start Recording"}
          </button>

          <span className="text-xs text-gray-400">
            {isRecording
              ? `Recording... ${formatElapsedTime(elapsedSeconds)}`
              : "Tap start recording, speak as long as needed, then submit."}
          </span>
        </div>

        <span className="text-xs text-gray-400 opacity-70">
          {connected ? "Live" : "Offline"}
        </span>
      </div>
    </section>
  );
}

export default memo(ControlTray);
