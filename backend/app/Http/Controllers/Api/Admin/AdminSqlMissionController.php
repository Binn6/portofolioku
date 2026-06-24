<?php
// backend/app/Http/Controllers/Api/Admin/AdminSqlMissionController.php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SqlMission;
use Illuminate\Http\Request;

class AdminSqlMissionController extends Controller
{
    public function index(Request $request)
    {
        $query = SqlMission::orderBy('stage_order');

        if ($request->has('dataset_id')) {
            $query->where('dataset_id', $request->dataset_id);
        }

        $missions = $query->get()
            ->map(fn($m) => array_merge($m->toArray(), ['id' => (string) $m->_id]));

        return response()->json($missions->values());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'dataset_id'    => 'required|string',
            'stage_order'   => 'required|integer|min:1',
            'title'         => 'required|string|max:255',
            'briefing'      => 'required|string',
            'tables'        => 'required|array',
            'tables.*'      => 'string',
            'objectives'    => 'required|array',
            'objectives.*.col'  => 'required|string',
            'objectives.*.desc' => 'required|string',
            'ordering_hint' => 'nullable|string',
            'ordered'       => 'boolean',
            'starter_sql'   => 'nullable|string',
            'solution_query'=> 'required|string',
            'rank_unlock'   => 'nullable|string|max:100',
            'is_active'     => 'boolean',
            'difficulty'    => 'nullable|integer|min:1|max:5',
        ]);

        $mission = SqlMission::create($data);

        return response()->json(
            array_merge($mission->toArray(), ['id' => (string) $mission->_id]),
            201
        );
    }

    public function update(Request $request, string $id)
    {
        $mission = SqlMission::findOrFail($id);

        $data = $request->validate([
            'dataset_id'    => 'sometimes|string',
            'stage_order'   => 'sometimes|integer|min:1',
            'title'         => 'sometimes|string|max:255',
            'briefing'      => 'sometimes|string',
            'tables'        => 'sometimes|array',
            'tables.*'      => 'string',
            'objectives'    => 'sometimes|array',
            'objectives.*.col'  => 'required_with:objectives|string',
            'objectives.*.desc' => 'required_with:objectives|string',
            'ordering_hint' => 'nullable|string',
            'ordered'       => 'boolean',
            'starter_sql'   => 'nullable|string',
            'solution_query'=> 'sometimes|string',
            'rank_unlock'   => 'nullable|string|max:100',
            'is_active'     => 'boolean',
            'difficulty'    => 'nullable|integer|min:1|max:5',
        ]);

        $mission->update($data);

        return response()->json(array_merge($mission->fresh()->toArray(), ['id' => $id]));
    }

    public function destroy(string $id)
    {
        SqlMission::findOrFail($id)->delete();
        return response()->json(['message' => 'Mission dihapus']);
    }

    public function fixObjectives()
    {
        try {
            $missions = SqlMission::all();

            // Pre-load all datasets keyed by _id for schema lookups
            $datasets = \App\Models\SqlDataset::all()
                ->mapWithKeys(fn($d) => [(string) $d->_id => $d]);

            $fixed = 0;
            $skipped = 0;

            foreach ($missions as $mission) {
                $cols = $this->parseSelectColumns($mission->solution_query ?? '');

                // SELECT * or un-parsable → fall back to schema-derived columns
                if (empty($cols)) {
                    $dataset = $datasets->get((string) $mission->dataset_id);
                    if ($dataset) {
                        $tables = is_array($mission->tables) ? $mission->tables : [];
                        $cols   = $this->colsFromSchema($dataset->schema_sql ?? '', $tables);
                    }
                }

                if (empty($cols)) { $skipped++; continue; }

                // Preserve existing descriptions keyed by col name
                $existingDescs = [];
                foreach ($mission->objectives ?? [] as $o) {
                    $o   = is_array($o) ? $o : (array) $o;
                    $col = strtolower(trim($o['col'] ?? ''));
                    if ($col !== '') $existingDescs[$col] = $o['desc'] ?? '';
                }

                // Rebuild objectives 1-to-1 from parsed columns
                $updated = array_map(fn($col) => [
                    'col'  => $col,
                    'desc' => $existingDescs[$col] ?? "Kolom {$col} ada dalam hasil query",
                ], $cols);

                $mission->objectives = $updated;
                $mission->save();
                $fixed++;
            }

            return response()->json(['fixed' => $fixed, 'skipped' => $skipped]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Derive column names from CREATE TABLE statements in schema SQL.
     * If $tables is provided, only columns from those tables are returned.
     */
    private function colsFromSchema(string $schemaSql, array $tables = []): array
    {
        $result = [];

        // Match all CREATE TABLE blocks
        preg_match_all(
            '/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"\[]?(\w+)[`"\]]?\s*\((.+?)\)\s*;/is',
            $schemaSql,
            $matches,
            PREG_SET_ORDER
        );

        foreach ($matches as $match) {
            $tableName = strtolower($match[1]);

            // If specific tables requested, skip others
            if (!empty($tables) && !in_array($tableName, array_map('strtolower', $tables))) {
                continue;
            }

            $body = $match[2];

            foreach (preg_split('/,\s*\n/', $body) as $line) {
                $line = trim($line);
                // Skip table-level constraints
                if (preg_match('/^(?:PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT)\b/i', $line)) continue;
                // Extract column name (first identifier on the line)
                if (preg_match('/^[`"\[]?([a-zA-Z_]\w*)[`"\]]?\s+\w/i', $line, $cm)) {
                    $col = strtolower($cm[1]);
                    if (!in_array($col, $result)) $result[] = $col;
                }
            }
        }

        return $result;
    }

    private function parseSelectColumns(string $sql): array
    {
        $sql = preg_replace('/\s+/', ' ', trim($sql));

        if (!preg_match('/^SELECT\s+(?:DISTINCT\s+)?(.+?)\s+FROM\s/is', $sql, $m)) {
            return [];
        }

        $clause = $m[1];
        if (trim($clause) === '*') return [];

        // Split by comma while respecting parentheses depth
        $parts = [];
        $depth = 0;
        $buf   = '';
        for ($i = 0, $len = strlen($clause); $i < $len; $i++) {
            $ch = $clause[$i];
            if ($ch === '(') $depth++;
            elseif ($ch === ')') $depth--;
            elseif ($ch === ',' && $depth === 0) {
                $parts[] = trim($buf);
                $buf     = '';
                continue;
            }
            $buf .= $ch;
        }
        if (($t = trim($buf)) !== '') $parts[] = $t;

        $result = [];
        foreach ($parts as $part) {
            if (preg_match('/\bAS\s+[`"\']?(\w+)[`"\']?\s*$/i', $part, $pm)) {
                $result[] = strtolower($pm[1]);                // expr AS alias
            } elseif (preg_match('/\.(\w+)\s*$/', $part, $pm)) {
                $result[] = strtolower($pm[1]);                // table.column
            } elseif (preg_match('/^(\w+)\s*$/', $part, $pm)) {
                $result[] = strtolower($pm[1]);                // bare column
            }
            // expressions without aliases → leave slot empty (skip)
        }

        return array_values(array_filter($result));
    }

    public function reorder(Request $request)
    {
        $request->validate([
            'order'    => 'required|array',
            'order.*'  => 'string',
        ]);

        foreach ($request->order as $index => $missionId) {
            SqlMission::where('_id', $missionId)->update(['stage_order' => $index + 1]);
        }

        return response()->json(['message' => 'Urutan disimpan']);
    }
}
