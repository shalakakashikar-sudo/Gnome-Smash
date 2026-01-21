
export enum GameMode {
  MENU = 'MENU',
  VOCAB_SMASH = 'VOCAB_SMASH',
  SUMMARY = 'SUMMARY'
}

export interface VocabItem {
  id: string;
  word: string;
  meaning: string;
  synonyms: string[];
  antonyms: string[];
}

export type GnomeType = 'GNOME' | 'DEVIL' | 'SPEEDY';

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export interface LearningPopup {
  id: string;
  x: number;
  y: number;
  text: string;
  subtext: string;
  color: string;
  timer: number;
}

export interface Gnome {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: GnomeType;
  state: 'falling' | 'bouncing' | 'on_paddle' | 'bursting';
  effectType?: 'reverse' | 'shrink' | 'speedup' | 'magnet' | 'shield' | 'grow' | 'laser';
  timer: number;
  bounceCount: number;
  laughTimer: number;
  rotation: number;
}

export interface Brick {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  content: string;
  isTarget: boolean;
  type: 'vocab' | 'sentence';
  hits: number;
  maxHits: number;
}

export interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GameState {
  score: number;
  lives: number;
  level: number;
  mode: GameMode;
  targetInfo: string | null;
  takeaway: string | null;
}
