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
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (e) {
      console.warn('Could not enumerate media devices:', e);
    }
  }, [selectedDeviceId]);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
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
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }

    const targetDeviceId = deviceId || selectedDeviceId;
    const constraints: MediaStreamConstraints = {
      video: targetDeviceId
        ? { deviceId: { exact: targetDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
        : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    };

    try {
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }

      await refreshDevices();
      setIsLoading(false);
      return true;
    } catch (err: unknown) {
      setIsLoading(false);
      let errMsg = 'Failed to access camera.';
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errMsg = 'Camera permission denied. Please allow camera access in your browser settings to continue.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errMsg = 'No video camera detected on your device. Please plug in a webcam.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errMsg = 'Camera is currently in use by another application. Please close other camera apps and retry.';
        } else {
          errMsg = `Camera error: ${err.message}`;
        }
      }
      setError(errMsg);
      return false;
    }
  }, [stream, selectedDeviceId, refreshDevices]);

  const selectDevice = useCallback(async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (stream) {
      await startCamera(deviceId);
    }
  }, [stream, startCamera]);

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
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
