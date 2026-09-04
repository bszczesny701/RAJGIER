export interface MonopolySpace {
  index: number;
  type: string;
  name: string;
  group: string;
  price: number | null;
  tax: number | null;
  rent: number[] | null;
  houseCost: number | null;
  ownerId: string | null;
  houses: number;
  canBuild?: boolean;
  canSellHouse?: boolean;
  sellRefund?: number | null;
}

export interface MonopolyToken {
  id: string;
  name: string;
  cash: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  bankrupt: boolean;
  piece: string;
}

export interface MonopolyState {
  phase: string;
  currentPlayerId: string | null;
  currentTurnName: string;
  winner: string | null;
  lastDice: { d1: number; total: number; bonus: boolean } | null;
  pendingCard: { id: string; text: string } | null;
  pendingNotice: { id: string; kind: string; title: string; text: string } | null;
  log: string[];
  spaces: MonopolySpace[];
  tokens: MonopolyToken[];
  myPropertyIndexes: number[];
  myId: string;
  myCash: number;
  myPosition: number;
  myBankrupt: boolean;
  inJail: boolean;
  isMyTurn: boolean;
  canRoll: boolean;
  canPayJail: boolean;
  canBuy: boolean;
  canSkipBuy: boolean;
  canEndTurn: boolean;
  buyOffer: { index: number; name: string; price: number } | null;
  jailFee: number;
  myName: string;
}
