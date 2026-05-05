<template>
  <div class="app">
    <transition name="fade" mode="out-in">
      <!-- ============== INSTRUCTIONS ============== -->
      <section v-if="screen === 'instructions'" key="instructions" class="screen">
        <header class="topbar">
          <span class="bot-name">Dev bot</span>
          <div class="topbar-actions">
            <button class="icon-btn" type="button" aria-label="more">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
            <button class="icon-btn" type="button" aria-label="close">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </header>

        <button class="back-btn" type="button" aria-label="back">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

        <h1 class="title">Liveness tekshiruvi</h1>
        <p class="subtitle">Bitta oddiy harakatni bajaring</p>

        <div class="progress-bar">
          <span
            v-for="i in totalSteps"
            :key="i"
            class="seg"
            :style="{ background: '#F0997B' }"
          />
        </div>

        <div class="content-area">
          <div class="instructions-circle">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#C9A99A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
        </div>

        <ul class="checklist">
          <li>
            <span class="check-square">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#D85A30" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
            <span>Yuzingiz yorqin yoritilganiga ishonch hosil qiling</span>
          </li>
          <li>
            <span class="check-square">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#D85A30" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
            <span>Ko'rsatmalarga rioya qilib harakatlaning</span>
          </li>
        </ul>

        <button class="btn-primary" type="button" @click="startFlow">Boshlash</button>
        <p class="footer">@aylanai_uz_bot</p>
      </section>

      <!-- ============== CHALLENGE ============== -->
      <section v-else-if="screen === 'challenge'" key="challenge" class="screen">
        <header class="topbar">
          <span class="bot-name">Dev bot</span>
          <div class="topbar-actions">
            <button class="icon-btn" type="button" aria-label="more">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
            <button class="icon-btn" type="button" aria-label="close" @click="cancel">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </header>

        <div v-if="totalSteps > 1" class="step-row">
          <span class="step-text">Qadam {{ currentStep + 1 }} / {{ totalSteps }}</span>
        </div>

        <div class="progress-bar">
          <span
            v-for="i in totalSteps"
            :key="i"
            class="seg"
            :style="{ background: (i - 1) <= currentStep ? '#D85A30' : '#F5E6E0' }"
          />
        </div>

        <h1 class="title center">{{ challengeTitle }}</h1>
        <p class="subtitle center">Asta-sekin harakatlaning</p>

        <div class="camera-area">
          <div class="camera-wrapper">
            <div class="camera-ring" :class="{ recording: phase === 'recording', verifying: phase === 'verifying', passed: phase === 'passed' }">
              <div class="camera-inner">
                <video ref="video" autoplay playsinline muted></video>
                <div v-if="phase === 'preparing' && countdown > 0" class="countdown-overlay">
                  <span class="countdown-num">{{ countdown }}</span>
                </div>
                <div v-if="phase === 'passed'" class="pass-overlay">
                  <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>
            </div>
            <div v-if="arrowDirection && (phase === 'preparing' || phase === 'recording')" class="direction-arrow" :class="arrowDirection">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="status-pill" :class="`status-${statusKey}`">
          <span class="status-dot" />
          <span>{{ statusText }}</span>
        </div>

        <button class="btn-secondary" type="button" @click="cancel">Bekor qilish</button>
      </section>

      <!-- ============== SUCCESS ============== -->
      <section v-else-if="screen === 'success'" key="success" class="screen">
        <header class="topbar">
          <span class="bot-name">Dev bot</span>
          <div class="topbar-actions">
            <button class="icon-btn" type="button" aria-label="more">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
            <button class="icon-btn" type="button" aria-label="close" @click="finish">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </header>

        <div class="progress-bar">
          <span v-for="i in totalSteps" :key="i" class="seg" :style="{ background: '#1D9E75' }" />
        </div>

        <div class="profile-area">
          <div class="profile-circle">
            <img v-if="bestFrame" :src="bestFrame" alt="" class="profile-img" />
            <div v-else class="profile-fallback">
              <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>
              </svg>
            </div>
            <div class="verified-badge">
              <div class="verified-badge-inner">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div class="verified-title-row">
          <span class="verified-title">Verified</span>
          <svg viewBox="0 0 24 24" width="16" height="16" class="burst-star">
            <path d="M12 2 L14.5 4.5 L18 4 L18.5 7.5 L21 10 L19 13 L21 16 L18 18 L17.5 21 L14 20.5 L12 23 L10 20.5 L6.5 21 L6 18 L3 16 L5 13 L3 10 L5.5 7.5 L6 4 L9.5 4.5 Z" fill="#1D9E75"/>
            <polyline points="8.5 12 11 14.5 15.5 9.5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <p class="subtitle center verified-subtitle">Profilingiz muvaffaqiyatli tasdiqlandi</p>

        <div class="completed-card">
          <div v-for="ch in completed" :key="ch.id" class="completed-row">
            <span>{{ ch.label }}</span>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#0F6E56" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        </div>

        <button class="btn-primary" type="button" @click="finish">Davom ettirish</button>
        <p class="footer">@aylanai_uz_bot</p>
      </section>

      <!-- ============== ERROR ============== -->
      <section v-else-if="screen === 'error'" key="error" class="screen">
        <header class="topbar">
          <span class="bot-name">Dev bot</span>
          <div class="topbar-actions">
            <button class="icon-btn" type="button" aria-label="more">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
            <button class="icon-btn" type="button" aria-label="close" @click="resetToInstructions">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </header>

        <div class="content-area">
          <div class="error-circle">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#D85A30" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
        </div>

        <h1 class="title center">{{ errorTitle }}</h1>
        <p class="subtitle center">{{ errorMessage }}</p>

        <button class="btn-primary" type="button" @click="resetToInstructions">Qayta urinish</button>
      </section>
    </transition>

    <canvas ref="canvas" style="display:none"></canvas>
  </div>
