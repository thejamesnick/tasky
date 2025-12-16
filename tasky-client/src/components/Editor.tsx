import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import './Editor.css';

interface EditorProps {
    content: string;
    onChange: (content: string) => void;
    color?: string;
}

export interface EditorHandle {
    focus: () => void;
}

const Editor = React.forwardRef<EditorHandle, EditorProps>(({ content, onChange, color }, ref) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Placeholder.configure({
                placeholder: 'Write something... or type "[] " to create a todo list.',
            }),
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    React.useImperativeHandle(ref, () => ({
        focus: () => {
            editor?.commands.focus();
        }
    }), [editor]);

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            if (editor.isEmpty) {
                editor.commands.setContent(content);
            }
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div
            className="editor-container"
            style={{ '--checkbox-color': color || 'var(--color-green-primary)' } as React.CSSProperties}
        >
            <EditorContent editor={editor} />
        </div>
    );
});

export default Editor;
