<template>
  <div class="container">
    <h1>Liveness Detection</h1>

    <div class="video-container">
      <video ref="video" autoplay playsinline muted></video>
      <canvas ref="canvas"></canvas>
      <canvas ref="overlayCanvas" class="overlay-canvas"></canvas>

      <!-- Vizual mask: oval tashqarisini oq bilan yopadi (faqat ko'rsatish, backend'ga to'liq frame ketadi) -->
      <svg class="face-mask" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <mask id="face-cutout-mask">
            <rect width="100" height="100" fill="white"/>
            <ellipse cx="50" cy="50" rx="30" ry="42.5" fill="black"/>
          </mask>
        </defs>
        <rect width="100" height="100" fill="white" mask="url(#face-cutout-mask)"/>
      </svg>

      <!-- Face guide oval -->
      <div class="face-guide" :class="faceGuideClass">
        <svg viewBox="0 0 200 260" class="face-oval">
          <ellipse cx="100" cy="130" rx="80" ry="110" fill="none" stroke-width="3"/>
        </svg>
      </div>

      <!-- Face status indicator -->
      <div class="face-status" v-if="cameraStarted && !isRecording">
        <span class="face-status-icon">{{ faceStatusIcon }}</span>
        <span>{{ faceStatusText }}</span>
      </div>

      <div class="video-overlay" v-if="!cameraStarted">
        <div class="overlay-icon">📷</div>
        <div class="overlay-text">Kamerani yoqing</div>
      </div>
    </div>

    <div class="status" :class="statusClass">
      {{ statusMessage }}
    </div>

    <div class="challenge-box" v-if="challenge">
      <div class="challenge-type">{{ challengeLabels[challenge.challenge_type] }}</div>
      <div class="timer" v-if="isRecording">{{ recordingTime }}s</div>
    </div>

    <div class="buttons">
      <button @click="startCamera" :disabled="cameraStarted" class="btn">
        <span class="btn-icon">📷</span>
        <span>Kamera</span>
      </button>
      <button @click="getChallenge" :disabled="!cameraStarted || isRecording || !faceReady" class="btn btn-primary">
        <span class="btn-icon">🎯</span>
        <span>Challenge</span>
      </button>
      <button @click="startRecording" :disabled="!challenge || isRecording || isVerifying || !faceReady" class="btn btn-success">
        <span class="btn-icon">▶️</span>
        <span>Boshlash</span>
      </button>
    </div>

    <div class="result-box" v-if="result">
      <div class="result-header">
        <span class="result-icon" v-if="result.result?.success">✅</span>
        <span class="result-icon" v-else>❌</span>
        <span>Natija</span>
      </div>
      <div class="result-message">{{ result.result?.message }}</div>
    </div>

    <div class="logs">
      <div class="logs-header" @click="logsExpanded = !logsExpanded">
        <span>Logs</span>
        <span class="logs-toggle">{{ logsExpanded ? '▼' : '▶' }}</span>
      </div>
      <div class="logs-content" v-show="logsExpanded">
        <div class="log-item" v-for="(log, i) in logs" :key="i">{{ log }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { markRaw } from "vue"

export default {
  data() {
    return {
      cameraStarted: false,
      challenge: null,
      isRecording: false,
      isVerifying: false,
      recordingTime: 0,
      frames: [],
      result: null,
      logs: [],
      logsExpanded: false,
      statusMessage: "Kamerani yoqing",
      statusClass: "",
      // Face detection state
      faceDetected: false,
      faceInPosition: false,
      faceDistance: "unknown", // "too_close", "too_far", "good"
      faceReady: false,
      challengeLabels: {
        blink: "👁️ Ko'zingizni yuming",
        turn_left: "👈 Chapga qarang",
        turn_right: "👉 O'ngga qarang",
        nod_up: "👆 Yuqoriga qarang",
        nod_down: "👇 Pastga qarang",
        smile: "😊 Tabassum qiling",
        open_mouth: "👄 Og'zingizni oching",
        raise_eyebrows: "🤨 Qoshlaringizni ko'taring",
        wink_left: "😉 Chap ko'z bilan qising",
        wink_right: "😜 O'ng ko'z bilan qising",
        tilt_left: "↩️ Boshni chapga eging",
        tilt_right: "↪️ Boshni o'ngga eging",
      },
      // Auto-start tracking
      autoStartEnabled: true,
      faceReadyStartTime: null,
      autoStartDelay: 1500, // 1.5 soniya kutish
      autoStartTimer: null,
    }
  },

  watch: {
    faceReady(newVal, oldVal) {
      if (!this.autoStartEnabled) return

      if (newVal && !oldVal) {
        // Yuz tayyor bo'ldi - timer boshlash
        this.log("Yuz tayyor, avtomatik boshlash kutilmoqda...")
        this.faceReadyStartTime = Date.now()

        this.autoStartTimer = setTimeout(async () => {
          // Hali ham tayyor ekanligini tekshirish
          if (this.faceReady && !this.challenge && !this.isRecording && !this.isVerifying) {
            this.log("Avtomatik challenge so'ralmoqda...")
            await this.getChallenge()

            // Challenge olgandan keyin avtomatik recording
            if (this.challenge && this.faceReady) {
              this.log("Avtomatik yozish boshlanmoqda...")
              await this.startRecording()
            }
          }
        }, this.autoStartDelay)
      } else if (!newVal && oldVal) {
        // Yuz chiqib ketdi - timer bekor qilish
        if (this.autoStartTimer) {
          clearTimeout(this.autoStartTimer)
          this.autoStartTimer = null
          this.faceReadyStartTime = null
          this.log("Yuz chiqib ketdi, avtomatik boshlash bekor qilindi")
        }
      }
    }
  },

  computed: {
    faceGuideClass() {
      if (!this.cameraStarted) return ""
      if (this.isRecording) return "recording"
      if (this.faceReady) return "ready"
      if (this.faceDetected) return "detected"
      return "searching"
    },
    faceStatusIcon() {
      if (!this.faceDetected) return "🔍"
      if (this.faceDistance === "too_close") return "↔️"
      if (this.faceDistance === "too_far") return "🔎"
      if (!this.faceInPosition) return "🎯"
      return "✅"
    },
    faceStatusText() {
      if (!this.faceDetected) return "Yuzingizni ko'rsating"
      if (this.faceDistance === "too_close") return "Orqaga suring"
      if (this.faceDistance === "too_far") return "Yaqinroq keling"
      if (!this.faceInPosition) return "Oval ichiga joylashtiring"
      if (this.autoStartTimer && !this.challenge) return "Tayyor! Boshlanmoqda..."
      return "Tayyor!"
    },
  },

  methods: {
    log(message) {
      const time = new Date().toLocaleTimeString()
      this.logs.unshift(`[${time}] ${message}`)
      if (this.logs.length > 20) this.logs.pop()
    },

    async initFaceDetection() {
      if (this.faceDetector) {
        this.log("Detector allaqachon mavjud, qayta yaratilmadi")
        return
      }
      try {
        this.log("MediaPipe yuklanmoqda...")

        const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision")

        this.log("WASM yuklanmoqda...")
        const wasmFileset = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm"
        )

        this.log("Face detector yaratilmoqda...")
        let detector
        try {
          detector = await FaceDetector.createFromOptions(wasmFileset, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            minDetectionConfidence: 0.5,
          })
        } catch (gpuErr) {
          this.log("GPU ishlamadi, CPU'ga o'tilmoqda: " + gpuErr.message)
          detector = await FaceDetector.createFromOptions(wasmFileset, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            minDetectionConfidence: 0.5,
          })
        }

        // Aniq ravishda VIDEO rejimini majburlash (ba'zi versiyalarda kerak bo'ladi)
        await detector.setOptions({ runningMode: "VIDEO" })

        this.faceDetector = markRaw(detector)

        this.log("Face detector tayyor!")
        this.startFaceDetectionLoop()
      } catch (err) {
        this.log("Face detector xatosi: " + err.message)
        console.error("Face detection error:", err)
        // Fallback - enable buttons anyway
        this.faceReady = true
        this.faceDetected = true
        this.statusMessage = "Face detection o'chirilgan (fallback)"
        this.statusClass = "info"
      }
    },

    startFaceDetectionLoop() {
      const video = this.$refs.video
      const overlayCanvas = this.$refs.overlayCanvas
      let frameCount = 0
      let lastLogTime = 0

      this.log("Loop boshlandi, video readyState: " + video.readyState)

      const detectFace = () => {
        if (!this.cameraStarted || !this.faceDetector) {
          setTimeout(detectFace, 100)
          return
        }

        if (this.isRecording) {
          setTimeout(detectFace, 100)
          return
        }

        if (video.readyState < 2) {
          setTimeout(detectFace, 100)
          return
        }

        try {
          const now = performance.now()
          const detections = this.faceDetector.detectForVideo(video, now)

          frameCount++

          // Log every 2 seconds
          if (now - lastLogTime > 2000) {
            lastLogTime = now
            const faceCount = detections.detections?.length || 0
            this.log(`Yuz: ${faceCount}, Tayyor: ${this.faceReady ? 'Ha' : 'Yo\'q'}, Pos: ${this.faceInPosition ? 'Ha' : 'Yo\'q'}`)
          }

          this.processFaceDetection(detections, video, overlayCanvas)
        } catch (err) {
          this.log("Detection xatosi: " + err.message)
          console.error("Detection error:", err)
        }

        setTimeout(detectFace, 50) // 20 FPS
      }

      detectFace()
    },

    processFaceDetection(detections, video, canvas) {
      const ctx = canvas.getContext("2d")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (!detections.detections || detections.detections.length === 0) {
        this.faceDetected = false
        this.faceInPosition = false
        this.faceDistance = "unknown"
        this.faceReady = false
        return
      }

      this.faceDetected = true
      const face = detections.detections[0]
      const bbox = face.boundingBox

      // Calculate face center and size
      const faceCenterX = bbox.originX + bbox.width / 2
      const faceCenterY = bbox.originY + bbox.height / 2
      const faceWidth = bbox.width
      const faceHeight = bbox.height

      // Video dimensions
      const vw = video.videoWidth
      const vh = video.videoHeight

      // Ideal face area — visual oval is 60% width × 85% height of container
      const idealCenterX = vw / 2
      const idealCenterY = vh / 2
      const idealWidth = vw * 0.6
      const idealHeight = vh * 0.85

      // Check distance — face should fill ~40-90% of oval width
      const faceRatio = faceWidth / idealWidth
      if (faceRatio > 0.95) {
        this.faceDistance = "too_close"
      } else if (faceRatio < 0.35) {
        this.faceDistance = "too_far"
      } else {
        this.faceDistance = "good"
      }

      // Check position — face center within oval bounds (lenient)
      const dx = Math.abs(faceCenterX - idealCenterX) / (idealWidth * 0.5)
      const dy = Math.abs(faceCenterY - idealCenterY) / (idealHeight * 0.5)
      const distanceFromCenter = Math.sqrt(dx * dx + dy * dy)

      this.faceInPosition = distanceFromCenter < 1.0

      // Face is ready when in position and at good distance
      this.faceReady = this.faceInPosition && this.faceDistance === "good"

      // Debug log every 60 frames
      if (Math.random() < 0.02) {
        console.log("Face status:", {
          detected: this.faceDetected,
          inPosition: this.faceInPosition,
          distance: this.faceDistance,
          ready: this.faceReady,
          faceRatio,
          distanceFromCenter
        })
      }

      // Draw face bounding box (mirrored)
      ctx.save()
      ctx.scale(-1, 1)
      ctx.translate(-canvas.width, 0)

      ctx.strokeStyle = this.faceReady ? "#00ff88" : this.faceDetected ? "#ffaa00" : "#ff4444"
      ctx.lineWidth = 3
      ctx.strokeRect(bbox.originX, bbox.originY, bbox.width, bbox.height)

      ctx.restore()
    },

    async startCamera() {
      try {
        const constraints = {
          video: {
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            facingMode: "user",
          },
          audio: false,
        }
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        this.$refs.video.srcObject = stream
        this.cameraStarted = true
        this.statusMessage = "Yuzingizni oval ichiga joylashtiring"
        this.statusClass = "info"
        this.log("Kamera yoqildi")

        // Wait for video to be ready, or init immediately if already loaded
        const video = this.$refs.video
        if (video.readyState >= 2) {
          this.log("Video allaqachon tayyor")
          await this.initFaceDetection()
        } else {
          video.onloadeddata = async () => {
            this.log("Video tayyor")
            await this.initFaceDetection()
          }
        }
      } catch (err) {
        this.statusMessage = "Kamera xatosi"
        this.statusClass = "error"
        this.log("Kamera xatosi: " + err.message)
      }
    },

    async getChallenge() {
      try {
        this.log("Challenge so'ralyapti...")
        const res = await fetch("/api/liveness/challenge/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
        this.challenge = await res.json()
        this.result = null
        this.statusMessage = this.challengeLabels[this.challenge.challenge_type]
        this.statusClass = "info"
        this.log(`Challenge: ${this.challenge.challenge_type}`)
      } catch (err) {
        this.statusMessage = "Xatolik yuz berdi"
        this.statusClass = "error"
        this.log("Challenge xatosi: " + err.message)
      }
    },

    captureFrame() {
      const video = this.$refs.video
      const canvas = this.$refs.canvas
      const width = Math.min(video.videoWidth, 640)
      const height = Math.min(video.videoHeight, 480)
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      ctx.drawImage(video, 0, 0, width, height)
      return canvas.toDataURL("image/jpeg", 0.8)
    },

    async startRecording() {
      this.isRecording = true
      this.frames = []
      this.recordingTime = 0
      this.statusMessage = this.challengeLabels[this.challenge.challenge_type]
      this.statusClass = "recording"
      this.log("Yozish boshlandi")

      const interval = setInterval(() => {
        this.frames.push(this.captureFrame())
        this.recordingTime = (this.frames.length * 0.2).toFixed(1)
      }, 200)

      setTimeout(async () => {
        clearInterval(interval)
        this.isRecording = false
        this.log(`${this.frames.length} ta frame`)
        await this.verifyLiveness()
      }, 3000)
    },

    async verifyLiveness() {
      this.isVerifying = true
      this.statusMessage = "Tekshirilmoqda..."
      this.statusClass = "info"

      try {
        this.log("Framelar jo'natilmoqda...")
        const verifyRes = await fetch("/api/liveness/verify/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            challenge_id: this.challenge.challenge_id,
            frames: this.frames,
          }),
        })
        const verifyData = await verifyRes.json()
        this.log(`Task: ${verifyData.task_id.slice(0, 8)}...`)

        await this.pollResult(verifyData.task_id)
      } catch (err) {
        this.statusMessage = "Xatolik yuz berdi"
        this.statusClass = "error"
        this.log("Verify xatosi: " + err.message)
        this.isVerifying = false
      }
    },

    async pollResult(taskId) {
      this.log("Natija kutilmoqda...")
      let attempts = 0
      const maxAttempts = 30

      const poll = async () => {
        attempts++
        try {
          const res = await fetch(`/api/liveness/result/${taskId}/`)
          const data = await res.json()

          if (data.status === "completed" || data.status === "failed") {
            this.result = data
            this.challenge = null
            this.isVerifying = false

            if (data.result?.success) {
              this.statusMessage = "Muvaffaqiyatli!"
              this.statusClass = "success"
              this.log("MUVAFFAQIYATLI")
            } else {
              this.statusMessage = data.result?.message || "Muvaffaqiyatsiz"
              this.statusClass = "error"
              this.log("MUVAFFAQIYATSIZ")
            }

            // Natijadan keyin avtomatik yangi challenge boshlash (3 soniyadan keyin)
            if (this.autoStartEnabled) {
              setTimeout(() => {
                // faceReady watcherini qayta ishga tushirish uchun
                if (this.faceReady && !this.challenge && !this.isRecording && !this.isVerifying) {
                  this.log("Yangi challenge boshlanmoqda...")
                  this.getChallenge().then(() => {
                    if (this.challenge && this.faceReady) {
                      this.startRecording()
                    }
                  })
                }
              }, 3000)
            }
            return
          }

          if (attempts < maxAttempts) {
            setTimeout(poll, 1000)
          } else {
            this.statusMessage = "Timeout"
            this.statusClass = "error"
            this.isVerifying = false
          }
        } catch (err) {
          this.statusMessage = "Xatolik"
          this.statusClass = "error"
          this.isVerifying = false
        }
      }

      poll()
    },
  },
}
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