</template>

<script>
import { markRaw } from "vue"

const API_BASE = import.meta.env.VITE_API_BASE ?? ""
const API_KEY = import.meta.env.VITE_API_KEY || ""
const TOTAL_STEPS = 1

function apiUrl(path) {
  return `${API_BASE}${path}`
}
function apiHeaders(extra = {}) {
  const headers = { ...extra }
  if (API_KEY) headers["API-Key"] = API_KEY
  return headers
}

const TITLES = {
  turn_right: "Boshingizni o'ngga buring",
  turn_left: "Boshingizni chapga buring",
  smile: "Tabassum qiling",
  blink: "Ikki marta ko'zingizni piltiring",
  open_mouth: "Og'zingizni oching",
  nod_up: "Boshingizni yuqoriga ko'taring",
  nod_down: "Boshingizni pastga eging",
  raise_eyebrows: "Qoshlaringizni ko'taring",
  wink_left: "Chap ko'zingizni qisib qo'ying",
  wink_right: "O'ng ko'zingizni qisib qo'ying",
  tilt_left: "Boshingizni chapga eging",
  tilt_right: "Boshingizni o'ngga eging",
}

const SHORT_LABELS = {
  turn_right: "Bosh o'ngga",
  turn_left: "Bosh chapga",
  smile: "Tabassum",
  blink: "Ko'z piltirish",
  open_mouth: "Og'iz ochish",
  nod_up: "Bosh yuqoriga",
  nod_down: "Bosh pastga",
  raise_eyebrows: "Qosh ko'tarish",
  wink_left: "Chap ko'z qisish",
  wink_right: "O'ng ko'z qisish",
  tilt_left: "Bosh chapga egish",
  tilt_right: "Bosh o'ngga egish",
}

const ARROW = {
  turn_right: "right",
  turn_left: "left",
  tilt_right: "right",
  tilt_left: "left",
  nod_up: "up",
  nod_down: "down",
}

