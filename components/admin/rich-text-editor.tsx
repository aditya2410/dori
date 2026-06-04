'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, List, ListOrdered, Heading2, Heading3, Pilcrow } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? 'Write a description…' }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'min-h-[160px] px-3 py-2 text-sm focus:outline-none',
      },
    },
    immediatelyRender: false,
  })

  if (!editor) return null

  const tools = [
    {
      label: 'Bold',
      icon: Bold,
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive('bold'),
    },
    {
      label: 'Italic',
      icon: Italic,
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive('italic'),
    },
    { separator: true },
    {
      label: 'Heading 2',
      icon: Heading2,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive('heading', { level: 2 }),
    },
    {
      label: 'Heading 3',
      icon: Heading3,
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      active: editor.isActive('heading', { level: 3 }),
    },
    {
      label: 'Paragraph',
      icon: Pilcrow,
      action: () => editor.chain().focus().setParagraph().run(),
      active: editor.isActive('paragraph'),
    },
    { separator: true },
    {
      label: 'Bullet list',
      icon: List,
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive('bulletList'),
    },
    {
      label: 'Numbered list',
      icon: ListOrdered,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive('orderedList'),
    },
  ]

  return (
    <div className="border border-input rounded-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 p-1.5 border-b border-border bg-secondary/30 flex-wrap">
        {tools.map((tool, i) =>
          'separator' in tool ? (
            <div key={i} className="w-px h-4 bg-border mx-1" />
          ) : (
            <button
              key={tool.label}
              type="button"
              onClick={tool.action}
              title={tool.label}
              className={cn(
                'p-1.5 rounded transition-colors',
                tool.active
                  ? 'bg-foreground text-background'
                  : 'hover:bg-secondary text-muted-foreground hover:text-foreground',
              )}
            >
              <tool.icon className="size-3.5" />
            </button>
          ),
        )}
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="[&_.tiptap_p]:mb-3 [&_.tiptap_h2]:font-serif [&_.tiptap_h2]:text-xl [&_.tiptap_h2]:font-normal [&_.tiptap_h2]:mt-4 [&_.tiptap_h2]:mb-2 [&_.tiptap_h3]:font-medium [&_.tiptap_h3]:mt-3 [&_.tiptap_h3]:mb-1.5 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ul]:mb-3 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_ol]:mb-3 [&_.tiptap_li]:mb-0.5 [&_.tiptap.ProseMirror-focused]:outline-none [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none"
      />
    </div>
  )
}
