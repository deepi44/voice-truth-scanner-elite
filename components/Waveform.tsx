
import React, { useEffect, useRef } from 'react';

interface WaveformProps {
  isRecording: boolean;
  isActive: boolean;
  stream?: MediaStream;
}

const Waveform: React.FC<WaveformProps> = ({ isRecording, isActive, stream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

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
        const barWidth = (width / dataArray.length) * 2.5;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const barHeight = (dataArray[i] / 255) * height;
          const hue = (i / dataArray.length) * 360;
          ctx.fillStyle = `hsla(${hue + 220}, 80%, 60%, 0.8)`;
          ctx.fillRect(x, height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }
      } else if (isRecording || isActive) {
        // Simple static wave animation when no stream
        ctx.beginPath();
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin(x * 0.05 + Date.now() * 0.005) * 20;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else {
        // Flat line
        ctx.beginPath();
        ctx.strokeStyle = '#334155';
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioCtx) audioCtx.close();
    };
  }, [isRecording, isActive, stream]);

  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={100} 
      className="w-full h-24 rounded-lg bg-black/20"
    />
  );
};

export default Waveform;
