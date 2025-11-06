// src/components/Enroll.tsx
import { useRef, useEffect, useState } from 'react'
import * as faceapi from '@vladmandic/face-api'
import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'   // ensure webgl backend is loaded
import * as api from '../services/api' // keep as any if this is JS

interface EnrollProps {
  apiBase: string
}

export default function Enroll({ apiBase }: EnrollProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [status, setStatus] = useState<string>('Loading models...')
  const [loadingModels, setLoadingModels] = useState<boolean>(true)
  const [, setFramesCaptured] = useState<number>(0)
  const [progressPct, setProgressPct] = useState<number>(0)

  // form state
  const [studentId, setStudentId] = useState<string>('')
  const [name, setName] = useState<string>('')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        await tf.setBackend('webgl');        
        await tf.ready();
        const DETECTOR_URL = '/models/detector/'      // tiny detector + landmarks
        const RECOG_URL = '/models/arcface_512/'     // face recognition model (face_api format)

        // load detector & landmarks
        await faceapi.nets.tinyFaceDetector.loadFromUri(DETECTOR_URL)
        await faceapi.nets.faceLandmark68TinyNet.loadFromUri(DETECTOR_URL)

        // load face recognition (embedding) model
        await faceapi.nets.faceRecognitionNet.loadFromUri(RECOG_URL)

        if (!mounted) return
        setLoadingModels(false)
        setStatus('Models loaded — allow camera')
        await startCamera()
      } catch (e) {
        console.error('Model load error', e)
        setStatus('Failed to load models. Check console and ensure /public/models exists')
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (e) {
      console.error('Camera start error', e)
      setStatus('Camera access denied')
    }
  }

  // simple crop (keeps for preview or future use) — not used for descriptor with face-api because .withFaceDescriptor() already handles alignment internally
  // function alignCropToCanvas(videoEl: HTMLVideoElement, detection: any) {
  //   const box = detection.detection.box
  //   const canvas = document.createElement('canvas')
  //   const size = 160
  //   canvas.width = size
  //   canvas.height = size
  //   const ctx = canvas.getContext('2d')!
  //   const sx = Math.max(0, box.x - box.width * 0.2)
  //   const sy = Math.max(0, box.y - box.height * 0.35)
  //   const sw = Math.min(videoEl.videoWidth - sx, box.width * 1.4)
  //   const sh = Math.min(videoEl.videoHeight - sy, box.height * 1.6)
  //   ctx.drawImage(videoEl, sx, sy, sw, sh, 0, 0, size, size)
  //   return canvas
  // }

  async function captureAndEnroll() {
    if (loadingModels) { setStatus('Models still loading'); return }
    if (!studentId || !name ) { setStatus('Fill student details'); return }

    setStatus('Capturing frames...')

    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
    const descriptors: number[][] = []
    const CAPTURE_COUNT = 6

    for (let i = 0; i < CAPTURE_COUNT; i++) {
      setStatus(`Capture ${i + 1} / ${CAPTURE_COUNT}`)
      // use face-api to get descriptor directly (handles alignment internally)
      const detection = await faceapi.detectSingleFace(videoRef.current as HTMLVideoElement, options)
        .withFaceLandmarks(true)
        .withFaceDescriptor()
        console.log('🧠 Descriptor length =', detection?.descriptor?.length);

      if (!detection || !detection.descriptor) {
        setStatus('No face detected. Adjust position.')
        await new Promise(r => setTimeout(r, 600))
        i-- // retry this iteration
        continue
      }

      // descriptor is Float32Array length 512
      const descriptor = Array.from(detection.descriptor) as number[]
      console.log('descriptor length =', detection.descriptor.length);
      descriptors.push(descriptor)

      setFramesCaptured(descriptors.length)
      setProgressPct(Math.round((descriptors.length / CAPTURE_COUNT) * 100))
      await new Promise(r => setTimeout(r, 300))
    }

    setStatus('Averaging embeddings...')
    const dim = descriptors[0].length
    const avg = new Array<number>(dim).fill(0)
    for (const d of descriptors) {
      for (let k = 0; k < dim; k++) avg[k] += d[k]
    }
    for (let k = 0; k < dim; k++) avg[k] = avg[k] / descriptors.length

    const payload = { studentId, name, embedding: avg };
    console.log('>>> Enroll payload length =', payload.embedding?.length);
    console.log('>>> Enroll payload preview:', {
      studentId: payload.studentId,
      name: payload.name,
      emb0: payload.embedding[0],
      embLast: payload.embedding[payload.embedding.length-1]
    });

    setStatus('Sending embedding to server...')
    try {
      const res = await (api as any).enrollStudent(apiBase, payload)
      console.log('enroll res', res.data);
      setStatus('Face registered ✅')
    } catch (err: any) {
        console.error('Enroll API error', err);
        const serverMsg = err?.response?.data || err?.message || JSON.stringify(err);
        setStatus('Failed to register on server: ' + (serverMsg.error || JSON.stringify(serverMsg)));
        
        console.error('Full server response object:', err?.response?.data, err);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-8 px-4">
  <div className="w-full max-w-5xl bg-white rounded-2xl p-6 flex flex-wrap gap-6 items-start justify-center">
    <div className="flex-1 min-w-[320px]">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="w-full rounded-lg shadow-md border border-gray-200"
      />
    </div>

    {/* Right Side Form */}
    <div className="flex-1 min-w-[320px] flex flex-col gap-3">
      <input
        type="text"
        placeholder="Student ID"
        value={studentId}
        onChange={e => setStudentId(e.target.value)}
        className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={e => setName(e.target.value)}
        className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
      {/* <input
        type="tel"
        placeholder="Parent phone (+91...)"
        value={parentPhone}
        onChange={e => setParentPhone(e.target.value)}
        className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
      /> */}

      {/* Buttons */}
      <div className="flex gap-3 mt-2">
        <button
          onClick={captureAndEnroll}
          disabled={loadingModels}
          className={`flex-1 py-2 px-4 rounded-lg text-white font-semibold transition-all ${
            loadingModels
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-teal-600 hover:bg-teal-700'
          }`}
        >
          Enroll Face
        </button>

        <button
          onClick={() => {
            setStudentId('');
            setName('');
            setStatus('Ready');
          }}
          className="flex-1 py-2 px-4 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition-all"
        >
          Reset
        </button>
      </div>

      {/* Status area */}
      <div className="mt-4">
        <div className="text-sm text-gray-700 font-medium">{status}</div>
        <small className="block text-gray-500 mt-1">
          Capture a few different poses — turn left/right slightly for robustness.
        </small>

        <div className="w-full bg-gray-200 h-2 rounded-full mt-3 overflow-hidden">
          <div
            className="bg-teal-600 h-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>
      </div>
    </div>
  </div>
</div>

  )
}
