export interface FormationSlot {
  positionIndex: number;
  label: string;
  x: number; // 0-100 percentage across pitch width
  y: number; // 0-100 percentage along pitch length (0 = own goal line)
}

export interface Formation {
  id: string;
  name: string;
  slots: FormationSlot[];
}