export default {
  data() {
    return {
      screen: "instructions",
      currentStep: 0,
      totalSteps: TOTAL_STEPS,
      currentChallenge: null,
      completed: [],
      cameraStarted: false,
      mediaStream: null,
      faceDetector: null,
      faceDetected: false,
      faceInPosition: false,
      faceDistance: "unknown",
      faceReady: false,
      isRecording: false,
      isVerifying: false,
      phase: "searching",
      countdown: 0,
      errorTitle: "",
      errorMessage: "",
      noFaceTimer: null,
      lowLightFrames: 0,
      bestFrame: null,
      bestScore: 0,
      lastCaptureMs: 0,
      usedChallengeTypes: [],
      verifiedFinal: false,
    }
  },

  computed: {
    challengeType() {
      return this.currentChallenge?.challenge_type
    },
    challengeTitle() {
      const t = this.challengeType
      return (t && TITLES[t]) || "Harakatni bajaring"
    },
    arrowDirection() {
      const t = this.challengeType
      return (t && ARROW[t]) || null
    },
    statusKey() {
      if (this.phase === "passed") return "completed"
      if (this.phase === "verifying") return "verifying"
      if (this.phase === "recording") return "recording"
      if (this.phase === "preparing") return "detected"
      if (this.faceReady) return "detected"
      return "searching"
    },
    statusText() {
      if (this.phase === "passed") return "Ajoyib!"
      if (this.phase === "verifying") return "Tekshirilmoqda..."
      if (this.phase === "recording") return "Harakatni bajaring"
      if (this.phase === "preparing") return "Tayyor bo'ling..."
      if (this.faceReady) return "Yuzingiz aniqlandi"
      return "Yuzingizni doira ichiga joylang"
    },
  },

  beforeUnmount() {
    this.stopCamera()
    if (this.noFaceTimer) clearTimeout(this.noFaceTimer)
  },

  methods: {
    haptic(kind = "medium") {
      try {
        const tg = window.Telegram?.WebApp
        tg?.HapticFeedback?.impactOccurred?.(kind)
      } catch (_) {}
    },

    async startFlow() {
      // Once verified in this session, do not allow restarting
      if (this.verifiedFinal) {
        this.screen = "success"
        return
      }
      this.haptic("light")
      this.completed = []
      this.usedChallengeTypes = []
      this.currentStep = 0
      this.currentChallenge = null
      this.bestFrame = null
      this.bestScore = 0
      this.screen = "challenge"
      await this.$nextTick()
      const ok = await this.startCamera()
      if (!ok) return
      await this.runStep()
    },

    async startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            facingMode: "user",
          },
          audio: false,
        })
        this.mediaStream = stream
        const video = this.$refs.video
        if (!video) {
          stream.getTracks().forEach((t) => t.stop())
          return false
        }
        video.srcObject = stream
        this.cameraStarted = true

        const ready = () => this.initFaceDetection()
        if (video.readyState >= 2) ready()
        else video.onloadeddata = ready

        this.armNoFaceTimer()
        return true
      } catch (err) {
        this.showError(
          "Kameraga ruxsat berilmadi",
          "Sozlamalardan kameraga ruxsat bering"
        )
        return false
      }
    },

    stopCamera() {
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((t) => t.stop())
        this.mediaStream = null
      }
      this.cameraStarted = false
      this.faceDetected = false
      this.faceInPosition = false
      this.faceReady = false
    },

    async initFaceDetection() {
      if (this.faceDetector) {
        this.startFaceDetectionLoop()
        return
      }
      try {
        const { FaceDetector, FilesetResolver } = await import(
          "@mediapipe/tasks-vision"
        )
        const wasmFileset = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm"
        )
        let detector
        try {
          detector = await FaceDetector.createFromOptions(wasmFileset, {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            minDetectionConfidence: 0.5,
          })
        } catch (_) {
          detector = await FaceDetector.createFromOptions(wasmFileset, {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            minDetectionConfidence: 0.5,
          })
        }
        await detector.setOptions({ runningMode: "VIDEO" })
        this.faceDetector = markRaw(detector)
        this.startFaceDetectionLoop()
      } catch (err) {
        // graceful fallback — pretend face is ready so flow can proceed
        this.faceDetected = true
        this.faceReady = true
      }
    },

    startFaceDetectionLoop() {
      const tick = () => {
        if (this.screen !== "challenge") {
          setTimeout(tick, 200)
          return
        }
        const video = this.$refs.video
        if (!video || !this.faceDetector || video.readyState < 2) {
          setTimeout(tick, 100)
          return
        }
        try {
          const now = performance.now()
          const detections = this.faceDetector.detectForVideo(video, now)
          this.processDetections(detections, video)
        } catch (_) {}
        setTimeout(tick, 80)
      }
      tick()
    },

    processDetections(detections, video) {
      const list = detections.detections || []
      if (list.length === 0) {
        this.faceDetected = false
        this.faceInPosition = false
        this.faceDistance = "unknown"
        this.faceReady = false
        return
      }
      if (list.length > 1) {
        this.faceDetected = true
        this.faceReady = false
      }

      const face = list[0]
      const bbox = face.boundingBox
      const vw = video.videoWidth
      const vh = video.videoHeight
      const cx = bbox.originX + bbox.width / 2
      const cy = bbox.originY + bbox.height / 2

      const idealW = vw * 0.55
      const idealH = vh * 0.7
      const ratio = bbox.width / idealW

      if (ratio > 0.95) this.faceDistance = "too_close"
      else if (ratio < 0.3) this.faceDistance = "too_far"
      else this.faceDistance = "good"

      const dx = Math.abs(cx - vw / 2) / (idealW * 0.5)
      const dy = Math.abs(cy - vh / 2) / (idealH * 0.5)
      const dist = Math.sqrt(dx * dx + dy * dy)
      this.faceInPosition = dist < 1.0
      this.faceDetected = true
      this.faceReady =
        list.length === 1 && this.faceInPosition && this.faceDistance === "good"

      if (this.faceReady && this.noFaceTimer) {
        clearTimeout(this.noFaceTimer)
        this.noFaceTimer = null
      }

      // Capture best selfie for success screen — only when face is steady
      // (not during recording motion) and confidence is higher than what we have
      if (this.faceReady && this.phase !== "recording") {
        const score = face.categories?.[0]?.score || 0
        const now = performance.now()
        if (score > this.bestScore - 0.02 && now - this.lastCaptureMs > 350) {
          const frame = this.captureFrame()
          if (frame) {
            this.bestFrame = frame
            if (score > this.bestScore) this.bestScore = score
            this.lastCaptureMs = now
          }
        }
      }
    },

    armNoFaceTimer() {
      if (this.noFaceTimer) clearTimeout(this.noFaceTimer)
      this.noFaceTimer = setTimeout(() => {
        if (!this.faceReady && this.screen === "challenge" && !this.isRecording) {
          this.showError(
            "Yuz topilmadi",
            "Qaytadan urinib ko'ring"
          )
        }
      }, 15000)
    },

    async waitForFaceReady(timeoutMs = 30000) {
      const start = Date.now()
      while (Date.now() - start < timeoutMs) {
        if (this.faceReady) return true
        if (this.screen !== "challenge") return false
        await new Promise((r) => setTimeout(r, 120))
      }
      return false
    },

    async runStep() {
      try {
        this.phase = "searching"
        const ready = await this.waitForFaceReady(30000)
        if (!ready) {
          if (this.screen === "challenge") {
            this.showError(
              "Vaqt tugadi",
              "Qaytadan urinib ko'ring"
            )
          }
          return
        }

        // Request a challenge — retry up to 5x if backend gives a type
        // we've already used in this session (no duplicates within one flow)
        let picked = null
        for (let attempt = 0; attempt < 5; attempt++) {
          const res = await fetch(apiUrl("/liveness/challenge/"), {
            method: "POST",
            headers: apiHeaders({ "Content-Type": "application/json" }),
            body: "{}",
          })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          if (!this.usedChallengeTypes.includes(data.challenge_type)) {
            picked = data
            break
          }
          picked = data
        }
        this.currentChallenge = picked
        if (picked?.challenge_type) {
          this.usedChallengeTypes.push(picked.challenge_type)
        }
        this.haptic("light")

        this.phase = "preparing"
        for (let i = 3; i > 0; i--) {
          this.countdown = i
          await new Promise((r) => setTimeout(r, 700))
          if (this.screen !== "challenge") return
        }
        this.countdown = 0
        if (this.screen !== "challenge") return

        await this.recordAndVerify()
      } catch (err) {
        this.showError(
          "Xatolik yuz berdi",
          "Internet bilan bog'lanishni tekshiring va qayta urinib ko'ring"
        )
      }
    },

    captureFrame() {
      const video = this.$refs.video
      const canvas = this.$refs.canvas
      if (!video || !canvas) return null
      const w = Math.min(video.videoWidth || 640, 640)
      const h = Math.min(video.videoHeight || 480, 480)
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")
      ctx.drawImage(video, 0, 0, w, h)
      return canvas.toDataURL("image/jpeg", 0.8)
    },

    async recordAndVerify() {
      if (!this.currentChallenge) return
      this.phase = "recording"
      this.isRecording = true
      const frames = []
      const interval = setInterval(() => {
        const f = this.captureFrame()
        if (f) frames.push(f)
      }, 200)

      await new Promise((r) => setTimeout(r, 3000))
      clearInterval(interval)
      this.isRecording = false

      if (this.screen !== "challenge") return

      this.phase = "verifying"
      this.isVerifying = true
      try {
        const verifyRes = await fetch(apiUrl("/liveness/verify/"), {
          method: "POST",
          headers: apiHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            challenge_id: this.currentChallenge.challenge_id,
            frames,
          }),
        })
        if (!verifyRes.ok) throw new Error(`HTTP ${verifyRes.status}`)
        const verifyData = await verifyRes.json()
        const result = await this.pollResult(verifyData.task_id)
        const isLive =
          result?.result?.is_live ?? result?.result?.success ?? false

        if (isLive) {
          await this.onStepPassed()
        } else {
          this.showError(
            "Tekshiruv muvaffaqiyatsiz",
            "Iltimos, ko'rsatmalarni aniq bajaring"
          )
        }
      } catch (err) {
        this.showError(
          "Tekshiruv xatosi",
          "Qaytadan urinib ko'ring"
        )
      } finally {
        this.isVerifying = false
      }
    },

    async pollResult(taskId) {
      let attempts = 0
      while (attempts < 30) {
        const res = await fetch(apiUrl(`/liveness/result/${taskId}/`), {
          headers: apiHeaders(),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const done =
          data.status === "completed" ||
          data.status === "failed" ||
          data.status === "success" ||
          data.status === "error" ||
          data.result != null
        if (done) return data
        attempts++
        await new Promise((r) => setTimeout(r, 1000))
      }
      throw new Error("timeout")
    },

    async onStepPassed() {
      this.haptic("medium")
      this.phase = "passed"
      const t = this.currentChallenge?.challenge_type
      this.completed.push({
        id: this.currentChallenge?.challenge_id || `${t}-${this.currentStep}`,
        type: t,
        label: SHORT_LABELS[t] || TITLES[t] || t,
      })
      await new Promise((r) => setTimeout(r, 900))
      if (this.screen !== "challenge") return

      if (this.currentStep + 1 >= this.totalSteps) {
        this.stopCamera()
        this.verifiedFinal = true
        this.screen = "success"
        return
      }
      this.currentStep += 1
      this.currentChallenge = null
      this.phase = "searching"
      this.armNoFaceTimer()
      await this.runStep()
    },

    cancel() {
      this.haptic("light")
      // If user already verified, never go back to instructions
      if (this.verifiedFinal) {
        this.screen = "success"
        return
      }
      this.resetToInstructions()
    },

    finish() {
      this.haptic("light")
      // Verified is the terminal state. Notify Telegram and close the
      // mini app. If we're not inside Telegram, stay on the success screen.
      try {
        const tg = window.Telegram?.WebApp
        if (tg?.sendData) {
          tg.sendData(
            JSON.stringify({
              verified: true,
              challenges: this.completed.map((c) => c.type),
              timestamp: Date.now(),
            })
          )
        }
        if (tg?.close) {
          tg.close()
          return
        }
      } catch (_) {}
    },

    resetToInstructions() {
      // If already verified, the success screen is the terminal state
      if (this.verifiedFinal) {
        this.screen = "success"
        return
      }
      this.stopCamera()
      if (this.noFaceTimer) {
        clearTimeout(this.noFaceTimer)
        this.noFaceTimer = null
      }
      this.currentChallenge = null
      this.currentStep = 0
      this.completed = []
      this.usedChallengeTypes = []
      this.phase = "searching"
      this.countdown = 0
      this.isRecording = false
      this.isVerifying = false
      this.bestFrame = null
      this.bestScore = 0
      this.lastCaptureMs = 0
      this.screen = "instructions"
    },

    showError(title, message) {
      this.stopCamera()
      if (this.noFaceTimer) {
        clearTimeout(this.noFaceTimer)
        this.noFaceTimer = null
      }
      this.errorTitle = title
      this.errorMessage = message
      this.screen = "error"
    },
  },
}
</script>

