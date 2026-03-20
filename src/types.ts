export type PetType = 'dog' | 'cat' | 'rabbit' | 'bird' | 'turtle' | 'snake' | 'other';

export interface Treatment {
  id: string;
  date: string;
  type: string;
  description: string;
  nextReminder?: string;
}

export interface Pet {
  id: string;
  name: string;
  type: PetType;
  breed: string;
  birthDate: string;
  weight: number;
  treatments: Treatment[];
  photoUrl?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