html, body {
  height: 100%;
  overflow-x: hidden;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #eee;
  min-height: 100vh;
  min-height: -webkit-fill-available;
}

.container {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 16px;
  padding-top: env(safe-area-inset-top, 16px);
  padding-bottom: env(safe-area-inset-bottom, 16px);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

h1 {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: #00d9ff;
}

.video-container {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  border-radius: 16px;
  overflow: hidden;
  background: #000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}

canvas {
  display: none;
}

.overlay-canvas {
  display: block;
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  transform: scaleX(-1);
}

.face-mask {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.face-guide {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.face-oval {
  width: 60%;
  height: 85%;
  stroke: rgba(255, 255, 255, 0.3);
  transition: stroke 0.3s ease;
}

.face-guide.searching .face-oval {
  stroke: rgba(255, 255, 255, 0.4);
  animation: pulse-oval 2s infinite;
}

.face-guide.detected .face-oval {
  stroke: #ffaa00;
}

.face-guide.ready .face-oval {
  stroke: #00ff88;
}

.face-guide.recording .face-oval {
  stroke: #f472b6;
  animation: pulse-oval 1s infinite;
}

@keyframes pulse-oval {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.face-status {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  padding: 8px 16px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  backdrop-filter: blur(4px);
}

.face-status-icon {
  font-size: 1.2rem;
}

.video-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
}

.overlay-icon {
  font-size: 3rem;
  margin-bottom: 8px;
}

.overlay-text {
  font-size: 1rem;
  color: #9ca3af;
}

.status {
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 16px 0;
  background: #2d2d44;
  transition: all 0.3s ease;
}

.status.success { background: linear-gradient(135deg, #065f46, #047857); color: #6ee7b7; }
.status.error { background: linear-gradient(135deg, #7f1d1d, #991b1b); color: #fca5a5; }
.status.info { background: linear-gradient(135deg, #1e3a5f, #1e40af); color: #93c5fd; }
.status.recording {
  background: linear-gradient(135deg, #701a75, #86198f);
  color: #f5d0fe;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.challenge-box {
  background: linear-gradient(135deg, #16213e, #1e3a5f);
  border: 2px solid #00d9ff;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  margin-bottom: 16px;
}

.challenge-type {
  font-size: 1.3rem;
  font-weight: 700;
  color: #00d9ff;
}

.timer {
  font-size: 3rem;
  font-weight: 700;
  color: #f472b6;
  margin-top: 8px;
  font-variant-numeric: tabular-nums;
}

.buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 14px 8px;
  border: none;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  background: #374151;
  color: #fff;
  transition: all 0.2s ease;
  touch-action: manipulation;
}

.btn-icon {
  font-size: 1.5rem;
}

.btn:active:not(:disabled) {
  transform: scale(0.95);
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #1d4ed8, #2563eb);
}

.btn-success {
  background: linear-gradient(135deg, #047857, #059669);
}

.result-box {
  background: linear-gradient(135deg, #16213e, #1e3a5f);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #00d9ff;
}

.result-icon {
  font-size: 1.5rem;
}

.result-message {
  font-size: 1rem;
  color: #9ca3af;
  word-break: break-word;
}

.logs {
  background: #0f0f1a;
  border-radius: 12px;
  overflow: hidden;
  margin-top: auto;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  user-select: none;
}

.logs-toggle {
  font-size: 0.8rem;
}

.logs-content {
  max-height: 150px;
  overflow-y: auto;
  padding: 0 16px 12px;
}

.log-item {
  font-family: "SF Mono", Monaco, "Courier New", monospace;
  font-size: 0.75rem;
  padding: 4px 0;
  border-bottom: 1px solid #1f1f2e;
  color: #6b7280;
  word-break: break-all;
}

@media (max-width: 380px) {
  .container {
    padding: 12px;
  }

  h1 {
    font-size: 1.25rem;
  }

  .status {
    font-size: 1rem;
    padding: 12px;
  }

  .challenge-type {
    font-size: 1.1rem;
  }

  .timer {
    font-size: 2.5rem;
  }

  .btn {
    padding: 12px 6px;
    font-size: 0.75rem;
  }

  .btn-icon {
    font-size: 1.25rem;
  }
}

@media (min-width: 768px) {
  .container {
    padding: 24px;
    justify-content: center;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 24px;
  }

  .video-container {
    border-radius: 20px;
  }

  .status {
    font-size: 1.25rem;
    padding: 20px;
    margin: 20px 0;
  }

  .challenge-type {
    font-size: 1.5rem;
  }

  .buttons {
    gap: 16px;
  }

  .btn {
    padding: 18px 12px;
    font-size: 1rem;
    border-radius: 14px;
  }

  .btn-icon {
    font-size: 1.75rem;
  }
}

@media (prefers-color-scheme: light) {
  body {
    background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
    color: #1a202c;
  }

  .container {
    background: transparent;
  }

  h1 {
    color: #0ea5e9;
  }

  .status {
    background: #e2e8f0;
    color: #475569;
  }

  .status.success { background: #d1fae5; color: #065f46; }
  .status.error { background: #fee2e2; color: #991b1b; }
  .status.info { background: #dbeafe; color: #1e40af; }
  .status.recording { background: #fae8ff; color: #86198f; }

  .challenge-box {
    background: #fff;
    border-color: #0ea5e9;
  }

  .challenge-type {
    color: #0ea5e9;
  }

  .btn {
    background: #64748b;
  }

  .btn-primary {
    background: linear-gradient(135deg, #2563eb, #3b82f6);
  }

  .btn-success {
    background: linear-gradient(135deg, #059669, #10b981);
  }

  .result-box {
    background: #fff;
  }

  .result-header {
    color: #0ea5e9;
  }

  .logs {
    background: #f1f5f9;
  }

  .logs-header {
    color: #64748b;
  }

  .log-item {
    border-color: #e2e8f0;
    color: #64748b;
  }
}

@supports (padding: max(0px)) {
  .container {
    padding-left: max(16px, env(safe-area-inset-left));
    padding-right: max(16px, env(safe-area-inset-right));
  }
}
</style>