<style>
:root {
  --primary: #E5564E;
  --primary-dark: #D85A30;
  --primary-light: #FAECE7;
  --primary-muted: #F5EFEC;
  --success: #1D9E75;
  --success-bg: #E1F5EE;
  --success-dark-text: #0F6E56;
  --text-primary: #1a1a2e;
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;
  --border: rgba(0, 0, 0, 0.08);
  --radius-card: 16px;
  --radius-button: 24px;
  --radius-inner: 10px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

html, body, #app {
  height: 100%;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background: #ffffff;
  color: var(--text-primary);
  font-size: 12px;
  line-height: 1.4;
  min-height: 100vh;
  min-height: -webkit-fill-available;
}

.app {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background: #ffffff;
}

.screen {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: -webkit-fill-available;
  padding: 12px 16px 20px;
  padding-top: max(12px, env(safe-area-inset-top));
  padding-bottom: max(20px, env(safe-area-inset-bottom));
}

/* ===== Topbar ===== */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  margin-bottom: 4px;
}
.bot-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
}
.topbar-actions {
  display: flex;
  gap: 4px;
}
.icon-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  border-radius: 8px;
}
.icon-btn:active {
  background: rgba(0, 0, 0, 0.04);
}

/* ===== Back button ===== */
.back-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  margin-left: -6px;
  margin-bottom: 4px;
  border-radius: 8px;
}
.back-btn:active {
  background: rgba(0, 0, 0, 0.04);
}

