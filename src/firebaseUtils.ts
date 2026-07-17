import { db } from './firebase';
import { ref, set, onValue, update, get, remove } from 'firebase/database';
import { CampaignState, RollResult } from './types';

export interface RoomUser {
  id: string;
  name: string;
  assignedPlayerId: string | null;
  notes: string;
}

export interface RoomState {
  campaign: CampaignState;
  users: Record<string, RoomUser>;
  participantRolls?: RollResult[];
}

// Generate a random 6-digit PIN
export const generatePin = () => Math.floor(100000 + Math.random() * 900000).toString();

export const createRoom = async (initialState: CampaignState): Promise<string> => {
  const pin = generatePin();
  const roomRef = ref(db, `rooms/${pin}`);
  
  // Make sure it doesn't exist
  const existing = await get(roomRef);
  if (existing.exists()) {
    return createRoom(initialState); // retry
  }

  // Remove undefined values
  const cleanState = JSON.parse(JSON.stringify(initialState));

  await set(roomRef, {
    campaign: cleanState,
    users: {}
  });
  
  return pin;
};

export const updateRoomCampaign = async (pin: string, campaign: CampaignState) => {
  const roomRef = ref(db, `rooms/${pin}`);
  const cleanCampaign = JSON.parse(JSON.stringify(campaign));
  await update(roomRef, {
    campaign: cleanCampaign
  });
};

export const joinRoom = async (pin: string, userId: string, userName: string) => {
  const roomRef = ref(db, `rooms/${pin}`);
  const snap = await get(roomRef);
  if (!snap.exists()) {
    throw new Error('Stanza non trovata');
  }
  
  const userRef = ref(db, `rooms/${pin}/users/${userId}`);
  await set(userRef, {
    id: userId,
    name: userName,
    assignedPlayerId: null,
    notes: ''
  });
};

export const subscribeToRoom = (pin: string, callback: (data: RoomState | null) => void) => {
  const roomRef = ref(db, `rooms/${pin}`);
  const unsubscribe = onValue(roomRef, (snap) => {
    if (snap.exists()) {
      callback(snap.val() as RoomState);
    } else {
      callback(null);
    }
  });
  return () => unsubscribe();
};

export const updateUser = async (pin: string, userId: string, updates: Partial<RoomUser>) => {
  const userRef = ref(db, `rooms/${pin}/users/${userId}`);
  await update(userRef, updates);
};

export const pushParticipantRoll = async (pin: string, roll: RollResult) => {
  const roomRef = ref(db, `rooms/${pin}`);
  const snap = await get(roomRef);
  if (snap.exists()) {
    const data = snap.val() as RoomState;
    const currentRolls = data.participantRolls || [];
    await update(roomRef, {
      participantRolls: [roll, ...currentRolls].slice(0, 10)
    });
  }
};

export const deleteRoom = async (pin: string) => {
  const roomRef = ref(db, `rooms/${pin}`);
  await remove(roomRef);
};

