
export interface BatchImage {
  id: string;
  prompt: string;
  title?: string;
  imageUrl?: string;
  status: 'idle' | 'generating' | 'completed' | 'error';
  error?: string;
}

export interface TextSettings {
  fontFamily: string;
  fontSize: number;
  color: string;
  yPosition: number; // 0 to 100
  shadow: boolean;
  uppercase: boolean;
}

export interface AppState {
  baseImage: string | null;
  batchItems: BatchImage[];
  isProcessing: boolean;
  textSettings: TextSettings;
}
