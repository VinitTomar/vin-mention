# VinMention

## Description
There are many libraries for mentions or tributes for core javascript imeplementation. But there is no library for angular which can properyly work with `angular forms`. For this purpose I have created this library so that developers can use it in their project without any issue.

## Installation

npm install --save vin-mention.

## Usage

1. Use `mentionInput` directive at content editable element. eg:
```
<div vinContentEditable="innerHTML" [formControl]="fc" matContentEditableInput [mentionInput]="mymentions" placeholder="content editable"></div>
```

2. Add MentionConfig
```
this.mentionConfig = {
  filterListItems: true,
  insertOnSpace: true,
  triggerChar: '@',
  selectionCallback: this.githubSelCall
}
```

3. Provide the mention list menu as the content of the `vin-mention` component. eg:
```
<vin-mention #mymentions="vinMention" [config]="mentionConfig">
    <mat-card>
      <mat-action-list>
        <button mat-list-item *ngFor="let item of mentionList;" [mentionListItem]="item">
          {{item.data.value}} </button>
      </mat-action-list>
    </mat-card>
  </vin-mention>
```
You can design the menu how ever you want. Just take care or using `mentionListItem` with an input value of type `MentionListItemConfig`.

DO NOT FORGET TO PROVIDE `selectionCallback` AS CONFIG TO THE `vin-metion`, WITH THE FOLLWOING SIGNATURE. 
SelectionCallback function will be call when user have selected an item from the list. The returned value from the callback will be inserted at the place of mention.

```
(selectedItem: MentionListItemConfig) => string;
```

## Tips
1. You can provide extra config to `vin-mention` by using the following structure.
```
class MentionConfig {
  constructor(
    public triggerChar: string,
    public filterListItems: boolean,
    public insertOnSpace: boolean,
    public selectionCallback: SelectionCallback,
  ) { }
}
```

2. If you are using `vin-mention` wiht contenteditable element, please use with `vin-content-editable` package for better support. However you can use your own controlvalueaccessor implementation for content editalbe element.

## Example
Here is [demo](https://stackblitz.com/edit/vin-mention-demo).


### Please have a look at 
[vin-content-editable](https://www.npmjs.com/package/vin-content-editable).