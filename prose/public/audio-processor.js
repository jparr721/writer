// AudioWorklet processor for downsampling audio to 16kHz for whisp
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.targetSampleRate = 16000;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const samples = input[0];
    const ratio = sampleRate / this.targetSampleRate;

    // Simple downsampling by picking every nth sample
    for (let i = 0; i < samples.length; i += ratio) {
      this.buffer.push(samples[Math.floor(i)]);
    }

    // Send chunks of ~4096 samples (matches whisp client)
    if (this.buffer.length >= 4096) {
      const chunk = new Float32Array(this.buffer.splice(0, 4096));
      this.port.postMessage(chunk);
    }

    return true;
  }
}

registerProcessor("audio-processor", AudioProcessor);