/* ===== Titles ===== */
.title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  letter-spacing: -0.1px;
  margin-top: 2px;
}
.title.center {
  text-align: center;
}
.subtitle {
  font-size: 11px;
  font-weight: 400;
  color: var(--text-secondary);
  margin-top: 4px;
  margin-bottom: 14px;
}
.subtitle.center {
  text-align: center;
}

/* ===== Progress bar ===== */
.progress-bar {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
}
.progress-bar .seg {
  flex: 1;
  height: 3px;
  border-radius: 2px;
  transition: background 200ms ease;
}

/* ===== Step row ===== */
.step-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  margin-bottom: 8px;
}
.step-text {
  font-size: 11px;
  color: var(--text-secondary);
}
.dots {
  display: flex;
  gap: 5px;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary-light);
  transition: background 200ms ease;
}
.dot.active {
  background: var(--primary-dark);
}

/* ===== Instructions content ===== */
.content-area {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
  flex: 0 0 auto;
}
.instructions-circle {
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: var(--primary-muted);
  display: flex;
  align-items: center;
  justify-content: center;
}

.checklist {
  list-style: none;
  margin-top: auto;
  margin-bottom: 16px;
  padding: 0;
}
.checklist li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 11px;
  color: var(--text-primary);
  padding: 6px 0;
  line-height: 1.45;
}
.check-square {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  border-radius: 4px;
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}

