import CodeMirror from '@uiw/react-codemirror'
import { sql } from '@codemirror/lang-sql'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'

const sqlGameTheme = EditorView.theme({
  '&': { background: '#111111 !important', fontSize: '13px' },
  '.cm-content': { fontFamily: '"JetBrains Mono", monospace', padding: '12px 0' },
  '.cm-line': { padding: '0 12px' },
  '.cm-gutters': { background: '#0a0a0a', borderRight: '1px solid #2a2a2a' },
  '.cm-activeLineGutter': { background: '#1a1a1a' },
  '.cm-activeLine': { background: '#1a1a1a' },
  '.cm-cursor': { borderLeftColor: '#00FF41' },
  '.cm-selectionBackground': { background: 'rgba(0,255,65,0.15) !important' },
})

export function SqlEditor({ value, onChange }) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={[sql(), sqlGameTheme]}
      theme={oneDark}
      basicSetup={{ lineNumbers: true, foldGutter: false, autocompletion: true }}
      className="flex-1 min-h-0 overflow-hidden border border-border rounded"
    />
  )
}
