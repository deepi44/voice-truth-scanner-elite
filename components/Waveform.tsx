
import React, { useEffect, useRef } from 'react';

interface WaveformProps {
  isRecording: boolean;
  isActive: boolean;
  stream?: MediaStream;
}

const Waveform: React.FC<WaveformProps> = ({ isRecording, isActive, stream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let dataArray: Uint8Array | null = null;

    if (isActive && stream) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
    }

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (isActive && analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        const barWidth = (width / dataArray.length) * 2;
        let x = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const barHeight = (dataArray[i] / 255) * height;
          ctx.fillStyle = `rgba(99, 102, 241, ${0.4 + (dataArray[i]/255)})`;
          ctx.fillRect(x, height - barHeight, barWidth, barHeight);
          x += barWidth + 2;
        }
      } else if (isRecording || isActive) {
        ctx.beginPath();
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin(x * 0.05 + Date.now() * 0.01) * 15;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.strokeStyle = '#1e293b';
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }
      animationRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      if (audioCtx) audioCtx.close();
    };
  }, [isRecording, isActive, stream]);

  return <canvas ref={canvasRef} width={800} height={120} className="w-full h-24 rounded-2xl bg-slate-900/50" />;
};

export default Waveform;
