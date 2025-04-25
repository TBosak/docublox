import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
  ChangeDetectorRef,
} from '@angular/core';
import { Editor } from '@tiptap/core';
import { CommonModule } from '@angular/common';
import { TiptapEditorDirective } from 'ngx-tiptap';
import { StarterKit } from '@tiptap/starter-kit';
import { Subscript } from '@tiptap/extension-subscript';
import { Underline } from '@tiptap/extension-underline';
import { Superscript } from '@tiptap/extension-superscript';
import { Highlight } from '@tiptap/extension-highlight';
import { Image } from '@tiptap/extension-image';
import { ImageResize } from 'tiptap-extension-resize-image';
import {
  GridsterComponent,
  GridsterConfig,
  GridsterItem,
  GridsterItemComponent,
} from 'angular-gridster2';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import '@spectrum-web-components/bundle/elements.js';
import '@spectrum-web-components/theme/spectrum-two/scale-medium.js';
import '@spectrum-web-components/theme/spectrum-two/theme-dark.js';

interface EditorItem extends GridsterItem {
  editor: Editor;
  id: number;
}

@Component({
  selector: 'app-page',
  imports: [
    CommonModule,
    TiptapEditorDirective,
    GridsterComponent,
    GridsterItemComponent,
  ],
  standalone: true,
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PageComponent implements AfterViewInit {
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;
  @ViewChildren('pageZone', { read: ElementRef })
  pageZones!: QueryList<ElementRef>;
  private _isExporting = false;
  private nextFocusedEditor: Editor | null = null;
  visiblePageIndex = 0;
  pages: { id: number; items: EditorItem[] }[] = [{ id: 0, items: [] }];
  options: GridsterConfig = {
    gridType: 'scrollVertical',
    minCols: 10,
    minRows: 10,
    defaultItemCols: 1,
    defaultItemRows: 1,
    draggable: {
      enabled: true,
      ignoreContentClass: 'editor-container',
    },
    resizable: { enabled: true },
    pushItems: true,
    showGrid: false,
    allowMultiLayer: true,
    useTransformPositioning: false
  };
  editors: EditorItem[] = [];
  nextId = 1;
  focusedEditor: Editor | null = null;

  toolbarActions = [
    {
      iconHtml: '<i class="fa-solid fa-bold"></i>',
      tooltip: 'Bold',
      mark: 'bold',
      action: (editor: Editor) => editor.chain().focus().toggleBold().run(),
    },
    {
      iconHtml: '<i class="fa-solid fa-italic"></i>',
      tooltip: 'Italic',
      mark: 'italic',
      action: (editor: Editor) => editor.chain().focus().toggleItalic().run(),
    },
    {
      iconHtml: '<i class="fa-solid fa-underline"></i>',
      tooltip: 'Underline',
      mark: 'underline',
      action: (editor: Editor) =>
        editor.chain().focus().toggleUnderline().run(),
    },
    {
      iconHtml: '<i class="fa-solid fa-quote-left"></i>',
      tooltip: 'Blockquote',
      mark: 'blockquote',
      action: (editor: Editor) =>
        editor.chain().focus().toggleBlockquote().run(),
    },
    {
      iconHtml: '<i class="fa-solid fa-code"></i>',
      tooltip: 'Code Block',
      mark: 'codeBlock',
      action: (editor: Editor) =>
        editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      iconHtml: '<i class="fa-solid fa-list-ul"></i>',
      tooltip: 'Bullet List',
      mark: 'bulletList',
      action: (editor: Editor) =>
        editor.chain().focus().toggleBulletList().run(),
    },
    {
      iconHtml: '<i class="fa-solid fa-list-ol"></i>',
      tooltip: 'Ordered List',
      mark: 'orderedList',
      action: (editor: Editor) =>
        editor.chain().focus().toggleOrderedList().run(),
    },
    {
      iconHtml: '<i class="fa-solid fa-strikethrough"></i>',
      tooltip: 'Strike',
      mark: 'strike',
      action: (editor: Editor) => editor.chain().focus().toggleStrike().run(),
    },
    {
      iconHtml: '<i class="fa-solid fa-heading"></i>1',
      tooltip: 'H1',
      mark: 'heading',
      opts: { level: 1 },
      action: (editor: Editor) =>
        editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      iconHtml: '<i class="fa-solid fa-heading"></i>2',
      tooltip: 'H2',
      mark: 'heading',
      opts: { level: 2 },
      action: (editor: Editor) =>
        editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      iconHtml: '<i class="fa-solid fa-heading"></i>3',
      tooltip: 'H3',
      mark: 'heading',
      opts: { level: 3 },
      action: (editor: Editor) =>
        editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      iconHtml: '<i class="fa-solid fa-subscript"></i>',
      tooltip: 'Subscript',
      mark: 'subscript',
      action: (editor: Editor) =>
        editor.chain().focus().toggleSubscript().run(),
    },
    {
      iconHtml: '<i class="fa-solid fa-superscript"></i>',
      tooltip: 'Superscript',
      mark: 'superscript',
      action: (editor: Editor) =>
        editor.chain().focus().toggleSuperscript().run(),
    },
    {
      iconHtml: '<i class="fa-solid fa-highlighter"></i>',
      tooltip: 'Highlight',
      mark: 'highlight',
      action: (editor: Editor) =>
        editor.chain().focus().toggleHighlight().run(),
    },
    {
      iconHtml: '<i class="fa-solid fa-image"></i>',
      tooltip: 'Insert Image',
      mark: 'image',
      action: () => this.triggerImageUpload(),
    },
  ];

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = this.pageZones
              .toArray()
              .findIndex((el) => el.nativeElement === entry.target);
            if (index !== -1) this.visiblePageIndex = index;
          }
        }
      },
      {
        threshold: 0.5,
      }
    );

    this.pageZones.changes.subscribe(() => {
      this.pageZones.forEach((page) => observer.observe(page.nativeElement));
    });

    this.pageZones.forEach((page) => observer.observe(page.nativeElement));
  }

  removeEditor(pageId: number, editorId: number) {
    const page = this.pages.find((p) => p.id === pageId);
    if (page) {
      page.items = page.items.filter((item) => item.id !== editorId);
    }
    this.clearFocusedEditor();
  }

  setFocusedEditor(editor: Editor) {
    this.nextFocusedEditor = editor;
    this.focusedEditor = editor;
  }

  clearFocusedEditor() {
    const expected = this.nextFocusedEditor;
    setTimeout(() => {
      if (this.focusedEditor === expected) {
        this.focusedEditor = null;
      }
    }, 100);
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

  triggerImageUpload() {
    this.imageInput?.nativeElement?.click();
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file || !this.focusedEditor) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.focusedEditor?.chain().focus().setImage({ src: base64 }).run();
    };
    reader.readAsDataURL(file);

    // Clear input so re-uploading same file works
    input.value = '';
  }

  async exportToPDF() {
    this.isExporting = true;
    await new Promise((r) => setTimeout(r, 50)); // let CSS take effect

    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    });
    const zones = Array.from(
      document.querySelectorAll('.page-zone')
    ) as HTMLElement[];

    for (let i = 0; i < zones.length; i++) {
      const canvas = await html2canvas(zones[i], {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });

      const img = canvas.toDataURL('image/png');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      if (i) pdf.addPage(); // addPage after the first one
      pdf.addImage(img, 'PNG', 0, 0, pageW, pageH);
    }

    pdf.save('docublox-export.pdf');
    this.isExporting = false;
  }

  addPage() {
    this.pages.push({ id: this.pages.length + 1, items: [] });
  }

  addEditorToPage() {
    const page = this.pages[this.visiblePageIndex];
    if (!page) return;

    const editor = new Editor({
      extensions: [
        StarterKit,
        Underline,
        Subscript,
        Superscript,
        Highlight,
        Image,
        ImageResize,
      ],
      onFocus: () => this.setFocusedEditor(editor),
      onBlur: () => this.clearFocusedEditor(),
    });

    page.items.push({ editor, id: this.nextId++ } as EditorItem);
  }

  addPageAfterVisible() {
    const newPage = { id: Date.now(), items: [] };
    this.pages.splice(this.visiblePageIndex + 1, 0, newPage);
    this.cdr.detectChanges();
  }

  trackById(index: number, item: { id: number }) {
    return item.id;
  }

  set isExporting(value: boolean) {
    this._isExporting = value;
    document.body.classList.toggle('exporting', value);
  }
  get isExporting() {
    return this._isExporting;
  }
}
