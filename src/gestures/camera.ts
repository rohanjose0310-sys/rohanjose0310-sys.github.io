// Webcam frame source.
//
// The video element stays on the main thread (a MediaStream can't be handed to
// a worker directly, and MediaStreamTrackProcessor is Chrome-only), so each
// frame is grabbed as an ImageBitmap and transferred across. createImageBitmap
// does the downscale for us, on the browser's own thread, which is the cheapest
// place to do it.

import { CAMERA_CONSTRAINTS } from './config'
import { handSettings } from './store'

export class CameraSource {
  readonly video: HTMLVideoElement
  private stream: MediaStream | null = null

  constructor() {
    const video = document.createElement('video')
    video.autoplay = true
    video.muted = true
    // Both required for iOS Safari to play inline instead of hijacking into a
    // fullscreen player. We don't ship hands to phones today, but an element
    // that only works on desktop is a trap for whoever revisits this.
    video.playsInline = true
    video.setAttribute('playsinline', '')
    this.video = video
  }

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS)
    this.video.srcObject = this.stream
    await this.video.play()
    // play() resolves before dimensions are known often enough to matter — a
    // 0x0 frame makes createImageBitmap throw on the very first tick.
    if (!this.video.videoWidth) {
      await new Promise<void>((resolve) => {
        this.video.addEventListener('loadedmetadata', () => resolve(), { once: true })
      })
    }
  }

  /** True once there is a decoded frame worth sending. */
  get ready(): boolean {
    return this.video.readyState >= 2 && this.video.videoWidth > 0
  }

  get aspect(): number {
    return this.video.videoWidth / this.video.videoHeight || 4 / 3
  }

  /** Grab the current frame, downscaled, ready to transfer to the worker. */
  async grab(): Promise<ImageBitmap | null> {
    if (!this.ready) return null
    const width = handSettings.inferenceWidth
    return createImageBitmap(this.video, {
      resizeWidth: width,
      resizeHeight: Math.round(width / this.aspect),
      resizeQuality: 'low',
    })
  }

  stop() {
    this.stream?.getTracks().forEach((track) => track.stop())
    this.stream = null
    this.video.srcObject = null
  }
}

/**
 * Why the camera is unavailable, in terms the overlay can show the user.
 * getUserMedia's error names are the only reliable signal here — the messages
 * differ per browser.
 */
export function describeCameraError(error: unknown): { denied: boolean; message: string } {
  const name = error instanceof DOMException ? error.name : ''
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return { denied: true, message: 'Camera permission was denied.' }
    case 'NotFoundError':
    case 'OverconstrainedError':
      return { denied: true, message: 'No camera found on this device.' }
    case 'NotReadableError':
      return { denied: true, message: 'The camera is already in use by another app.' }
    default:
      return { denied: false, message: error instanceof Error ? error.message : String(error) }
  }
}