/* ===== Buttons ===== */
.btn-primary {
  width: 100%;
  min-height: 44px;
  padding: 14px 16px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-button);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: transform 100ms ease, background 150ms ease;
}
.btn-primary:active {
  transform: scale(0.98);
  background: var(--primary-dark);
}

.btn-secondary {
  width: 100%;
  min-height: 44px;
  padding: 14px 16px;
  background: #F5C4B3;
  color: #993C1D;
  border: none;
  border-radius: var(--radius-button);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: transform 100ms ease;
}
.btn-secondary:active {
  transform: scale(0.98);
}

.footer {
  text-align: center;
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 12px;
}

/* ===== Camera ===== */
.camera-area {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0 16px;
  flex: 1 0 auto;
}
.camera-wrapper {
  position: relative;
  width: 240px;
  height: 240px;
}
.camera-ring {
  width: 240px;
  height: 240px;
  border-radius: 50%;
  border: 2.5px dashed var(--primary);
  padding: 10px;
  box-sizing: border-box;
  transition: border-color 200ms ease, box-shadow 200ms ease;
}
.camera-ring.recording {
  border-style: solid;
  animation: ring-pulse 1.6s ease-in-out infinite;
}
.camera-ring.verifying {
  border-style: solid;
  border-color: var(--primary-dark);
  animation: ring-breathe 1.6s ease-in-out infinite;
}
.camera-ring.passed {
  border-style: solid;
  border-color: var(--success);
  box-shadow: 0 0 0 8px rgba(29, 158, 117, 0.18);
}
@keyframes ring-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(216, 90, 48, 0.35); }
  50% { box-shadow: 0 0 0 12px rgba(216, 90, 48, 0); }
}
@keyframes ring-breathe {
  0%, 100% { box-shadow: 0 0 0 0 rgba(216, 90, 48, 0.25); }
  50% { box-shadow: 0 0 0 8px rgba(216, 90, 48, 0); }
}
.camera-inner {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  background: var(--primary-muted);
}
.camera-inner video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}
.countdown-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}
.countdown-num {
  font-size: 56px;
  font-weight: 600;
  color: #fff;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
  animation: count-pop 700ms ease-out;
}
@keyframes count-pop {
  0% { transform: scale(0.6); opacity: 0; }
  40% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes rec-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.pass-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(29, 158, 117, 0.78);
  animation: pass-fade 300ms ease-out;
}
@keyframes pass-fade {
  0% { opacity: 0; transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}

.direction-arrow {
  position: absolute;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(216, 90, 48, 0.4);
  animation: arrow-bounce 1.4s ease-in-out infinite;
}
.direction-arrow.right {
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
}
.direction-arrow.left {
  left: -8px;
  top: 50%;
  transform: translateY(-50%) rotate(180deg);
}
.direction-arrow.up {
  top: -8px;
  left: 50%;
  transform: translateX(-50%) rotate(-90deg);
}
.direction-arrow.down {
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%) rotate(90deg);
}
@keyframes arrow-bounce {
  0%, 100% { opacity: 0.85; }
  50% { opacity: 1; }
}

