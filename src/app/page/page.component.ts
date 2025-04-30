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
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import ImageEditor from 'tui-image-editor';
import '@spectrum-web-components/bundle/elements.js';
import '@spectrum-web-components/theme/spectrum-two/scale-medium.js';
import '@spectrum-web-components/theme/spectrum-two/theme-dark.js';
import { FormsModule } from '@angular/forms';

interface EditorItem extends GridsterItem {
  editor: Editor;
  id: number;
}

@Component({
  selector: 'app-page',
  imports: [
    CommonModule,
    TiptapEditorDirective,
    // TiptapBubbleMenuDirective,
    GridsterComponent,
    GridsterItemComponent,
    FormsModule,
  ],
  standalone: true,
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PageComponent implements AfterViewInit {
  showImageEditor = false;
  private get hasEditor(): boolean {
    return !!this.tui;
  }
  private activeImgEl: HTMLImageElement | null = null;
  private activeTiptap!: Editor;
  private tui!: ImageEditor;
  brightness = 0;
  public cropping = false;
  private originalDataURL = '';
  penColor = '#ff4040';
  penSize = 8;
  textColour = '#ffffff';
  textSize = 48;
  private selectedTextId = -1;
  private penWidth = 8;
  private drawingPen = false;
  @ViewChild('tuiHost', { read: ElementRef }) host!: ElementRef<HTMLDivElement>;
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;
  @ViewChildren('pageZone', { read: ElementRef })
  pageZones!: QueryList<ElementRef>;
  private _isExporting = false;
  private nextFocusedEditor: Editor | null = null;
  visiblePageIndex = 0;
  pages: { id: number; items: EditorItem[] }[] = [{ id: 0, items: [] }];
  options: GridsterConfig = {
    margin: 1,
    gridType: 'fit',
    minCols: 10,
    minRows: 15,
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
    useTransformPositioning: false,
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

    input.value = '';
  }

  async exportToPDF() {
    this.isExporting = true;
    await new Promise((r) => setTimeout(r, 50));

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

      if (i) pdf.addPage();
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
        Highlight.configure({
          multicolor: true,
        }),
        Image,
        ImageResize,
        TextStyle,
        Color,
      ],
      onFocus: () => this.setFocusedEditor(editor),
      onBlur: () => this.clearFocusedEditor(),
      editorProps: {
        handleDOMEvents: {
          click: (_view, ev) => {
            const target = ev.target as HTMLElement;
            if (target?.tagName === 'IMG') {
              this.openImageEditor(target as HTMLImageElement, editor);
              return true;
            }
            return false;
          },
        },
      },
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

  trackByIndex(index: number): number {
    return index;
  }

  updateHighlightColor(event: Event) {
    event.stopPropagation();
    this.focusedEditor!.chain()
      .focus()
      .toggleHighlight({ color: (event.target as any).value })
      .run();
  }

  updateTextColor(event: Event) {
    event.stopPropagation();
    this.focusedEditor!.chain()
      .focus()
      .setColor((event.target as any).value)
      .run();
  }

  openImageEditor(imgEl: HTMLImageElement, ed: Editor) {
    this.activeImgEl = imgEl;
    this.activeTiptap = ed;
    this.originalDataURL = imgEl.src;
    this.tui?.destroy?.();
    this.tui = undefined!;
    this.showImageEditor = true;
    this.cdr.detectChanges();
    const hostEl = this.host.nativeElement;
    hostEl.style.width = '100%';
    hostEl.style.height = '';
    this.tui = new ImageEditor(hostEl, {
      cssMaxWidth: hostEl.offsetWidth,
      cssMaxHeight: Infinity,
      usageStatistics: false,
    });
    this.hookEditorEvents();
    this.tui.loadImageFromURL(imgEl.src, 'image').then(() => {});
  }

  rotate() {
    if (this.hasEditor) this.tui.rotate(90);
  }
  flipX() {
    if (this.hasEditor) this.tui.flipX();
  }
  flipY() {
    if (this.hasEditor) this.tui.flipY();
  }
  undo() {
    if (this.hasEditor) this.tui.undo();
  }
  redo() {
    if (this.hasEditor) this.tui.redo();
  }

  apply() {
    if (!this.hasEditor) {
      this.close();
      return;
    }
    const dataURL = this.tui.toDataURL({ format: 'png' });
    const { width, height } = this.activeImgEl!.dataset
      ? {
          width: parseInt(this.activeImgEl!.dataset['width'] || '0', 10),
          height: parseInt(this.activeImgEl!.dataset['height'] || '0', 10),
        }
      : {
          width: this.activeImgEl!.width,
          height: this.activeImgEl!.height,
        };
    const pos = this.activeTiptap.view.posAtDOM(this.activeImgEl!, 0);
    this.activeTiptap
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + 1 })
      .insertContent({
        type: 'image',
        attrs: { src: dataURL, width, height },
      })
      .run();
    this.close();
  }

  close() {
    if (this.tui) {
      this.tui.stopDrawingMode();
      this.tui.destroy();
      this.tui = undefined!;
    }
    this.showImageEditor = false;
  }

  startPen() {
    if (!this.hasEditor) {
      return;
    }
    this.tui.stopDrawingMode();
    this.tui.startDrawingMode('FREE_DRAWING', {
      width: this.penWidth,
      color: this.penColor,
    });
    this.drawingPen = true;
  }

  changePenColour(ev: Event) {
    this.penColor = (ev.target as HTMLInputElement).value;
    if (this.drawingPen) {
      this.tui.setBrush({ width: this.penWidth, color: this.penColor });
    }
  }

  onPenSizeChange(size: string | number) {
    this.penWidth = +size;
    if (this.drawingPen) {
      this.tui.setBrush({ width: this.penWidth, color: this.penColor });
    }
  }

  addText() {
    if (!this.hasEditor) {
      return;
    }
    this.tui.stopDrawingMode();
    const { width, height } = this.tui.getCanvasSize();
    const position = {
      x: width / 2,
      y: height / 2,
      originX: 'center',
      originY: 'center',
    };

    this.tui
      .addText('Double-click to edit', {
        position,
        styles: {
          fill: this.textColour,
          fontSize: this.textSize,
          fontWeight: 'bold',
        },
      })
      .then((obj) => {
        /* activate so user can drag immediately */
        (this.tui as any)._graphics
          .getCanvas()
          .setActiveObject((this.tui as any)._graphics.getObjectById(obj.id));
      });
  }

  reset() {
    if (!this.hasEditor) return;
    this.tui.loadImageFromURL(this.originalDataURL, 'reset');
    this.brightness = 0;
  }

  startCrop() {
    if (!this.hasEditor) return;

    if (!this.cropping) {
      this.tui.startDrawingMode('CROPPER');
      this.cropping = true;
    } else {
      const rect = this.tui.getCropzoneRect();
      if (rect.width && rect.height) {
        this.tui.crop(rect).then(() => {
          this.tui.stopDrawingMode();
          this.cropping = false;
        });
      } else {
        this.tui.discardSelection();
        this.tui.stopDrawingMode();
        this.cropping = false;
      }
    }
  }

  onTextColourChange(hex: string) {
    this.textColour = hex;
    if (this.selectedTextId !== -1) {
      this.tui.changeTextStyle(this.selectedTextId, { fill: this.textColour });
    }
  }

  onTextSizeChange(size: string | number) {
    this.textSize = +size;
    if (this.selectedTextId !== -1) {
      this.tui.changeTextStyle(this.selectedTextId, {
        fontSize: this.textSize,
      });
    }
  }

  private hookEditorEvents() {
    this.tui.on('objectActivated', ({ type, id, fill, fontSize }) => {
      if (type === 'i-text') {
        this.selectedTextId = id;
        this.textColour = fill as string;
        this.textSize = fontSize as number;
      }
    });
    this.tui.on('selectionCleared', () => (this.selectedTextId = -1));
  }

  set isExporting(value: boolean) {
    this._isExporting = value;
    document.body.classList.toggle('exporting', value);
  }
  get isExporting() {
    return this._isExporting;
  }
}
