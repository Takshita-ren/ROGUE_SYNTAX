import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseWebcamReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  isLoading: boolean;
  error: string | null;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  isMirrored: boolean;
  startCamera: (deviceId?: string) => Promise<boolean>;
  stopCamera: () => void;
  toggleMirror: () => void;
  selectDevice: (deviceId: string) => Promise<void>;
  retry: () => Promise<boolean>;
}

export function useWebcam(): UseWebcamReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isMirrored, setIsMirrored] = useState<boolean>(true);

  // Enumerate video devices
  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return;
    }
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoInputs);
      // Only set selected device if it actually has a deviceId
      if (videoInputs.length > 0 && !selectedDeviceId && videoInputs[0].deviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (e) {
      console.warn('Could not enumerate media devices:', e);
    }
  }, [selectedDeviceId]);

  // Stop camera tracks cleanly using streamRef (stable function reference)
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    setStream(null);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Synchronize stream with video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('autoplay', 'true');

      const attemptPlay = () => {
        video.play().catch(err => {
          console.warn('Video auto-play prevented or interrupted:', err);
        });
      };

      if (video.readyState >= 1) {
        attemptPlay();
      } else {
        video.onloadedmetadata = () => {
          attemptPlay();
        };
      }
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  // Start camera feed
  const startCamera = useCallback(async (deviceId?: string): Promise<boolean> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Webcam access is not supported by your browser environment.');
      return false;
    }

    setIsLoading(true);
    setError(null);

    // Stop existing stream if running
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => {
        try {
          t.stop();
        } catch {}
      });
      streamRef.current = null;
    }

    // Determine target device
    const targetDeviceId = deviceId || (selectedDeviceId && selectedDeviceId.length > 5 ? selectedDeviceId : undefined);

    let newStream: MediaStream;
    try {
      if (targetDeviceId) {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: targetDeviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } else {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      }
    } catch (firstErr) {
      console.warn('Preferred camera constraints failed, attempting fallback to generic video:', firstErr);
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (err: unknown) {
        setIsLoading(false);
        let errMsg = 'Failed to access camera.';
        if (err instanceof DOMException) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            errMsg = 'Camera permission denied. Please allow camera access in your browser/macOS settings.';
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            errMsg = 'No video camera detected on your device. Please connect a webcam.';
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            errMsg = 'Camera is currently in use by another application. Please close other camera apps and retry.';
          } else {
            errMsg = `Camera error: ${err.message}`;
          }
        }
        setError(errMsg);
        return false;
      }
    }

    // Update active stream
    streamRef.current = newStream;
    setStream(newStream);

    // Re-query devices now that permission is granted (to get real labels)
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoInputs);

      // Track active device ID from stream
      const videoTrack = newStream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        if (settings.deviceId) {
          setSelectedDeviceId(settings.deviceId);
        }
      }
    } catch (e) {
      console.warn('Device enumeration error:', e);
    }

    setIsLoading(false);
    return true;
  }, [selectedDeviceId]);

  const selectDevice = useCallback(async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    await startCamera(deviceId);
  }, [startCamera]);

  const toggleMirror = useCallback(() => {
    setIsMirrored(prev => !prev);
  }, []);

  const retry = useCallback(() => {
    return startCamera();
  }, [startCamera]);

  // Clean up tracks on unmount
  useEffect(() => {
    refreshDevices();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [refreshDevices]);

  return {
    videoRef,
    stream,
    isLoading,
    error,
    devices,
    selectedDeviceId,
    isMirrored,
    startCamera,
    stopCamera,
    toggleMirror,
    selectDevice,
    retry,
  };
}
