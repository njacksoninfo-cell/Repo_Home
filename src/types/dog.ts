export interface Dog {
  id: string;
  name: string;
  breed: string;
  age: string;
  sex: string;
  size: string;
  description: string;
  photos: string[];
  location: string;
  organizationName: string;
  url: string;
  distance?: string;
}

export type SwipeDirection = 'left' | 'right';

export interface SwipeResult {
  dog: Dog;
  direction: SwipeDirection;
  timestamp: number;
}
