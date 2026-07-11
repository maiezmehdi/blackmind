import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export interface LiveSessionCallbacks {
  onAudioData: (buffer: AudioBuffer) => void;
  onInterrupted: () => void;
  onTranscription: (text: string, isInput: boolean) => void;
  onOpen: () => void;
  onClose: () => void;
  onError: (e: any) => void;
}

export const connectLiveAssistant = (callbacks: LiveSessionCallbacks, externalCtx: AudioContext) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  let stream: MediaStream | null = null;
  let scriptProcessor: ScriptProcessorNode | null = null;
  let currentSessionPromise: Promise<any> | null = null;

  const init = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser API navigator.mediaDevices.getUserMedia not available (check HTTPS)");
      }

      stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      currentSessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            if (!stream) return;

            const source = inputAudioContext.createMediaStreamSource(stream);
            scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              if (currentSessionPromise) {
                currentSessionPromise.then((session: any) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              }
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
            callbacks.onOpen();
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64EncodedAudioString) {
              const audioBuffer = await decodeAudioData(
                decode(base64EncodedAudioString),
                externalCtx,
                24000,
                1,
              );
              callbacks.onAudioData(audioBuffer);
            }

            if (message.serverContent?.interrupted) {
              callbacks.onInterrupted();
            }

            if (message.serverContent?.outputTranscription) {
              callbacks.onTranscription(message.serverContent.outputTranscription.text, false);
            } else if (message.serverContent?.inputTranscription) {
              callbacks.onTranscription(message.serverContent.inputTranscription.text, true);
            }
          },
          onerror: (e) => callbacks.onError(e),
          onclose: () => {
            if (stream) {
              stream.getTracks().forEach(track => track.stop());
            }
            if (scriptProcessor) {
              scriptProcessor.disconnect();
            }
            callbacks.onClose();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: "Tu es Blackmind Assistant, un mentor expert en pédagogie et en création de contenu. Ta voix est calme, intelligente et inspirante. Tu aides l'utilisateur à structurer ses idées et à créer des cours d'exception en temps réel.",
        },
      });

    } catch (err) {
      callbacks.onError(err);
    }
  };

  init();

  return {
    stop: () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (scriptProcessor) {
        scriptProcessor.disconnect();
      }
      if (inputAudioContext && inputAudioContext.state !== 'closed') {
        inputAudioContext.close();
      }
      if (currentSessionPromise) {
        currentSessionPromise.then((s: any) => s.close());
      }
    }
  };
};