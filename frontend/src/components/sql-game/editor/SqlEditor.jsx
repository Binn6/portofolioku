// frontend/src/components/sql-game/editor/SqlEditor.jsx
import { useRef, useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { sql } from '@codemirror/lang-sql'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView, keymap } from '@codemirror/view'
import { Prec } from '@codemirror/state'

const sqlGameTheme = EditorView.theme({
  '&': { background: '#111111 !important', fontSize: '13px' },
  '.cm-content': { fontFamily: '"JetBrains Mono", monospace', padding: '12px 0' },
  '.cm-line': { padding: '0 12px' },
  '.cm-gutters': { background: '#0a0a0a', borderRight: '1px solid #2a2a2a' },
  '.cm-activeLineGutter': { background: '#1a1a1a' },
  '.cm-activeLine': { background: '#1a1a1a' },
  '.cm-cursor': { borderLeftColor: '#00FF41' },
  '.cm-selectionBackground': { background: 'rgba(0,255,65,0.15) !important' },
  '.cm-tooltip-autocomplete': { background: '#0a0a0a', border: '1px solid #2a2a2a' },
  '.cm-completionLabel': { color: '#00FF41' },
  '.cm-completionDetail': { color: '#6B7280', fontSize: '11px' },
})

/**
 * @param {{ value: string, onChange: (v:string)=>void, schema: {name:string, columns:{name:string,type:string}[]}[], onRun: ()=>void, onDeploy: ()=>void }} props
 */
export function SqlEditor({ value, onChange, schema = [], onRun, onDeploy }) {
  const onRunRef = useRef(onRun)
  const onDeployRef = useRef(onDeploy)
  onRunRef.current = onRun
  onDeployRef.current = onDeploy

  const schemaMap = useMemo(() => {
    const map = {}
    schema.forEach(t => { map[t.name] = t.columns.map(c => c.name) })
    return map
  }, [schema])

  const extensions = useMemo(() => [
    sql({ schema: schemaMap, upperCaseKeywords: true }),
    sqlGameTheme,
    Prec.high(keymap.of([
      {
        key: 'Ctrl-Enter',
        mac: 'Cmd-Enter',
        run: () => { onRunRef.current?.(); return true },
      },
      {
        key: 'Ctrl-Shift-Enter',
        mac: 'Cmd-Shift-Enter',
        run: () => { onDeployRef.current?.(); return true },
      },
    ])),
  ], [schemaMap])

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      theme={oneDark}
      basicSetup={{ lineNumbers: true, foldGutter: false, autocompletion: true }}
      className="flex-1 min-h-0 overflow-hidden border border-border rounded"
    />
  )
}
