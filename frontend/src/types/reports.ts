import { Dataset } from "./datasets";
import { Notebook } from "./notebooks";

export type ShareMode = 'PRIVATE' | 'PUBLIC_READONLY' | 'PUBLIC_READWRITE';

export interface Report {
  id: string;
  notebook: Notebook;
  dataset: Dataset;
  created_at: Date;
  updated_at: Date;

  share_mode: ShareMode;
  discoverable: boolean;
}

export interface GPTOutput {
  id: string;
  choices: {
    text: string;
    index: number;
  }[]
}
