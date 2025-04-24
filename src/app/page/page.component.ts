import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Editor } from '@tiptap/core';
import { CommonModule } from '@angular/common';
import { TiptapEditorDirective } from 'ngx-tiptap';
import { StarterKit } from '@tiptap/starter-kit';
import { Subscript } from '@tiptap/extension-subscript';
import { Underline } from '@tiptap/extension-underline';
import { Superscript } from '@tiptap/extension-superscript';
import { Highlight } from '@tiptap/extension-highlight';
import {GridsterComponent, GridsterConfig, GridsterItem, GridsterItemComponent} from 'angular-gridster2';

import '@spectrum-web-components/bundle/elements.js';
import '@spectrum-web-components/theme/spectrum-two/scale-medium.js';
import '@spectrum-web-components/theme/spectrum-two/theme-dark.js';

interface EditorItem extends GridsterItem {
  editor: Editor;
  id: number;
}

@Component({
  selector: 'app-page',
  imports: [CommonModule, TiptapEditorDirective, GridsterComponent, GridsterItemComponent],
  standalone: true,
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PageComponent {
  options: GridsterConfig = {
    gridType: 'scrollVertical',
    minCols: 5,
    maxCols: 10,
    minRows: 5,
    maxRows: 10,
    defaultItemCols: 1,
    defaultItemRows: 1,
    draggable: {
      enabled: true,
      ignoreContentClass: 'editor-container'
    },
    resizable: { enabled: true },
    pushItems: true
  }
  editors: EditorItem[] = [];
  nextId = 1;
  focusedEditor: Editor | null = null;

  toolbarActions = [
    {
      iconHtml: '<i class="fa-solid fa-bold"></i>',
      tooltip: 'Bold',
      mark: 'bold',
      action: (editor: Editor) => editor.chain().focus().toggleBold().run()
    },
    {
      iconHtml: '<i class="fa-solid fa-italic"></i>',
      tooltip: 'Italic',
      mark: 'italic',
      action: (editor: Editor) => editor.chain().focus().toggleItalic().run()
    },
    {
      iconHtml: '<i class="fa-solid fa-underline"></i>',
      tooltip: 'Underline',
      mark: 'underline',
      action: (editor: Editor) => editor.chain().focus().toggleUnderline().run()
    },
    {
      iconHtml: '<i class="fa-solid fa-quote-left"></i>',
      tooltip: 'Blockquote',
      mark: 'blockquote',
      action: (editor: Editor) => editor.chain().focus().toggleBlockquote().run()
    },
    {
      iconHtml: '<i class="fa-solid fa-code"></i>',
      tooltip: 'Code Block',
      mark: 'codeBlock',
      action: (editor: Editor) => editor.chain().focus().toggleCodeBlock().run()
    },
    {
      iconHtml: '<i class="fa-solid fa-list-ul"></i>',
      tooltip: 'Bullet List',
      mark: 'bulletList',
      action: (editor: Editor) => editor.chain().focus().toggleBulletList().run()
    },
    {
      iconHtml: '<i class="fa-solid fa-list-ol"></i>',
      tooltip: 'Ordered List',
      mark: 'orderedList',
      action: (editor: Editor) => editor.chain().focus().toggleOrderedList().run()
    },
    {
      iconHtml: '<i class="fa-solid fa-strikethrough"></i>',
      tooltip: 'Strike',
      mark: 'strike',
      action: (editor: Editor) => editor.chain().focus().toggleStrike().run()
    },
    {
      iconHtml: '<i class="fa-solid fa-heading"></i>1',
      tooltip: 'H1',
      mark: 'heading',
      opts: { level: 1 },
      action: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 1 }).run()
    },
    {
      iconHtml: '<i class="fa-solid fa-heading"></i>2',
      tooltip: 'H2',
      mark: 'heading',
      opts: { level: 2 },
      action: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 2 }).run()
    },
    {
      iconHtml: '<i class="fa-solid fa-heading"></i>3',
      tooltip: 'H3',
      mark: 'heading',
      opts: { level: 3 },
      action: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 3 }).run()
    },
    {
      iconHtml: '<i class="fa-solid fa-subscript"></i>',
      tooltip: 'Subscript',
      mark: 'subscript',
      action: (editor: Editor) => editor.chain().focus().toggleSubscript().run()
    },
    {
      iconHtml: '<i class="fa-solid fa-superscript"></i>',
      tooltip: 'Superscript',
      mark: 'superscript',
      action: (editor: Editor) => editor.chain().focus().toggleSuperscript().run()
    },
    {
      iconHtml: '<i class="fa-solid fa-highlighter"></i>',
      tooltip: 'Highlight',
      mark: 'highlight',
      action: (editor: Editor) => editor.chain().focus().toggleHighlight().run()
    }
  ];

  addEditor() {
    const editor = new Editor({
      extensions: [StarterKit, Underline, Subscript, Superscript, Highlight],
      onFocus: () => {
        console.log('Editor focused:', editor);
        this.setFocusedEditor(editor);
      },
      onBlur: ({ event }) => {
        console.log('Editor blurred');
        this.clearFocusedEditor();
      }
    });
    this.editors.push({ editor, id: this.nextId++ } as EditorItem);
  }

  removeEditor(id: number) {
    this.editors = this.editors.filter(item => item.id !== id);
    this.clearFocusedEditor();
  }

  setFocusedEditor(editor: Editor) {
    console.log('Setting focused editor:', editor);
    this.focusedEditor = editor;
  }

  clearFocusedEditor() {
    setTimeout(() => this.focusedEditor = null, 100);
  }

  execToolbarAction(action: (editor: Editor) => void) {
    console.log('Executing toolbar action');
    if (!this.focusedEditor) {
      console.warn('No focused editor!');
      return;
    }

    const result = action(this.focusedEditor);
    console.log('Action result:', result);
  }

  isSelected(mark: string, opts?: any) {
    return this.focusedEditor?.isActive(mark, opts) || false;
  }

  onToolbarMouseDown(event: MouseEvent) {
    event.preventDefault();
  }
}
