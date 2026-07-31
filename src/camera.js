/**
 * Camera Stream Manager
 * Manages webcam user media stream, video playback, mirror formatting, and state.
 */

export class CameraManager {
  constructor(videoElement) {
    this.video = videoElement;
    this.stream = null;
    this.isReady = false;
  }

  /**
   * Request webcam stream and start video playback
   */
  async start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Webcam mediaDevices API is not supported in this browser.');
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      this.video.srcObject = this.stream;

      return new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.video.play();
          this.isReady = true;
          resolve(true);
        };
      });
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      throw err;
    }
  }

  /**
   * Stop video stream
   */
  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.isReady = false;
  }
}
