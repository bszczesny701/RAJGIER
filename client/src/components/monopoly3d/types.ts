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
  mortgaged?: boolean;
  canBuild?: boolean;
  canSellHouse?: boolean;
  canMortgage?: boolean;
  canUnmortgage?: boolean;
  sellRefund?: number | null;
  mortgageAmount?: number | null;
  unmortgageCost?: number | null;
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

export interface MonopolyPendingTrade {
  id: string;
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  offerCash: number;
  askCash: number;
  offerSpaces: number[];
  askSpaces: number[];
  offerSpaceNames: string[];
  askSpaceNames: string[];
}

export interface MonopolyState {
  phase: string;
  currentPlayerId: string | null;
  currentTurnName: string;
  winner: string | null;
  lastDice: { d1: number; total: number; bonus: boolean } | null;
  pendingCard: { id: string; text: string; kind?: string } | null;
  pendingCardPick: {
    id: string;
    playerId: string;
    playerName: string;
    kind: string;
    count: number;
    isMine: boolean;
  } | null;
  pendingNotice: { id: string; kind: string; title: string; text: string } | null;
  pendingTrade: MonopolyPendingTrade | null;
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
  canPickCard?: boolean;
  canProposeTrade?: boolean;
  canRespondTrade?: boolean;
  canCancelTrade?: boolean;
  buyOffer: { index: number; name: string; price: number } | null;
  jailFee: number;
  myName: string;
}
