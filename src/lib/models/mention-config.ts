import { SelectionCallback } from './selection-callback.model';

export class MentionConfig {
  constructor(
    public triggerChar: string,
    public filterListItems: boolean,
    public insertOnSpace: boolean,
    public selectionCallback: SelectionCallback,
  ) { }
}