/* ===== Status pill ===== */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--primary-light);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  color: var(--primary-dark);
  align-self: center;
  margin-top: auto;
  margin-bottom: 16px;
  max-width: 100%;
  transition: background 200ms ease, color 200ms ease;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #F0B650;
  flex-shrink: 0;
}
.status-pill.status-detected .status-dot {
  background: var(--primary-dark);
}
.status-pill.status-recording .status-dot {
  background: var(--primary);
  animation: rec-blink 1s infinite;
}
.status-pill.status-verifying .status-dot {
  background: var(--primary-dark);
  animation: rec-blink 1.2s infinite;
}
.status-pill.status-completed {
  background: var(--success-bg);
  color: var(--success-dark-text);
}
.status-pill.status-completed .status-dot {
  background: var(--success);
}

/* ===== Success ===== */
.profile-area {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 24px auto 20px;
}
.profile-circle {
  position: relative;
  width: 170px;
  height: 170px;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.profile-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
  transform: scaleX(-1);
}
.profile-fallback {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--primary-muted);
  display: flex;
  align-items: center;
  justify-content: center;
}
.verified-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}
.verified-badge-inner {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--success);
  display: flex;
  align-items: center;
  justify-content: center;
}

.verified-title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 4px;
}
.verified-title {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.2;
}
.burst-star {
  flex-shrink: 0;
  filter: drop-shadow(0 1px 2px rgba(29, 158, 117, 0.25));
}
.verified-subtitle {
  font-size: 12px;
  line-height: 1.5;
  margin-bottom: 14px;
}

.completed-card {
  background: var(--success-bg);
  border-radius: var(--radius-inner);
  padding: 10px 12px;
  margin-top: 18px;
  margin-bottom: auto;
}
.completed-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 11px;
  color: var(--success-dark-text);
}
.completed-row + .completed-row {
  border-top: 1px solid rgba(15, 110, 86, 0.12);
}

/* ===== Error ===== */
.error-circle {
  width: 130px;
  height: 130px;
  border-radius: 50%;
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== Transitions ===== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
