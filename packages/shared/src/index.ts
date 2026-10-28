export const AVATARS = [
  { id: "riff", name: "Riff", image: "/avatars/identity-lineup.png", position: "0% 50%", color: "#b59cff", accent: "#3b2a64" },
  { id: "arc", name: "Arc", image: "/avatars/identity-lineup.png", position: "50% 50%", color: "#a5f3dc", accent: "#24483f" },
  { id: "muse", name: "Muse", image: "/avatars/identity-lineup.png", position: "100% 50%", color: "#d3c2ff", accent: "#49396a" }
] as const;

export const ACTIONS = [
  { id: "wave", name: "Wave", symbol: "👋" },
  { id: "cheer", name: "Cheer", symbol: "✨" },
  { id: "dance", name: "Dance", symbol: "♫" }
] as const;

export type AvatarId = (typeof AVATARS)[number]["id"];
export type ActionId = (typeof ACTIONS)[number]["id"];
export const COSMETICS = [
  { id: 'none', name: 'Original' },
  { id: 'headphones', name: 'Headphones' },
  { id: 'backpack', name: 'Backpack' },
  { id: 'lightstick', name: 'Lightstick' }
] as const;
export type CosmeticId = (typeof COSMETICS)[number]['id'];

export type Participant = {
  id: string;
  displayName: string;
  avatarId: AvatarId;
  x: number;
  y: number;
  action: ActionId | null;
  actionNonce: number;
  cosmetic: CosmeticId;
};

export type JoinPayload = {
  displayName: string;
  avatarId: AvatarId;
  cosmetic?: CosmeticId;
};

export type MovePayload = {
  dx: number;
  dy: number;
};

export type ServerToClientEvents = {
  roomState: (participants: Participant[]) => void;
};

export type ClientToServerEvents = {
  joinRoom: (payload: JoinPayload) => void;
  move: (payload: MovePayload) => void;
  performAction: (actionId: ActionId) => void;
};

