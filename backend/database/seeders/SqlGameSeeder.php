<?php
// backend/database/seeders/SqlGameSeeder.php
namespace Database\Seeders;

use App\Models\SqlChapter;
use App\Models\SqlDataset;
use App\Models\SqlMission;
use App\Models\SqlSubchapter;
use Illuminate\Database\Seeder;

class SqlGameSeeder extends Seeder
{
    public function run(): void
    {
        SqlMission::truncate();
        SqlDataset::truncate();
        SqlSubchapter::truncate();
        SqlChapter::truncate();

        $chapters    = $this->seedChapters();
        $subchapters = $this->seedSubchapters($chapters);

        // ── BAB 1: Dasar SQL ────────────────────────────────────────
        $d11 = $this->seedUniversitasDataset($chapters[0], $subchapters[0][0]);
        $this->seedSelectMissions($d11);

        $d12 = $this->seedBungaIrisDataset($chapters[0], $subchapters[0][1]);
        $this->seedWhereMissions($d12);

        $d13 = $this->seedF1Dataset($chapters[0], $subchapters[0][2]);
        $this->seedOrderByMissions($d13);

        $d14 = $this->seedTokoElektronikDataset($chapters[0], $subchapters[0][3]);
        $this->seedAgregatMissions($d14);

        $d15 = $this->seedKafeDigitalDataset($chapters[0], $subchapters[0][4]);
        $this->seedGroupByMissions($d15);

        // ── BAB 2: JOIN ─────────────────────────────────────────────
        $d21 = $this->seedPerpustakaanDataset($chapters[1], $subchapters[1][0]);
        $this->seedInnerJoinMissions($d21);

        $d22 = $this->seedKepegawaianDataset($chapters[1], $subchapters[1][1]);
        $this->seedLeftJoinMissions($d22);

        $d23 = $this->seedJadwalKuliahDataset($chapters[1], $subchapters[1][2]);
        $this->seedRightJoinMissions($d23);

        $d24 = $this->seedKemitraanDataset($chapters[1], $subchapters[1][3]);
        $this->seedFullOuterJoinMissions($d24);

        $d25 = $this->seedStrukturPerusahaanDataset($chapters[1], $subchapters[1][4]);
        $this->seedCrossSelfJoinMissions($d25);
    }

    // ── Chapters & Subchapters ──────────────────────────────────────

    private function seedChapters(): array
    {
        $rows = [
            ['name' => 'BAB 1: Dasar SQL',          'description' => 'Perintah SQL fundamental: SELECT, WHERE, ORDER BY, LIMIT, dan fungsi agregasi',   'order' => 1, 'color' => '#00FF41'],
            ['name' => 'BAB 2: JOIN',                'description' => 'Menggabungkan data dari beberapa tabel menggunakan berbagai jenis JOIN',            'order' => 2, 'color' => '#00E5FF'],
            ['name' => 'BAB 3: Subquery & CTE',      'description' => 'Query bertingkat dan Common Table Expression (WITH)',                               'order' => 3, 'color' => '#FF00E5'],
            ['name' => 'BAB 4: Window Function',     'description' => 'Analisis data dengan ROW_NUMBER, RANK, LAG, LEAD, dan running totals',             'order' => 4, 'color' => '#FFE500'],
            ['name' => 'BAB 5: Logika Kondisional',  'description' => 'Percabangan dalam SQL: CASE WHEN, COALESCE, NULLIF',                               'order' => 5, 'color' => '#FF6B00'],
        ];

        $chapters = [];
        foreach ($rows as $row) {
            $chapters[] = SqlChapter::create($row);
        }
        return $chapters;
    }

    private function seedSubchapters(array $chapters): array
    {
        $definitions = [
            [
                ['name' => '1.1 SELECT Dasar',       'description' => 'SELECT *, SELECT kolom tertentu, dan alias kolom',              'order' => 1],
                ['name' => '1.2 WHERE & Filter',     'description' => 'Kondisi dengan AND, OR, NOT, BETWEEN, IN, LIKE',                'order' => 2],
                ['name' => '1.3 ORDER BY & LIMIT',   'description' => 'Mengurutkan hasil dan membatasi jumlah baris yang ditampilkan', 'order' => 3],
                ['name' => '1.4 Fungsi Agregasi',    'description' => 'COUNT, SUM, AVG, MIN, MAX untuk kalkulasi kolom',              'order' => 4],
                ['name' => '1.5 GROUP BY & HAVING',  'description' => 'Mengelompokkan data dan memfilter hasil agregasi',             'order' => 5],
            ],
            [
                ['name' => '2.1 INNER JOIN',                'description' => 'Gabungkan baris yang cocok di kedua tabel',                    'order' => 1],
                ['name' => '2.2 LEFT JOIN',                 'description' => 'Semua baris tabel kiri + baris kanan yang cocok',               'order' => 2],
                ['name' => '2.3 RIGHT JOIN',                'description' => 'Semua baris tabel kanan + baris kiri yang cocok',               'order' => 3],
                ['name' => '2.4 FULL OUTER JOIN',           'description' => 'Semua baris dari kedua tabel, NULL jika tidak ada pasangan',    'order' => 4],
                ['name' => '2.5 CROSS JOIN & Self JOIN',    'description' => 'Produk kartesian dan join tabel ke dirinya sendiri',            'order' => 5],
            ],
            [
                ['name' => '3.1 Subquery di WHERE',      'description' => 'Filter baris menggunakan hasil query lain',                          'order' => 1],
                ['name' => '3.2 Subquery di FROM',       'description' => 'Derived table: query bersarang sebagai sumber data',                 'order' => 2],
                ['name' => '3.3 Subquery Correlated',    'description' => 'Subquery yang mereferensikan kolom dari query luar',                 'order' => 3],
                ['name' => '3.4 CTE dengan WITH',        'description' => 'Common Table Expression untuk query lebih mudah dibaca',            'order' => 4],
                ['name' => '3.5 Recursive CTE',          'description' => 'CTE rekursif untuk traversal data hierarkis',                       'order' => 5],
            ],
            [
                ['name' => '4.1 ROW_NUMBER & RANK',          'description' => 'Penomoran baris dan ranking dengan fungsi jendela',              'order' => 1],
                ['name' => '4.2 DENSE_RANK & NTILE',         'description' => 'Ranking tanpa gap dan pembagian data ke dalam bucket',           'order' => 2],
                ['name' => '4.3 LAG & LEAD',                 'description' => 'Mengakses nilai baris sebelumnya atau berikutnya',               'order' => 3],
                ['name' => '4.4 Running Total & Moving Avg', 'description' => 'SUM/AVG OVER untuk akumulasi dan rata-rata bergerak',            'order' => 4],
                ['name' => '4.5 PARTITION BY',               'description' => 'Window function per partisi / grup data',                        'order' => 5],
            ],
            [
                ['name' => '5.1 CASE WHEN THEN ELSE',    'description' => 'Percabangan kondisional dasar dalam SQL',                           'order' => 1],
                ['name' => '5.2 COALESCE & NULLIF',      'description' => 'Menangani nilai NULL secara elegan',                                'order' => 2],
                ['name' => '5.3 IIF & Kondisi Nested',   'description' => 'Kondisi dalam kondisi dan ekspresi bersarang',                      'order' => 3],
                ['name' => '5.4 CASE dalam Agregasi',    'description' => 'CASE WHEN di dalam COUNT, SUM untuk pivoting data',                 'order' => 4],
                ['name' => '5.5 Conditional Filtering',  'description' => 'Filter dinamis berdasarkan kondisi data',                           'order' => 5],
            ],
        ];

        $all = [];
        foreach ($chapters as $i => $chapter) {
            $subs = [];
            foreach ($definitions[$i] as $def) {
                $subs[] = SqlSubchapter::create(array_merge($def, ['chapter_id' => (string) $chapter->_id]));
            }
            $all[] = $subs;
        }
        return $all;
    }

    // ── BAB 1.1 — Universitas (SELECT Dasar) ───────────────────────

    private function seedUniversitasDataset(mixed $ch, mixed $sub): mixed
    {
        $schema = <<<'SQL'
CREATE TABLE mahasiswa (
  id INTEGER PRIMARY KEY,
  nim TEXT NOT NULL,
  nama TEXT NOT NULL,
  jurusan TEXT NOT NULL,
  angkatan INTEGER NOT NULL,
  ipk REAL NOT NULL
);

CREATE TABLE mata_kuliah (
  id INTEGER PRIMARY KEY,
  kode_mk TEXT NOT NULL,
  nama_mk TEXT NOT NULL,
  sks INTEGER NOT NULL,
  semester INTEGER NOT NULL
);

CREATE TABLE dosen (
  id INTEGER PRIMARY KEY,
  nidn TEXT NOT NULL,
  nama TEXT NOT NULL,
  bidang_ilmu TEXT NOT NULL
);

CREATE TABLE pendaftaran (
  id INTEGER PRIMARY KEY,
  mahasiswa_id INTEGER NOT NULL,
  mata_kuliah_id INTEGER NOT NULL,
  dosen_id INTEGER NOT NULL,
  nilai TEXT NOT NULL,
  tahun_ajaran TEXT NOT NULL
);
SQL;

        $seed = <<<'SQL'
INSERT INTO mahasiswa VALUES
(1,'2021001','Budi Santoso','Teknik Informatika',2021,3.75),
(2,'2021002','Siti Rahayu','Sistem Informasi',2021,3.60),
(3,'2021003','Andi Wijaya','Teknik Informatika',2021,3.45),
(4,'2021004','Dewi Kurniawati','Manajemen Informatika',2021,3.85),
(5,'2021005','Rizki Pratama','Teknik Informatika',2021,3.20),
(6,'2020001','Ahmad Fauzi','Sistem Informasi',2020,3.55),
(7,'2020002','Nurul Hidayah','Teknik Informatika',2020,3.90),
(8,'2020003','Hendra Gunawan','Manajemen Informatika',2020,3.10),
(9,'2020004','Lestari Wulandari','Teknik Informatika',2020,3.70),
(10,'2020005','Fajar Setiawan','Sistem Informasi',2020,3.40),
(11,'2022001','Putri Anggraini','Teknik Informatika',2022,3.95),
(12,'2022002','Dimas Aditya','Sistem Informasi',2022,3.30);

INSERT INTO mata_kuliah VALUES
(1,'IF001','Pemrograman Dasar',3,1),
(2,'IF002','Basis Data',3,2),
(3,'IF003','Algoritma dan Struktur Data',3,3),
(4,'SI001','Sistem Informasi Manajemen',3,3),
(5,'IF004','Pemrograman Web',3,4),
(6,'IF005','Jaringan Komputer',3,5),
(7,'MI001','Manajemen Proyek IT',3,5),
(8,'IF006','Kecerdasan Buatan',3,6);

INSERT INTO dosen VALUES
(1,'0001234567','Dr. Ir. Bambang Susanto','Kecerdasan Buatan'),
(2,'0002345678','Prof. Dr. Sari Wahyuni','Basis Data'),
(3,'0003456789','Dr. Eko Prasetyo','Jaringan Komputer'),
(4,'0004567890','Ir. Fitri Handayani','Sistem Informasi'),
(5,'0005678901','Dr. Rudi Hermawan','Pemrograman');

INSERT INTO pendaftaran VALUES
(1,1,1,5,'A','2021/2022'),
(2,1,2,2,'A-','2021/2022'),
(3,2,1,5,'B+','2021/2022'),
(4,2,4,4,'A','2021/2022'),
(5,3,1,5,'B','2021/2022'),
(6,3,2,2,'A-','2021/2022'),
(7,4,4,4,'A','2021/2022'),
(8,5,1,5,'C+','2021/2022'),
(9,6,2,2,'B+','2020/2021'),
(10,7,3,3,'A','2020/2021'),
(11,8,7,4,'B','2020/2021'),
(12,9,3,3,'A-','2020/2021'),
(13,10,2,2,'B','2020/2021'),
(14,11,1,5,'A','2022/2023'),
(15,12,4,4,'B+','2022/2023');
SQL;

        return SqlDataset::create([
            'name'          => 'Universitas',
            'description'   => 'Database sistem akademik dengan data mahasiswa, mata kuliah, dosen, dan pendaftaran',
            'source'        => 'upload',
            'schema_sql'    => $schema,
            'seed_sql'      => $seed,
            'is_active'     => true,
            'chapter_id'    => (string) $ch->_id,
            'subchapter_id' => (string) $sub->_id,
        ]);
    }

    private function seedSelectMissions(mixed $dataset): void
    {
        $id = (string) $dataset->_id;
        $missions = [
            [
                'stage_order' => 1, 'difficulty' => 1,
                'title'       => 'Tampilkan Semua Mahasiswa',
                'briefing'    => 'Sistem butuh daftar lengkap seluruh mahasiswa yang terdaftar. Tampilkan semua data dari tabel mahasiswa.',
                'tables'      => ['mahasiswa'],
                'objectives'  => ['Tampilkan semua kolom', 'Tampilkan semua baris'],
                'ordered' => false, 'ordering_hint' => null,
                'starter_sql'    => "-- Gunakan SELECT untuk menampilkan semua data\nSELECT ",
                'solution_query' => 'SELECT * FROM mahasiswa',
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 2, 'difficulty' => 1,
                'title'       => 'Daftar Nama dan Jurusan',
                'briefing'    => 'Admin hanya butuh nama dan jurusan mahasiswa untuk laporan singkat. Tampilkan hanya dua kolom tersebut.',
                'tables'      => ['mahasiswa'],
                'objectives'  => ['Tampilkan kolom nama', 'Tampilkan kolom jurusan'],
                'ordered' => false, 'ordering_hint' => null,
                'starter_sql'    => "-- Pilih kolom spesifik yang dibutuhkan\nSELECT ",
                'solution_query' => 'SELECT nama, jurusan FROM mahasiswa',
                'rank_unlock'    => 'Query Runner',
            ],
            [
                'stage_order' => 3, 'difficulty' => 1,
                'title'       => 'Filter Jurusan TI',
                'briefing'    => 'Dekan Teknik Informatika meminta daftar seluruh mahasiswa jurusannya. Tampilkan hanya mahasiswa dari jurusan Teknik Informatika.',
                'tables'      => ['mahasiswa'],
                'objectives'  => ['Hanya mahasiswa Teknik Informatika', 'Gunakan WHERE clause'],
                'ordered' => false, 'ordering_hint' => null,
                'starter_sql'    => "-- Gunakan WHERE untuk filter data\nSELECT * FROM mahasiswa\nWHERE ",
                'solution_query' => "SELECT * FROM mahasiswa WHERE jurusan = 'Teknik Informatika'",
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 4, 'difficulty' => 2,
                'title'       => 'Mahasiswa Berprestasi',
                'briefing'    => 'Beasiswa tersedia untuk mahasiswa ber-IPK di atas 3.5. Tampilkan nama dan IPK mereka, urutkan dari IPK tertinggi.',
                'tables'      => ['mahasiswa'],
                'objectives'  => ['Filter IPK lebih dari 3.5', 'Urutkan dari IPK tertinggi'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY ipk DESC',
                'starter_sql'    => "-- Filter dan urutkan hasil query\nSELECT nama, ipk FROM mahasiswa\nWHERE ",
                'solution_query' => 'SELECT nama, ipk FROM mahasiswa WHERE ipk > 3.5 ORDER BY ipk DESC',
                'rank_unlock'    => 'Join Master',
            ],
            [
                'stage_order' => 5, 'difficulty' => 2,
                'title'       => 'Top 5 Mahasiswa',
                'briefing'    => 'Rektorat ingin tahu 5 mahasiswa terbaik berdasarkan IPK. Tampilkan nim, nama, dan ipk mereka saja.',
                'tables'      => ['mahasiswa'],
                'objectives'  => ['Tampilkan kolom nim, nama, ipk', 'Urutkan dari IPK tertinggi', 'Batasi hanya 5 baris'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY ipk DESC',
                'starter_sql'    => "-- Batasi hasil dengan LIMIT\nSELECT nim, nama, ipk FROM mahasiswa\nORDER BY ",
                'solution_query' => 'SELECT nim, nama, ipk FROM mahasiswa ORDER BY ipk DESC LIMIT 5',
                'rank_unlock'    => 'Index Wizard',
            ],
        ];
        $this->insertMissions($id, $missions);
    }

    // ── BAB 1.2 — Bunga Iris (WHERE & Filter) ──────────────────────

    private function seedBungaIrisDataset(mixed $ch, mixed $sub): mixed
    {
        $schema = <<<'SQL'
CREATE TABLE iris (
  id INTEGER PRIMARY KEY,
  panjang_kelopak REAL NOT NULL,
  lebar_kelopak   REAL NOT NULL,
  panjang_mahkota REAL NOT NULL,
  lebar_mahkota   REAL NOT NULL,
  spesies         TEXT NOT NULL
);
SQL;

        $seed = <<<'SQL'
INSERT INTO iris VALUES
(1,5.1,3.5,1.4,0.2,'setosa'),
(2,4.9,3.0,1.4,0.2,'setosa'),
(3,4.7,3.2,1.3,0.2,'setosa'),
(4,4.6,3.1,1.5,0.2,'setosa'),
(5,5.0,3.6,1.4,0.2,'setosa'),
(6,5.4,3.9,1.7,0.4,'setosa'),
(7,4.6,3.4,1.4,0.3,'setosa'),
(8,5.0,3.4,1.5,0.2,'setosa'),
(9,4.4,2.9,1.4,0.2,'setosa'),
(10,4.9,3.1,1.5,0.1,'setosa'),
(11,7.0,3.2,4.7,1.4,'versicolor'),
(12,6.4,3.2,4.5,1.5,'versicolor'),
(13,6.9,3.1,4.9,1.5,'versicolor'),
(14,5.5,2.3,4.0,1.3,'versicolor'),
(15,6.5,2.8,4.6,1.5,'versicolor'),
(16,5.7,2.8,4.5,1.3,'versicolor'),
(17,6.3,3.3,4.7,1.6,'versicolor'),
(18,4.9,2.4,3.3,1.0,'versicolor'),
(19,6.6,2.9,4.6,1.3,'versicolor'),
(20,5.2,2.7,3.9,1.4,'versicolor'),
(21,6.3,3.3,6.0,2.5,'virginica'),
(22,5.8,2.7,5.1,1.9,'virginica'),
(23,7.1,3.0,5.9,2.1,'virginica'),
(24,6.3,2.9,5.6,1.8,'virginica'),
(25,6.5,3.0,5.8,2.2,'virginica'),
(26,7.6,3.0,6.6,2.1,'virginica'),
(27,4.9,2.5,4.5,1.7,'virginica'),
(28,7.3,2.9,6.3,1.8,'virginica'),
(29,6.7,2.5,5.8,1.8,'virginica'),
(30,7.2,3.6,6.1,2.5,'virginica');
SQL;

        return SqlDataset::create([
            'name'          => 'Bunga Iris',
            'description'   => 'Dataset klasik UCI Machine Learning — pengukuran 3 spesies bunga iris (setosa, versicolor, virginica)',
            'source'        => 'uci',
            'source_ref'    => '53',
            'schema_sql'    => $schema,
            'seed_sql'      => $seed,
            'is_active'     => true,
            'chapter_id'    => (string) $ch->_id,
            'subchapter_id' => (string) $sub->_id,
        ]);
    }

    private function seedWhereMissions(mixed $dataset): void
    {
        $id = (string) $dataset->_id;
        $missions = [
            [
                'stage_order' => 1, 'difficulty' => 1,
                'title'       => 'Isolasi Spesies Setosa',
                'briefing'    => 'Peneliti hanya membutuhkan data bunga iris spesies setosa. Filter tabel iris dan tampilkan hanya baris dengan spesies tersebut.',
                'tables'      => ['iris'],
                'objectives'  => ['Gunakan WHERE dengan kondisi teks', 'Hanya tampilkan spesies setosa'],
                'ordered' => false, 'ordering_hint' => null,
                'starter_sql'    => "SELECT * FROM iris\nWHERE ",
                'solution_query' => "SELECT * FROM iris WHERE spesies = 'setosa'",
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 2, 'difficulty' => 1,
                'title'       => 'Kelopak Panjang',
                'briefing'    => 'Klasifikasi berikutnya memerlukan bunga dengan panjang kelopak (panjang_kelopak) minimal 6.5 cm. Tampilkan semua baris yang memenuhi syarat.',
                'tables'      => ['iris'],
                'objectives'  => ['Filter dengan operator perbandingan >=', 'panjang_kelopak >= 6.5'],
                'ordered' => false, 'ordering_hint' => null,
                'starter_sql'    => "SELECT * FROM iris\nWHERE panjang_kelopak ",
                'solution_query' => 'SELECT * FROM iris WHERE panjang_kelopak >= 6.5',
                'rank_unlock'    => 'Where Beginner',
            ],
            [
                'stage_order' => 3, 'difficulty' => 2,
                'title'       => 'Rentang Panjang Mahkota',
                'briefing'    => 'Eksperimen membutuhkan bunga dengan panjang mahkota (panjang_mahkota) antara 4.0 dan 5.5 cm. Gunakan BETWEEN untuk memfilter data.',
                'tables'      => ['iris'],
                'objectives'  => ['Gunakan BETWEEN ... AND ...', 'panjang_mahkota antara 4.0 dan 5.5'],
                'ordered' => false, 'ordering_hint' => null,
                'starter_sql'    => "SELECT * FROM iris\nWHERE panjang_mahkota ",
                'solution_query' => 'SELECT * FROM iris WHERE panjang_mahkota BETWEEN 4.0 AND 5.5',
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 4, 'difficulty' => 2,
                'title'       => 'Dua Spesies Sekaligus',
                'briefing'    => 'Analisis komparatif membutuhkan data versicolor dan virginica sekaligus. Gunakan IN untuk memfilter dua spesies dalam satu kondisi.',
                'tables'      => ['iris'],
                'objectives'  => ['Gunakan IN dengan dua nilai', 'Tampilkan versicolor dan virginica'],
                'ordered' => false, 'ordering_hint' => null,
                'starter_sql'    => "SELECT * FROM iris\nWHERE spesies ",
                'solution_query' => "SELECT * FROM iris WHERE spesies IN ('versicolor', 'virginica')",
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 5, 'difficulty' => 2,
                'title'       => 'Filter Gabungan AND',
                'briefing'    => 'Tim peneliti memerlukan bunga non-virginica dengan kelopak pendek (panjang_kelopak < 5.5). Kombinasikan dua kondisi dengan AND.',
                'tables'      => ['iris'],
                'objectives'  => ['Gunakan AND untuk dua kondisi', 'panjang_kelopak < 5.5', 'Kecualikan spesies virginica'],
                'ordered' => false, 'ordering_hint' => null,
                'starter_sql'    => "SELECT * FROM iris\nWHERE ",
                'solution_query' => "SELECT * FROM iris WHERE panjang_kelopak < 5.5 AND spesies != 'virginica'",
                'rank_unlock'    => 'Filter Master',
            ],
        ];
        $this->insertMissions($id, $missions);
    }

    // ── BAB 1.3 — Formula 1 2023 (ORDER BY & LIMIT) ────────────────

    private function seedF1Dataset(mixed $ch, mixed $sub): mixed
    {
        $schema = <<<'SQL'
CREATE TABLE pembalap (
  id      INTEGER PRIMARY KEY,
  nama    TEXT    NOT NULL,
  tim     TEXT    NOT NULL,
  negara  TEXT    NOT NULL,
  poin    INTEGER NOT NULL,
  menang  INTEGER NOT NULL,
  podium  INTEGER NOT NULL
);
SQL;

        $seed = <<<'SQL'
INSERT INTO pembalap VALUES
(1,'Max Verstappen','Red Bull Racing','Belanda',575,19,21),
(2,'Sergio Perez','Red Bull Racing','Meksiko',285,2,13),
(3,'Lewis Hamilton','Mercedes','Inggris',234,0,9),
(4,'Fernando Alonso','Aston Martin','Spanyol',206,0,8),
(5,'Charles Leclerc','Ferrari','Monako',206,0,7),
(6,'Lando Norris','McLaren','Inggris',205,0,7),
(7,'Carlos Sainz','Ferrari','Spanyol',200,1,8),
(8,'George Russell','Mercedes','Inggris',175,0,5),
(9,'Oscar Piastri','McLaren','Australia',97,0,3),
(10,'Lance Stroll','Aston Martin','Kanada',74,0,2),
(11,'Pierre Gasly','Alpine','Prancis',62,0,0),
(12,'Esteban Ocon','Alpine','Prancis',58,0,0),
(13,'Alexander Albon','Williams','Thailand',27,0,0),
(14,'Yuki Tsunoda','AlphaTauri','Jepang',17,0,0),
(15,'Valtteri Bottas','Alfa Romeo','Finlandia',10,0,0),
(16,'Nico Hulkenberg','Haas','Jerman',9,0,0),
(17,'Zhou Guanyu','Alfa Romeo','Tiongkok',6,0,0),
(18,'Daniel Ricciardo','AlphaTauri','Australia',6,0,0),
(19,'Kevin Magnussen','Haas','Denmark',3,0,0),
(20,'Logan Sargeant','Williams','Amerika Serikat',1,0,0);
SQL;

        return SqlDataset::create([
            'name'          => 'Formula 1 2023',
            'description'   => 'Klasemen akhir pembalap Formula 1 musim 2023 — poin, kemenangan, dan podium',
            'source'        => 'upload',
            'schema_sql'    => $schema,
            'seed_sql'      => $seed,
            'is_active'     => true,
            'chapter_id'    => (string) $ch->_id,
            'subchapter_id' => (string) $sub->_id,
        ]);
    }

    private function seedOrderByMissions(mixed $dataset): void
    {
        $id = (string) $dataset->_id;
        $missions = [
            [
                'stage_order' => 1, 'difficulty' => 1,
                'title'       => 'Urut Berdasarkan Poin',
                'briefing'    => 'Tampilkan semua pembalap diurutkan dari yang paling banyak poin. Jika poin sama, urutkan nama secara abjad.',
                'tables'      => ['pembalap'],
                'objectives'  => ['Urutkan poin dari tertinggi', 'Jika poin sama, urutkan nama ASC'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY poin DESC, nama ASC',
                'starter_sql'    => "SELECT * FROM pembalap\nORDER BY ",
                'solution_query' => 'SELECT * FROM pembalap ORDER BY poin DESC, nama ASC',
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 2, 'difficulty' => 1,
                'title'       => 'Top 5 Pembalap',
                'briefing'    => 'FIA hanya ingin melihat 5 pembalap teratas musim ini berdasarkan poin. Tampilkan dan batasi hasilnya.',
                'tables'      => ['pembalap'],
                'objectives'  => ['Urutkan poin dari tertinggi', 'Batasi 5 baris saja'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY poin DESC, nama ASC LIMIT 5',
                'starter_sql'    => "SELECT * FROM pembalap\nORDER BY poin DESC, nama ASC\n",
                'solution_query' => 'SELECT * FROM pembalap ORDER BY poin DESC, nama ASC LIMIT 5',
                'rank_unlock'    => 'Sort Beginner',
            ],
            [
                'stage_order' => 3, 'difficulty' => 1,
                'title'       => 'Urut per Tim',
                'briefing'    => 'Analis ingin melihat pembalap dikelompokkan per tim secara abjad, lalu nama dalam tim juga alfabetis.',
                'tables'      => ['pembalap'],
                'objectives'  => ['Urutkan tim secara abjad', 'Di dalam tim, urutkan nama abjad'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY tim ASC, nama ASC',
                'starter_sql'    => "SELECT * FROM pembalap\nORDER BY ",
                'solution_query' => 'SELECT * FROM pembalap ORDER BY tim ASC, nama ASC',
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 4, 'difficulty' => 2,
                'title'       => 'Pembalap Tanpa Kemenangan',
                'briefing'    => 'Media ingin tahu pembalap yang belum sekalipun menang musim ini, diurutkan dari yang paling banyak poin.',
                'tables'      => ['pembalap'],
                'objectives'  => ['Filter menang = 0', 'Urutkan poin dari tertinggi', 'Jika poin sama, urutkan nama ASC'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY poin DESC, nama ASC',
                'starter_sql'    => "SELECT * FROM pembalap\nWHERE menang = 0\nORDER BY ",
                'solution_query' => 'SELECT * FROM pembalap WHERE menang = 0 ORDER BY poin DESC, nama ASC',
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 5, 'difficulty' => 2,
                'title'       => 'Raja Podium',
                'briefing'    => 'Tampilkan 3 pembalap dengan podium terbanyak musim ini. Hanya tampilkan kolom nama, tim, dan podium.',
                'tables'      => ['pembalap'],
                'objectives'  => ['Tampilkan hanya nama, tim, podium', 'Urutkan podium dari tertinggi', 'Batasi 3 baris'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY podium DESC, nama ASC LIMIT 3',
                'starter_sql'    => "SELECT nama, tim, podium FROM pembalap\nORDER BY ",
                'solution_query' => 'SELECT nama, tim, podium FROM pembalap ORDER BY podium DESC, nama ASC LIMIT 3',
                'rank_unlock'    => 'Sort Master',
            ],
        ];
        $this->insertMissions($id, $missions);
    }

    // ── BAB 1.4 — Toko Elektronik (Fungsi Agregasi) ────────────────

    private function seedTokoElektronikDataset(mixed $ch, mixed $sub): mixed
    {
        $schema = <<<'SQL'
CREATE TABLE produk (
  id       INTEGER PRIMARY KEY,
  nama     TEXT    NOT NULL,
  kategori TEXT    NOT NULL,
  harga    INTEGER NOT NULL,
  stok     INTEGER NOT NULL,
  rating   REAL    NOT NULL
);
SQL;

        $seed = <<<'SQL'
INSERT INTO produk VALUES
(1,'ASUS VivoBook 15','Laptop',8999000,15,4.3),
(2,'Dell Inspiron 15','Laptop',10499000,10,4.5),
(3,'HP Pavilion 14','Laptop',7599000,20,4.1),
(4,'Lenovo IdeaPad 5','Laptop',9299000,12,4.4),
(5,'Apple MacBook Air M2','Laptop',19999000,5,4.8),
(6,'iPhone 15 Pro','Smartphone',19499000,8,4.7),
(7,'Samsung Galaxy S24','Smartphone',14999000,12,4.6),
(8,'Xiaomi 14','Smartphone',8999000,25,4.4),
(9,'OPPO Find X7','Smartphone',11499000,10,4.3),
(10,'Realme GT 5','Smartphone',5999000,30,4.1),
(11,'iPad Air 5','Tablet',9999000,8,4.6),
(12,'Samsung Galaxy Tab S9','Tablet',12999000,6,4.5),
(13,'Lenovo Tab P12','Tablet',4999000,15,4.2),
(14,'Xiaomi Pad 6','Tablet',4499000,20,4.1),
(15,'Apple Pencil 2','Aksesoris',2199000,30,4.7),
(16,'AirPods Pro 2','Aksesoris',4299000,20,4.8),
(17,'Samsung Galaxy Buds2','Aksesoris',1699000,35,4.3),
(18,'Logitech MX Master 3','Aksesoris',1599000,25,4.6),
(19,'Sony WH-1000XM5','Aksesoris',5499000,10,4.5),
(20,'Razer BlackWidow V4','Aksesoris',2299000,15,4.4);
SQL;

        return SqlDataset::create([
            'name'          => 'Toko Elektronik',
            'description'   => 'Katalog produk toko elektronik — laptop, smartphone, tablet, dan aksesoris beserta harga, stok, dan rating',
            'source'        => 'upload',
            'schema_sql'    => $schema,
            'seed_sql'      => $seed,
            'is_active'     => true,
            'chapter_id'    => (string) $ch->_id,
            'subchapter_id' => (string) $sub->_id,
        ]);
    }

    private function seedAgregatMissions(mixed $dataset): void
    {
        $id = (string) $dataset->_id;
        $missions = [
            [
                'stage_order' => 1, 'difficulty' => 2,
                'title'       => 'Hitung Total Produk',
                'briefing'    => 'Manajer gudang ingin tahu berapa total produk yang terdaftar di sistem. Gunakan COUNT untuk menghitungnya.',
                'tables'      => ['produk'],
                'objectives'  => ['Gunakan COUNT(*)', 'Beri alias total_produk'],
                'ordered' => false, 'ordering_hint' => null,
                'starter_sql'    => "SELECT \nFROM produk",
                'solution_query' => 'SELECT COUNT(*) AS total_produk FROM produk',
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 2, 'difficulty' => 2,
                'title'       => 'Harga Termurah dan Termahal',
                'briefing'    => 'Tim pricing ingin mengetahui rentang harga di toko. Tampilkan harga terendah dan tertinggi dalam satu query.',
                'tables'      => ['produk'],
                'objectives'  => ['Gunakan MIN(harga) dengan alias termurah', 'Gunakan MAX(harga) dengan alias termahal'],
                'ordered' => false, 'ordering_hint' => null,
                'starter_sql'    => "SELECT \nFROM produk",
                'solution_query' => 'SELECT MIN(harga) AS termurah, MAX(harga) AS termahal FROM produk',
                'rank_unlock'    => 'Number Cruncher',
            ],
            [
                'stage_order' => 3, 'difficulty' => 2,
                'title'       => 'Rata-rata Rating',
                'briefing'    => 'Dashboard toko memerlukan rata-rata rating seluruh produk. Gunakan AVG dan bulatkan ke 2 desimal.',
                'tables'      => ['produk'],
                'objectives'  => ['Gunakan AVG(rating)', 'Bulatkan dengan ROUND 2 desimal', 'Beri alias rata_rating'],
                'ordered' => false, 'ordering_hint' => null,
                'starter_sql'    => "SELECT \nFROM produk",
                'solution_query' => 'SELECT ROUND(AVG(rating), 2) AS rata_rating FROM produk',
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 4, 'difficulty' => 3,
                'title'       => 'Total Stok Aksesoris',
                'briefing'    => 'Gudang perlu mengetahui total unit aksesoris yang tersedia. Jumlahkan stok hanya untuk kategori Aksesoris.',
                'tables'      => ['produk'],
                'objectives'  => ['Filter kategori = Aksesoris', 'Gunakan SUM(stok)', 'Beri alias total_stok'],
                'ordered' => false, 'ordering_hint' => null,
                'starter_sql'    => "SELECT \nFROM produk\nWHERE kategori = 'Aksesoris'",
                'solution_query' => "SELECT SUM(stok) AS total_stok FROM produk WHERE kategori = 'Aksesoris'",
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 5, 'difficulty' => 3,
                'title'       => 'Statistik Smartphone',
                'briefing'    => 'Laporan kategori memerlukan jumlah produk dan harga rata-rata untuk segmen Smartphone dalam satu baris.',
                'tables'      => ['produk'],
                'objectives'  => ['Filter kategori = Smartphone', 'Hitung COUNT(*) dengan alias jumlah', 'Hitung ROUND(AVG(harga),0) dengan alias harga_rata'],
                'ordered' => false, 'ordering_hint' => null,
                'starter_sql'    => "SELECT \nFROM produk\nWHERE kategori = 'Smartphone'",
                'solution_query' => "SELECT COUNT(*) AS jumlah, ROUND(AVG(harga), 0) AS harga_rata FROM produk WHERE kategori = 'Smartphone'",
                'rank_unlock'    => 'Data Analyst',
            ],
        ];
        $this->insertMissions($id, $missions);
    }

    // ── BAB 1.5 — Kafe Digital (GROUP BY & HAVING) ─────────────────

    private function seedKafeDigitalDataset(mixed $ch, mixed $sub): mixed
    {
        $schema = <<<'SQL'
CREATE TABLE menu (
  id       INTEGER PRIMARY KEY,
  nama     TEXT    NOT NULL,
  kategori TEXT    NOT NULL,
  harga    INTEGER NOT NULL,
  kalori   INTEGER NOT NULL
);

CREATE TABLE pesanan (
  id          INTEGER PRIMARY KEY,
  menu_id     INTEGER NOT NULL,
  pelanggan   TEXT    NOT NULL,
  jumlah      INTEGER NOT NULL,
  total_harga INTEGER NOT NULL,
  tanggal     TEXT    NOT NULL
);
SQL;

        $seed = <<<'SQL'
INSERT INTO menu VALUES
(1,'Espresso','Kopi',25000,120),
(2,'Americano','Kopi',28000,100),
(3,'Cappuccino','Kopi',32000,150),
(4,'Latte','Kopi',35000,170),
(5,'Flat White','Kopi',38000,165),
(6,'Green Tea','Non-Kopi',25000,60),
(7,'Teh Tarik','Non-Kopi',22000,80),
(8,'Matcha Latte','Non-Kopi',38000,130),
(9,'Cokelat Panas','Non-Kopi',30000,200),
(10,'Nasi Goreng','Makanan',45000,650),
(11,'Mie Ayam','Makanan',40000,520),
(12,'Sandwich','Makanan',35000,380),
(13,'Croissant','Makanan',28000,380),
(14,'Pancake','Makanan',32000,420),
(15,'Cheesecake','Dessert',45000,520),
(16,'Tiramisu','Dessert',42000,490),
(17,'Es Krim Vanilla','Dessert',25000,250),
(18,'Pudding Cokelat','Dessert',22000,280);

INSERT INTO pesanan VALUES
(1,1,'Budi',1,25000,'2024-01-05'),
(2,3,'Budi',1,32000,'2024-01-10'),
(3,5,'Budi',1,38000,'2024-01-15'),
(4,8,'Budi',1,38000,'2024-01-20'),
(5,10,'Budi',1,45000,'2024-01-25'),
(6,15,'Budi',1,45000,'2024-02-01'),
(7,2,'Siti',1,28000,'2024-01-06'),
(8,4,'Siti',1,35000,'2024-01-11'),
(9,9,'Siti',1,30000,'2024-01-16'),
(10,11,'Siti',1,40000,'2024-01-21'),
(11,16,'Siti',1,42000,'2024-01-26'),
(12,3,'Andi',1,32000,'2024-01-07'),
(13,6,'Andi',1,25000,'2024-01-14'),
(14,12,'Andi',1,35000,'2024-01-21'),
(15,17,'Andi',1,25000,'2024-01-28'),
(16,1,'Dewi',1,25000,'2024-01-08'),
(17,7,'Dewi',1,22000,'2024-01-15'),
(18,14,'Dewi',1,32000,'2024-01-22'),
(19,18,'Dewi',1,22000,'2024-01-29'),
(20,2,'Rizki',1,28000,'2024-01-09'),
(21,5,'Rizki',1,38000,'2024-01-16'),
(22,13,'Rizki',1,28000,'2024-01-23'),
(23,4,'Ahmad',1,35000,'2024-01-10'),
(24,8,'Ahmad',1,38000,'2024-01-17'),
(25,11,'Ahmad',1,40000,'2024-01-24'),
(26,6,'Nurul',1,25000,'2024-01-12'),
(27,15,'Nurul',1,45000,'2024-01-19'),
(28,3,'Hendra',1,32000,'2024-01-13'),
(29,16,'Hendra',1,42000,'2024-01-20'),
(30,10,'Putri',1,45000,'2024-01-18');
SQL;

        return SqlDataset::create([
            'name'          => 'Kafe Digital',
            'description'   => 'Data menu dan transaksi kafe modern — kategori minuman, makanan, dessert beserta riwayat pesanan pelanggan',
            'source'        => 'upload',
            'schema_sql'    => $schema,
            'seed_sql'      => $seed,
            'is_active'     => true,
            'chapter_id'    => (string) $ch->_id,
            'subchapter_id' => (string) $sub->_id,
        ]);
    }

    private function seedGroupByMissions(mixed $dataset): void
    {
        $id = (string) $dataset->_id;
        $missions = [
            [
                'stage_order' => 1, 'difficulty' => 2,
                'title'       => 'Jumlah Menu per Kategori',
                'briefing'    => 'Manajer kafe ingin tahu berapa item menu yang ada di tiap kategori. Gunakan GROUP BY untuk mengelompokkan dan COUNT untuk menghitung.',
                'tables'      => ['menu'],
                'objectives'  => ['Kelompokkan berdasarkan kategori', 'Hitung jumlah menu tiap kategori', 'Urutkan jumlah terbanyak dulu, lalu kategori abjad'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY jumlah DESC, kategori ASC',
                'starter_sql'    => "SELECT kategori, COUNT(*) AS jumlah\nFROM menu\nGROUP BY kategori\nORDER BY ",
                'solution_query' => 'SELECT kategori, COUNT(*) AS jumlah FROM menu GROUP BY kategori ORDER BY jumlah DESC, kategori ASC',
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 2, 'difficulty' => 2,
                'title'       => 'Rata-rata Harga per Kategori',
                'briefing'    => 'Tim pricing ingin membandingkan harga rata-rata di setiap kategori. Tampilkan kategori dan rata-rata harga dibulatkan, diurutkan dari yang termahal.',
                'tables'      => ['menu'],
                'objectives'  => ['Kelompokkan berdasarkan kategori', 'Hitung ROUND(AVG(harga),0) alias harga_rata', 'Urutkan harga_rata dari tertinggi'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY harga_rata DESC',
                'starter_sql'    => "SELECT kategori, ROUND(AVG(harga), 0) AS harga_rata\nFROM menu\nGROUP BY kategori\nORDER BY ",
                'solution_query' => 'SELECT kategori, ROUND(AVG(harga), 0) AS harga_rata FROM menu GROUP BY kategori ORDER BY harga_rata DESC',
                'rank_unlock'    => 'Group Commander',
            ],
            [
                'stage_order' => 3, 'difficulty' => 2,
                'title'       => 'Transaksi per Pelanggan',
                'briefing'    => 'Program loyalitas memerlukan data frekuensi kunjungan setiap pelanggan. Hitung total transaksi per nama pelanggan.',
                'tables'      => ['pesanan'],
                'objectives'  => ['Kelompokkan berdasarkan pelanggan', 'Hitung COUNT(*) alias transaksi', 'Urutkan transaksi terbanyak dulu'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY transaksi DESC',
                'starter_sql'    => "SELECT pelanggan, COUNT(*) AS transaksi\nFROM pesanan\nGROUP BY pelanggan\nORDER BY ",
                'solution_query' => 'SELECT pelanggan, COUNT(*) AS transaksi FROM pesanan GROUP BY pelanggan ORDER BY transaksi DESC',
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 4, 'difficulty' => 3,
                'title'       => 'Kategori Menu Terlengkap',
                'briefing'    => 'Hanya kategori dengan 5 item menu atau lebih yang layak dipromosikan. Gunakan HAVING untuk memfilter hasil GROUP BY.',
                'tables'      => ['menu'],
                'objectives'  => ['Kelompokkan berdasarkan kategori', 'Gunakan HAVING COUNT(*) >= 5', 'Tampilkan kategori dan jumlah'],
                'ordered' => false, 'ordering_hint' => null,
                'starter_sql'    => "SELECT kategori, COUNT(*) AS jumlah\nFROM menu\nGROUP BY kategori\nHAVING ",
                'solution_query' => 'SELECT kategori, COUNT(*) AS jumlah FROM menu GROUP BY kategori HAVING COUNT(*) >= 5',
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 5, 'difficulty' => 3,
                'title'       => 'Pelanggan Setia',
                'briefing'    => 'Program VIP diberikan kepada pelanggan yang melakukan 5 transaksi atau lebih. Temukan mereka menggunakan HAVING.',
                'tables'      => ['pesanan'],
                'objectives'  => ['Kelompokkan berdasarkan pelanggan', 'Gunakan HAVING COUNT(*) >= 5', 'Urutkan transaksi dari terbanyak'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY transaksi DESC',
                'starter_sql'    => "SELECT pelanggan, COUNT(*) AS transaksi\nFROM pesanan\nGROUP BY pelanggan\nHAVING ",
                'solution_query' => 'SELECT pelanggan, COUNT(*) AS transaksi FROM pesanan GROUP BY pelanggan HAVING COUNT(*) >= 5 ORDER BY transaksi DESC',
                'rank_unlock'    => 'Aggregation Pro',
            ],
        ];
        $this->insertMissions($id, $missions);
    }

    // ── BAB 2.1 — Perpustakaan (INNER JOIN) ────────────────────────

    private function seedPerpustakaanDataset(mixed $ch, mixed $sub): mixed
    {
        $schema = <<<'SQL'
CREATE TABLE genre (
  id         INTEGER PRIMARY KEY,
  nama_genre TEXT NOT NULL
);

CREATE TABLE pengarang (
  id          INTEGER PRIMARY KEY,
  nama        TEXT NOT NULL,
  kebangsaan  TEXT NOT NULL
);

CREATE TABLE buku (
  id           INTEGER PRIMARY KEY,
  judul        TEXT    NOT NULL,
  pengarang_id INTEGER NOT NULL,
  genre_id     INTEGER NOT NULL,
  tahun_terbit INTEGER NOT NULL,
  halaman      INTEGER NOT NULL
);
SQL;

        $seed = <<<'SQL'
INSERT INTO genre VALUES
(1,'Fiksi'),
(2,'Non-Fiksi'),
(3,'Sains'),
(4,'Sejarah'),
(5,'Fantasi');

INSERT INTO pengarang VALUES
(1,'Arya Pratama','Indonesia'),
(2,'Dini Wahyuni','Indonesia'),
(3,'Budi Setiawan','Indonesia'),
(4,'Lara Sanjaya','Indonesia'),
(5,'James Carter','Amerika Serikat'),
(6,'Elena Muller','Jerman'),
(7,'Yuki Tanaka','Jepang'),
(8,'Sofia Rossi','Italia');

INSERT INTO buku VALUES
(1,'Nusantara Tujuh',1,5,2014,432),
(2,'Jejak Cahaya',2,1,2018,329),
(3,'Semesta Biru',3,3,2016,256),
(4,'Hari Terakhir',4,1,2020,412),
(5,'Sang Pemimpi Lagi',1,1,2019,292),
(6,'Quantum Dreams',5,3,2019,187),
(7,'The Last Horizon',6,5,2021,398),
(8,'Kirschblute',6,4,2015,334),
(9,'Sakura no Kioku',7,1,2017,289),
(10,'Il Viaggio',8,5,2022,356),
(11,'Catatan Hitam',3,2,2020,198),
(12,'Revolusi Senyap',2,4,2019,445),
(13,'Digital Nomad',5,2,2023,223),
(14,'Kode Rahasia',4,3,2021,315),
(15,'Legenda Batu Merah',8,5,2018,478);
SQL;

        return SqlDataset::create([
            'name'          => 'Perpustakaan',
            'description'   => 'Koleksi buku perpustakaan digital — buku, pengarang, dan genre dengan relasi foreign key',
            'source'        => 'upload',
            'schema_sql'    => $schema,
            'seed_sql'      => $seed,
            'is_active'     => true,
            'chapter_id'    => (string) $ch->_id,
            'subchapter_id' => (string) $sub->_id,
        ]);
    }

    private function seedInnerJoinMissions(mixed $dataset): void
    {
        $id = (string) $dataset->_id;
        $missions = [
            [
                'stage_order' => 1, 'difficulty' => 3,
                'title'       => 'Buku dan Pengarangnya',
                'briefing'    => 'Katalog perpustakaan perlu menampilkan judul buku bersama nama pengarangnya. Gunakan INNER JOIN untuk menggabungkan tabel buku dan pengarang.',
                'tables'      => ['buku', 'pengarang'],
                'objectives'  => ['Gunakan INNER JOIN dengan alias tabel', 'Tampilkan b.judul dan p.nama AS pengarang', 'Urutkan berdasarkan judul ASC'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY b.judul ASC',
                'starter_sql'    => "SELECT b.judul, p.nama AS pengarang\nFROM buku b\nINNER JOIN ",
                'solution_query' => 'SELECT b.judul, p.nama AS pengarang FROM buku b INNER JOIN pengarang p ON b.pengarang_id = p.id ORDER BY b.judul ASC',
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 2, 'difficulty' => 3,
                'title'       => 'Buku dan Genrenya',
                'briefing'    => 'Sistem perlu label genre untuk setiap buku. Gabungkan tabel buku dengan genre menggunakan INNER JOIN.',
                'tables'      => ['buku', 'genre'],
                'objectives'  => ['Gabungkan buku dengan genre', 'Tampilkan b.judul dan g.nama_genre', 'Urutkan nama_genre ASC lalu judul ASC'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY g.nama_genre ASC, b.judul ASC',
                'starter_sql'    => "SELECT b.judul, g.nama_genre\nFROM buku b\nINNER JOIN ",
                'solution_query' => 'SELECT b.judul, g.nama_genre FROM buku b INNER JOIN genre g ON b.genre_id = g.id ORDER BY g.nama_genre ASC, b.judul ASC',
                'rank_unlock'    => 'Join Initiator',
            ],
            [
                'stage_order' => 3, 'difficulty' => 3,
                'title'       => 'Koleksi Genre Fantasi',
                'briefing'    => 'Pengunjung meminta daftar buku fantasi lengkap dengan tahun terbit. JOIN genre lalu filter hanya Fantasi, urutkan dari terbaru.',
                'tables'      => ['buku', 'genre'],
                'objectives'  => ['INNER JOIN buku dengan genre', 'Filter WHERE g.nama_genre = Fantasi', 'Tampilkan judul dan tahun_terbit', 'Urutkan tahun_terbit DESC'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY b.tahun_terbit DESC',
                'starter_sql'    => "SELECT b.judul, b.tahun_terbit\nFROM buku b\nINNER JOIN genre g ON b.genre_id = g.id\nWHERE ",
                'solution_query' => "SELECT b.judul, b.tahun_terbit FROM buku b INNER JOIN genre g ON b.genre_id = g.id WHERE g.nama_genre = 'Fantasi' ORDER BY b.tahun_terbit DESC",
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 4, 'difficulty' => 3,
                'title'       => 'Penulis Lokal',
                'briefing'    => 'Festival buku ingin mempromosikan karya penulis Indonesia. Gabungkan buku dengan pengarang, filter kebangsaan Indonesia, urutkan nama penulis.',
                'tables'      => ['buku', 'pengarang'],
                'objectives'  => ['INNER JOIN buku dengan pengarang', "Filter WHERE p.kebangsaan = 'Indonesia'", 'Tampilkan judul, nama, kebangsaan', 'Urutkan p.nama ASC, b.judul ASC'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY p.nama ASC, b.judul ASC',
                'starter_sql'    => "SELECT b.judul, p.nama, p.kebangsaan\nFROM buku b\nINNER JOIN pengarang p ON b.pengarang_id = p.id\nWHERE ",
                'solution_query' => "SELECT b.judul, p.nama, p.kebangsaan FROM buku b INNER JOIN pengarang p ON b.pengarang_id = p.id WHERE p.kebangsaan = 'Indonesia' ORDER BY p.nama ASC, b.judul ASC",
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 5, 'difficulty' => 4,
                'title'       => 'Katalog Lengkap',
                'briefing'    => 'Tampilan utama perpustakaan memerlukan judul, nama pengarang, dan genre dalam satu baris. Gabungkan tiga tabel sekaligus.',
                'tables'      => ['buku', 'pengarang', 'genre'],
                'objectives'  => ['JOIN tiga tabel: buku, pengarang, genre', 'Tampilkan judul, p.nama AS pengarang, g.nama_genre', 'Urutkan nama_genre ASC lalu judul ASC'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY g.nama_genre ASC, b.judul ASC',
                'starter_sql'    => "SELECT b.judul, p.nama AS pengarang, g.nama_genre\nFROM buku b\nINNER JOIN pengarang p ON b.pengarang_id = p.id\nINNER JOIN ",
                'solution_query' => 'SELECT b.judul, p.nama AS pengarang, g.nama_genre FROM buku b INNER JOIN pengarang p ON b.pengarang_id = p.id INNER JOIN genre g ON b.genre_id = g.id ORDER BY g.nama_genre ASC, b.judul ASC',
                'rank_unlock'    => 'Table Linker',
            ],
        ];
        $this->insertMissions($id, $missions);
    }

    // ── BAB 2.2 — Kepegawaian (LEFT JOIN) ──────────────────────────

    private function seedKepegawaianDataset(mixed $ch, mixed $sub): mixed
    {
        $schema = <<<'SQL'
CREATE TABLE departemen (
  id        INTEGER PRIMARY KEY,
  nama_dept TEXT    NOT NULL,
  lokasi    TEXT    NOT NULL,
  anggaran  INTEGER NOT NULL
);

CREATE TABLE karyawan (
  id            INTEGER PRIMARY KEY,
  nama          TEXT    NOT NULL,
  jabatan       TEXT    NOT NULL,
  departemen_id INTEGER,
  gaji          INTEGER NOT NULL,
  tgl_bergabung TEXT    NOT NULL
);
SQL;

        $seed = <<<'SQL'
INSERT INTO departemen VALUES
(1,'Engineering','Jakarta',150000000),
(2,'Marketing','Bandung',120000000),
(3,'Finance','Jakarta',100000000),
(4,'Human Resources','Surabaya',80000000),
(5,'Operations','Medan',90000000);

INSERT INTO karyawan VALUES
(1,'Andi Pratama','Senior Engineer',1,15000000,'2020-03-15'),
(2,'Budi Santoso','Product Manager',1,18000000,'2019-07-20'),
(3,'Citra Dewi','Frontend Developer',1,12000000,'2021-01-10'),
(4,'Doni Setiawan','Marketing Lead',2,14000000,'2020-05-08'),
(5,'Eka Putri','Content Creator',2,10000000,'2022-02-14'),
(6,'Faisal Rahman','Finance Analyst',3,13000000,'2021-08-22'),
(7,'Gita Wahyuni','Accountant',3,11000000,'2020-11-30'),
(8,'Hadi Kusuma','HR Manager',4,14500000,'2019-04-05'),
(9,'Indra Laksono','Recruiter',4,10500000,'2021-06-18'),
(10,'Joko Pribadi','UI Designer',NULL,11000000,'2023-09-01'),
(11,'Kirana Sari','Data Analyst',NULL,13500000,'2023-11-01'),
(12,'Luthfi Aditya','Backend Developer',NULL,12000000,'2024-01-15');
SQL;

        return SqlDataset::create([
            'name'          => 'Kepegawaian',
            'description'   => 'Data karyawan dan departemen perusahaan — beberapa karyawan baru belum ditempatkan ke departemen manapun',
            'source'        => 'upload',
            'schema_sql'    => $schema,
            'seed_sql'      => $seed,
            'is_active'     => true,
            'chapter_id'    => (string) $ch->_id,
            'subchapter_id' => (string) $sub->_id,
        ]);
    }

    private function seedLeftJoinMissions(mixed $dataset): void
    {
        $id = (string) $dataset->_id;
        $missions = [
            [
                'stage_order' => 1, 'difficulty' => 3,
                'title'       => 'Semua Karyawan & Departemen',
                'briefing'    => 'HR membutuhkan daftar seluruh karyawan beserta departemen mereka. Beberapa karyawan baru belum punya departemen — tetap tampilkan mereka dengan LEFT JOIN.',
                'tables'      => ['karyawan', 'departemen'],
                'objectives'  => ['Gunakan LEFT JOIN', 'Tampilkan k.nama, k.jabatan, d.nama_dept', 'Urutkan d.nama_dept ASC lalu k.nama ASC'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY d.nama_dept ASC, k.nama ASC',
                'starter_sql'    => "SELECT k.nama, k.jabatan, d.nama_dept\nFROM karyawan k\nLEFT JOIN ",
                'solution_query' => 'SELECT k.nama, k.jabatan, d.nama_dept FROM karyawan k LEFT JOIN departemen d ON k.departemen_id = d.id ORDER BY d.nama_dept ASC, k.nama ASC',
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 2, 'difficulty' => 3,
                'title'       => 'Karyawan Belum Ditempatkan',
                'briefing'    => 'Onboarding team perlu tahu siapa saja yang belum masuk departemen. LEFT JOIN lalu filter baris di mana kolom departemen bernilai NULL.',
                'tables'      => ['karyawan', 'departemen'],
                'objectives'  => ['LEFT JOIN karyawan dengan departemen', 'Filter WHERE d.id IS NULL', 'Tampilkan nama, jabatan, gaji'],
                'ordered' => false, 'ordering_hint' => null,
                'starter_sql'    => "SELECT k.nama, k.jabatan, k.gaji\nFROM karyawan k\nLEFT JOIN departemen d ON k.departemen_id = d.id\nWHERE ",
                'solution_query' => 'SELECT k.nama, k.jabatan, k.gaji FROM karyawan k LEFT JOIN departemen d ON k.departemen_id = d.id WHERE d.id IS NULL',
                'rank_unlock'    => 'Null Handler',
            ],
            [
                'stage_order' => 3, 'difficulty' => 3,
                'title'       => 'Ranking Gaji Karyawan',
                'briefing'    => 'Laporan kompensasi memerlukan semua karyawan dengan nama departemen mereka, diurutkan dari gaji tertinggi.',
                'tables'      => ['karyawan', 'departemen'],
                'objectives'  => ['LEFT JOIN karyawan dengan departemen', 'Tampilkan nama, gaji, d.nama_dept', 'Urutkan gaji DESC'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY k.gaji DESC',
                'starter_sql'    => "SELECT k.nama, k.gaji, d.nama_dept\nFROM karyawan k\nLEFT JOIN departemen d ON k.departemen_id = d.id\nORDER BY ",
                'solution_query' => 'SELECT k.nama, k.gaji, d.nama_dept FROM karyawan k LEFT JOIN departemen d ON k.departemen_id = d.id ORDER BY k.gaji DESC',
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 4, 'difficulty' => 3,
                'title'       => 'Karyawan Bergabung Terbaru',
                'briefing'    => 'Laporan onboarding memerlukan 5 karyawan yang paling baru bergabung beserta nama departemennya (NULL jika belum ditempatkan).',
                'tables'      => ['karyawan', 'departemen'],
                'objectives'  => ['LEFT JOIN karyawan dengan departemen', 'Tampilkan nama, jabatan, nama_dept, tgl_bergabung', 'Urutkan tgl_bergabung DESC LIMIT 5'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY k.tgl_bergabung DESC LIMIT 5',
                'starter_sql'    => "SELECT k.nama, k.jabatan, d.nama_dept, k.tgl_bergabung\nFROM karyawan k\nLEFT JOIN departemen d ON k.departemen_id = d.id\nORDER BY ",
                'solution_query' => 'SELECT k.nama, k.jabatan, d.nama_dept, k.tgl_bergabung FROM karyawan k LEFT JOIN departemen d ON k.departemen_id = d.id ORDER BY k.tgl_bergabung DESC LIMIT 5',
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 5, 'difficulty' => 4,
                'title'       => 'Label Departemen dengan COALESCE',
                'briefing'    => 'Laporan akhir tidak boleh menampilkan NULL. Gunakan COALESCE agar karyawan tanpa departemen memiliki label "Belum Ditempatkan".',
                'tables'      => ['karyawan', 'departemen'],
                'objectives'  => ['LEFT JOIN karyawan dengan departemen', 'Gunakan COALESCE(d.nama_dept, "Belum Ditempatkan") AS departemen', 'Tampilkan nama, gaji, departemen', 'Urutkan gaji DESC'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY k.gaji DESC',
                'starter_sql'    => "SELECT k.nama, k.gaji,\n  COALESCE(d.nama_dept, 'Belum Ditempatkan') AS departemen\nFROM karyawan k\nLEFT JOIN departemen d ON k.departemen_id = d.id\nORDER BY ",
                'solution_query' => "SELECT k.nama, k.gaji, COALESCE(d.nama_dept, 'Belum Ditempatkan') AS departemen FROM karyawan k LEFT JOIN departemen d ON k.departemen_id = d.id ORDER BY k.gaji DESC",
                'rank_unlock'    => 'Left Join Expert',
            ],
        ];
        $this->insertMissions($id, $missions);
    }

    // ── BAB 2.3 — Jadwal Kuliah (RIGHT JOIN) ───────────────────────

    private function seedJadwalKuliahDataset(mixed $ch, mixed $sub): mixed
    {
        $schema = <<<'SQL'
CREATE TABLE pengajar (
  id       INTEGER PRIMARY KEY,
  nama     TEXT NOT NULL,
  keahlian TEXT NOT NULL
);

CREATE TABLE jadwal (
  id           INTEGER PRIMARY KEY,
  mata_kuliah  TEXT    NOT NULL,
  hari         TEXT    NOT NULL,
  jam          TEXT    NOT NULL,
  ruangan      TEXT    NOT NULL,
  pengajar_id  INTEGER
);
SQL;

        $seed = <<<'SQL'
INSERT INTO pengajar VALUES
(1,'Dr. Ahmad Fauzi','Algoritma & Matematika'),
(2,'Prof. Sari Wahyuni','Basis Data'),
(3,'Dr. Budi Santoso','Pemrograman Web'),
(4,'Ir. Dewi Kurnia','Jaringan Komputer'),
(5,'Dr. Eko Prasetyo','Kecerdasan Buatan'),
(6,'Dr. Fitri Handayani','Sistem Operasi');

INSERT INTO jadwal VALUES
(1,'Algoritma','Senin','08:00','A101',1),
(2,'Basis Data','Senin','10:00','B201',2),
(3,'Pemrograman Web','Selasa','08:00','A103',3),
(4,'Jaringan Komputer','Selasa','13:00','C302',4),
(5,'Kecerdasan Buatan','Rabu','09:00','B204',5),
(6,'Sistem Operasi','Rabu','13:00','A101',6),
(7,'Matematika Diskrit','Kamis','08:00','B203',1),
(8,'Statistika','Kamis','10:00','A102',2),
(9,'Etika Komputer','Jumat','09:00','D401',NULL),
(10,'Seminar Industri','Jumat','13:00','D402',NULL);
SQL;

        return SqlDataset::create([
            'name'          => 'Jadwal Kuliah',
            'description'   => 'Jadwal perkuliahan dan data pengajar — dua mata kuliah belum memiliki pengajar yang ditugaskan',
            'source'        => 'upload',
            'schema_sql'    => $schema,
            'seed_sql'      => $seed,
            'is_active'     => true,
            'chapter_id'    => (string) $ch->_id,
            'subchapter_id' => (string) $sub->_id,
        ]);
    }

    private function seedRightJoinMissions(mixed $dataset): void
    {
        $id = (string) $dataset->_id;
        $missions = [
            [
                'stage_order' => 1, 'difficulty' => 3,
                'title'       => 'Semua Jadwal & Pengajar',
                'briefing'    => 'Bagian akademik ingin melihat seluruh jadwal beserta siapa pengajarnya. Beberapa kelas belum ada pengajar — gunakan RIGHT JOIN agar semua jadwal tetap tampil.',
                'tables'      => ['pengajar', 'jadwal'],
                'objectives'  => ['Gunakan RIGHT JOIN dengan pengajar sebagai tabel kiri', 'Tampilkan j.mata_kuliah, j.hari, j.jam, p.nama AS pengajar', 'Urutkan j.hari ASC, j.jam ASC'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY j.hari ASC, j.jam ASC',
                'starter_sql'    => "SELECT j.mata_kuliah, j.hari, j.jam, p.nama AS pengajar\nFROM pengajar p\nRIGHT JOIN ",
                'solution_query' => 'SELECT j.mata_kuliah, j.hari, j.jam, p.nama AS pengajar FROM pengajar p RIGHT JOIN jadwal j ON p.id = j.pengajar_id ORDER BY j.hari ASC, j.jam ASC',
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 2, 'difficulty' => 3,
                'title'       => 'Kelas Tanpa Pengajar',
                'briefing'    => 'Penjadwalan perlu menemukan mata kuliah yang belum memiliki pengajar. RIGHT JOIN lalu filter baris di mana pengajar bernilai NULL.',
                'tables'      => ['pengajar', 'jadwal'],
                'objectives'  => ['RIGHT JOIN pengajar dengan jadwal', 'Filter WHERE p.id IS NULL', 'Tampilkan mata_kuliah, hari, jam, ruangan'],
                'ordered' => false, 'ordering_hint' => null,
                'starter_sql'    => "SELECT j.mata_kuliah, j.hari, j.jam, j.ruangan\nFROM pengajar p\nRIGHT JOIN jadwal j ON p.id = j.pengajar_id\nWHERE ",
                'solution_query' => 'SELECT j.mata_kuliah, j.hari, j.jam, j.ruangan FROM pengajar p RIGHT JOIN jadwal j ON p.id = j.pengajar_id WHERE p.id IS NULL',
                'rank_unlock'    => 'Right Join Expert',
            ],
            [
                'stage_order' => 3, 'difficulty' => 3,
                'title'       => 'Jadwal Hari Senin',
                'briefing'    => 'Mahasiswa meminta jadwal hari Senin lengkap. RIGHT JOIN untuk mendapatkan semua kelas, lalu filter hanya Senin.',
                'tables'      => ['pengajar', 'jadwal'],
                'objectives'  => ['RIGHT JOIN pengajar dengan jadwal', "Filter WHERE j.hari = 'Senin'", 'Tampilkan mata_kuliah, jam, pengajar', 'Urutkan j.jam ASC'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY j.jam ASC',
                'starter_sql'    => "SELECT j.mata_kuliah, j.jam, p.nama AS pengajar\nFROM pengajar p\nRIGHT JOIN jadwal j ON p.id = j.pengajar_id\nWHERE ",
                'solution_query' => "SELECT j.mata_kuliah, j.jam, p.nama AS pengajar FROM pengajar p RIGHT JOIN jadwal j ON p.id = j.pengajar_id WHERE j.hari = 'Senin' ORDER BY j.jam ASC",
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 4, 'difficulty' => 4,
                'title'       => 'INNER vs RIGHT JOIN',
                'briefing'    => 'Perbedaan INNER dan RIGHT JOIN: INNER hanya mengembalikan baris yang cocok di kedua tabel. Tulis INNER JOIN antara jadwal dan pengajar — lihat hanya 8 baris yang ada pengajarnya.',
                'tables'      => ['jadwal', 'pengajar'],
                'objectives'  => ['Gunakan INNER JOIN (bukan RIGHT JOIN)', 'Tampilkan j.mata_kuliah, j.hari, p.nama AS pengajar', 'Urutkan j.hari ASC, j.mata_kuliah ASC'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY j.hari ASC, j.mata_kuliah ASC',
                'starter_sql'    => "SELECT j.mata_kuliah, j.hari, p.nama AS pengajar\nFROM jadwal j\nINNER JOIN ",
                'solution_query' => 'SELECT j.mata_kuliah, j.hari, p.nama AS pengajar FROM jadwal j INNER JOIN pengajar p ON j.pengajar_id = p.id ORDER BY j.hari ASC, j.mata_kuliah ASC',
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 5, 'difficulty' => 4,
                'title'       => 'Jadwal Lengkap dengan TBA',
                'briefing'    => 'Tampilkan seluruh jadwal. Kelas yang belum ada pengajar tampilkan "TBA" menggunakan COALESCE.',
                'tables'      => ['pengajar', 'jadwal'],
                'objectives'  => ['RIGHT JOIN pengajar dengan jadwal', "Gunakan COALESCE(p.nama, 'TBA') AS pengajar", 'Tampilkan mata_kuliah, hari, jam, ruangan, pengajar', 'Urutkan hari ASC, jam ASC'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY j.hari ASC, j.jam ASC',
                'starter_sql'    => "SELECT j.mata_kuliah, j.hari, j.jam, j.ruangan,\n  COALESCE(p.nama, 'TBA') AS pengajar\nFROM pengajar p\nRIGHT JOIN jadwal j ON p.id = j.pengajar_id\nORDER BY ",
                'solution_query' => "SELECT j.mata_kuliah, j.hari, j.jam, j.ruangan, COALESCE(p.nama, 'TBA') AS pengajar FROM pengajar p RIGHT JOIN jadwal j ON p.id = j.pengajar_id ORDER BY j.hari ASC, j.jam ASC",
                'rank_unlock'    => 'Right Side Analyst',
            ],
        ];
        $this->insertMissions($id, $missions);
    }

    // ── BAB 2.4 — Kemitraan Dagang (FULL OUTER JOIN) ───────────────

    private function seedKemitraanDataset(mixed $ch, mixed $sub): mixed
    {
        $schema = <<<'SQL'
CREATE TABLE produk_umkm (
  id           INTEGER PRIMARY KEY,
  nama_produk  TEXT    NOT NULL,
  kota_asal    TEXT    NOT NULL,
  kategori     TEXT    NOT NULL,
  harga        INTEGER NOT NULL
);

CREATE TABLE distributor (
  id        INTEGER PRIMARY KEY,
  nama_dist TEXT    NOT NULL,
  kota      TEXT    NOT NULL,
  produk_id INTEGER
);
SQL;

        $seed = <<<'SQL'
INSERT INTO produk_umkm VALUES
(1,'Batik Pekalongan','Pekalongan','Tekstil',250000),
(2,'Keripik Singkong','Lampung','Makanan',15000),
(3,'Kopi Aceh','Banda Aceh','Minuman',75000),
(4,'Ukiran Jepara','Jepara','Kerajinan',1500000),
(5,'Tenun Lombok','Mataram','Tekstil',350000),
(6,'Rendang Instan','Padang','Makanan',45000),
(7,'Minyak Kelapa','Manado','Makanan',35000),
(8,'Anyaman Bambu','Yogyakarta','Kerajinan',125000);

INSERT INTO distributor VALUES
(1,'CV Maju Jaya','Jakarta',1),
(2,'PT Nusa Raya','Surabaya',2),
(3,'UD Kopi Nusantara','Medan',3),
(4,'CV Craft Indonesia','Bandung',4),
(5,'PT Textile Hub','Jakarta',5),
(6,'Toko Kuliner Modern','Bali',NULL),
(7,'CV Digital Trade','Makassar',NULL);
SQL;

        return SqlDataset::create([
            'name'          => 'Kemitraan Dagang',
            'description'   => 'Data produk UMKM dan distributor — beberapa produk belum punya distributor, beberapa distributor belum memegang produk',
            'source'        => 'upload',
            'schema_sql'    => $schema,
            'seed_sql'      => $seed,
            'is_active'     => true,
            'chapter_id'    => (string) $ch->_id,
            'subchapter_id' => (string) $sub->_id,
        ]);
    }

    private function seedFullOuterJoinMissions(mixed $dataset): void
    {
        $id = (string) $dataset->_id;
        $missions = [
            [
                'stage_order' => 1, 'difficulty' => 4,
                'title'       => 'Peta Kemitraan Lengkap',
                'briefing'    => 'Pemerintah ingin gambaran total ekosistem — semua produk UMKM dan semua distributor, meski belum ada pasangannya. Gunakan FULL OUTER JOIN.',
                'tables'      => ['produk_umkm', 'distributor'],
                'objectives'  => ['Gunakan FULL OUTER JOIN', 'Tampilkan p.nama_produk, p.kota_asal, d.nama_dist, d.kota AS kota_dist', 'Urutkan p.nama_produk ASC'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY p.nama_produk ASC',
                'starter_sql'    => "SELECT p.nama_produk, p.kota_asal, d.nama_dist, d.kota AS kota_dist\nFROM produk_umkm p\nFULL OUTER JOIN ",
                'solution_query' => 'SELECT p.nama_produk, p.kota_asal, d.nama_dist, d.kota AS kota_dist FROM produk_umkm p FULL OUTER JOIN distributor d ON p.id = d.produk_id ORDER BY p.nama_produk ASC',
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 2, 'difficulty' => 4,
                'title'       => 'Produk Belum Terdistribusi',
                'briefing'    => 'Tim pengembangan UMKM ingin tahu produk mana yang belum memiliki distributor. FULL OUTER JOIN lalu filter baris di mana distributor NULL.',
                'tables'      => ['produk_umkm', 'distributor'],
                'objectives'  => ['FULL OUTER JOIN produk_umkm dengan distributor', 'Filter WHERE d.id IS NULL', 'Tampilkan nama_produk, kota_asal, kategori'],
                'ordered' => false, 'ordering_hint' => null,
                'starter_sql'    => "SELECT p.nama_produk, p.kota_asal, p.kategori\nFROM produk_umkm p\nFULL OUTER JOIN distributor d ON p.id = d.produk_id\nWHERE ",
                'solution_query' => 'SELECT p.nama_produk, p.kota_asal, p.kategori FROM produk_umkm p FULL OUTER JOIN distributor d ON p.id = d.produk_id WHERE d.id IS NULL',
                'rank_unlock'    => 'Full Merge Master',
            ],
            [
                'stage_order' => 3, 'difficulty' => 4,
                'title'       => 'Distributor Tanpa Produk',
                'briefing'    => 'Beberapa distributor belum memegang produk UMKM manapun. Temukan mereka dengan FULL OUTER JOIN dan filter produk yang NULL.',
                'tables'      => ['produk_umkm', 'distributor'],
                'objectives'  => ['FULL OUTER JOIN produk_umkm dengan distributor', 'Filter WHERE p.id IS NULL', 'Tampilkan nama_dist, kota'],
                'ordered' => false, 'ordering_hint' => null,
                'starter_sql'    => "SELECT d.nama_dist, d.kota\nFROM produk_umkm p\nFULL OUTER JOIN distributor d ON p.id = d.produk_id\nWHERE ",
                'solution_query' => 'SELECT d.nama_dist, d.kota FROM produk_umkm p FULL OUTER JOIN distributor d ON p.id = d.produk_id WHERE p.id IS NULL',
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 4, 'difficulty' => 4,
                'title'       => 'Kemitraan Aktif',
                'briefing'    => 'Laporan transaksi hanya menampilkan kemitraan yang sudah aktif — produk dan distributor keduanya ada. Filter baris di mana keduanya NOT NULL.',
                'tables'      => ['produk_umkm', 'distributor'],
                'objectives'  => ['FULL OUTER JOIN produk_umkm dengan distributor', 'Filter WHERE p.id IS NOT NULL AND d.id IS NOT NULL', 'Tampilkan nama_produk, nama_dist', 'Urutkan nama_produk ASC'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY p.nama_produk ASC',
                'starter_sql'    => "SELECT p.nama_produk, d.nama_dist\nFROM produk_umkm p\nFULL OUTER JOIN distributor d ON p.id = d.produk_id\nWHERE ",
                'solution_query' => 'SELECT p.nama_produk, d.nama_dist FROM produk_umkm p FULL OUTER JOIN distributor d ON p.id = d.produk_id WHERE p.id IS NOT NULL AND d.id IS NOT NULL ORDER BY p.nama_produk ASC',
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 5, 'difficulty' => 4,
                'title'       => 'Laporan Bersih tanpa NULL',
                'briefing'    => 'Laporan final tidak boleh ada NULL. Gunakan COALESCE untuk mengganti NULL pada produk dengan "Belum Terdaftar" dan NULL pada distributor dengan "Belum Ada Distributor".',
                'tables'      => ['produk_umkm', 'distributor'],
                'objectives'  => ['FULL OUTER JOIN produk_umkm dengan distributor', 'COALESCE nama_produk jika NULL ganti "Belum Terdaftar"', 'COALESCE nama_dist jika NULL ganti "Belum Ada Distributor"', 'Urutkan nama_produk ASC'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY nama_produk ASC',
                'starter_sql'    => "SELECT\n  COALESCE(p.nama_produk, 'Belum Terdaftar') AS nama_produk,\n  COALESCE(d.nama_dist, 'Belum Ada Distributor') AS distributor\nFROM produk_umkm p\nFULL OUTER JOIN distributor d ON p.id = d.produk_id\nORDER BY ",
                'solution_query' => "SELECT COALESCE(p.nama_produk, 'Belum Terdaftar') AS nama_produk, COALESCE(d.nama_dist, 'Belum Ada Distributor') AS distributor FROM produk_umkm p FULL OUTER JOIN distributor d ON p.id = d.produk_id ORDER BY nama_produk ASC",
                'rank_unlock'    => 'Union Commander',
            ],
        ];
        $this->insertMissions($id, $missions);
    }

    // ── BAB 2.5 — Struktur Perusahaan (CROSS JOIN & Self JOIN) ─────

    private function seedStrukturPerusahaanDataset(mixed $ch, mixed $sub): mixed
    {
        $schema = <<<'SQL'
CREATE TABLE karyawan_org (
  id         INTEGER PRIMARY KEY,
  nama       TEXT    NOT NULL,
  jabatan    TEXT    NOT NULL,
  gaji       INTEGER NOT NULL,
  manager_id INTEGER REFERENCES karyawan_org(id)
);

CREATE TABLE ukuran (
  id   INTEGER PRIMARY KEY,
  kode TEXT NOT NULL
);

CREATE TABLE warna (
  id   INTEGER PRIMARY KEY,
  nama TEXT NOT NULL
);
SQL;

        $seed = <<<'SQL'
INSERT INTO karyawan_org VALUES
(1,'Reza Purnama','Direktur Utama',50000000,NULL),
(2,'Andika Wijaya','VP Engineering',35000000,1),
(3,'Safira Lestari','VP Marketing',33000000,1),
(4,'Bintang Nugraha','Senior Engineer',22000000,2),
(5,'Chandra Putra','Senior Engineer',21000000,2),
(6,'Dewi Anggraini','Marketing Manager',20000000,3),
(7,'Eko Susilo','Junior Engineer',12000000,4),
(8,'Feby Rahayu','Junior Engineer',11000000,4),
(9,'Gilang Pratama','Content Writer',10000000,6),
(10,'Hana Sari','Data Analyst',13000000,5);

INSERT INTO ukuran VALUES
(1,'S'),
(2,'M'),
(3,'L'),
(4,'XL');

INSERT INTO warna VALUES
(1,'Merah'),
(2,'Biru'),
(3,'Hijau'),
(4,'Hitam'),
(5,'Putih');
SQL;

        return SqlDataset::create([
            'name'          => 'Struktur Perusahaan',
            'description'   => 'Hierarki organisasi karyawan (self-referential) dan tabel ukuran/warna untuk latihan CROSS JOIN',
            'source'        => 'upload',
            'schema_sql'    => $schema,
            'seed_sql'      => $seed,
            'is_active'     => true,
            'chapter_id'    => (string) $ch->_id,
            'subchapter_id' => (string) $sub->_id,
        ]);
    }

    private function seedCrossSelfJoinMissions(mixed $dataset): void
    {
        $id = (string) $dataset->_id;
        $missions = [
            [
                'stage_order' => 1, 'difficulty' => 4,
                'title'       => 'Karyawan dan Manajer Mereka',
                'briefing'    => 'Bagan organisasi memerlukan nama karyawan bersanding dengan nama manajer langsung mereka. Gunakan Self JOIN — join tabel karyawan_org ke dirinya sendiri.',
                'tables'      => ['karyawan_org'],
                'objectives'  => ['Self JOIN: alias k untuk karyawan, m untuk manajer', 'JOIN ON k.manager_id = m.id', 'Tampilkan k.nama AS karyawan, k.jabatan, m.nama AS manajer', 'Kecualikan direktur (manager_id IS NOT NULL)', 'Urutkan k.jabatan ASC, k.nama ASC'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY k.jabatan ASC, k.nama ASC',
                'starter_sql'    => "SELECT k.nama AS karyawan, k.jabatan, m.nama AS manajer\nFROM karyawan_org k\nINNER JOIN karyawan_org m ON k.manager_id = m.id\nWHERE k.manager_id IS NOT NULL\nORDER BY ",
                'solution_query' => 'SELECT k.nama AS karyawan, k.jabatan, m.nama AS manajer FROM karyawan_org k INNER JOIN karyawan_org m ON k.manager_id = m.id WHERE k.manager_id IS NOT NULL ORDER BY k.jabatan ASC, k.nama ASC',
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 2, 'difficulty' => 4,
                'title'       => 'Semua Karyawan Beserta Atasan',
                'briefing'    => 'HR ingin seluruh karyawan termasuk Direktur — yang tidak punya atasan tampilkan "Tidak Ada". Gunakan LEFT JOIN Self JOIN dengan COALESCE.',
                'tables'      => ['karyawan_org'],
                'objectives'  => ['LEFT JOIN Self: FROM karyawan_org k LEFT JOIN karyawan_org m', 'Gunakan COALESCE(m.nama, "Tidak Ada") AS atasan', 'Tampilkan nama, jabatan, gaji, atasan', 'Urutkan gaji DESC'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY k.gaji DESC',
                'starter_sql'    => "SELECT k.nama, k.jabatan, k.gaji,\n  COALESCE(m.nama, 'Tidak Ada') AS atasan\nFROM karyawan_org k\nLEFT JOIN karyawan_org m ON k.manager_id = m.id\nORDER BY ",
                'solution_query' => "SELECT k.nama, k.jabatan, k.gaji, COALESCE(m.nama, 'Tidak Ada') AS atasan FROM karyawan_org k LEFT JOIN karyawan_org m ON k.manager_id = m.id ORDER BY k.gaji DESC",
                'rank_unlock'    => 'Self Aware',
            ],
            [
                'stage_order' => 3, 'difficulty' => 4,
                'title'       => 'Semua Kombinasi Ukuran & Warna',
                'briefing'    => 'Tim produksi kaos perlu tahu semua varian yang harus diproduksi: setiap ukuran dikombinasikan dengan setiap warna. Gunakan CROSS JOIN.',
                'tables'      => ['ukuran', 'warna'],
                'objectives'  => ['Gunakan CROSS JOIN antara ukuran dan warna', 'Tampilkan u.kode AS ukuran, w.nama AS warna', 'Urutkan u.id ASC, w.id ASC'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY u.id ASC, w.id ASC',
                'starter_sql'    => "SELECT u.kode AS ukuran, w.nama AS warna\nFROM ukuran u\nCROSS JOIN ",
                'solution_query' => 'SELECT u.kode AS ukuran, w.nama AS warna FROM ukuran u CROSS JOIN warna w ORDER BY u.id ASC, w.id ASC',
                'rank_unlock'    => 'Matrix Builder',
            ],
            [
                'stage_order' => 4, 'difficulty' => 4,
                'title'       => 'Bawahan VP Engineering',
                'briefing'    => 'VP Engineering ingin tahu siapa saja yang langsung melapor kepadanya. Self JOIN untuk mencari karyawan yang manager_id-nya sama dengan id VP Engineering.',
                'tables'      => ['karyawan_org'],
                'objectives'  => ["Self JOIN: cari karyawan yang melapor ke 'Andika Wijaya'", 'Tampilkan k.nama, k.jabatan, k.gaji', 'Urutkan k.gaji DESC'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY k.gaji DESC',
                'starter_sql'    => "SELECT k.nama, k.jabatan, k.gaji\nFROM karyawan_org k\nINNER JOIN karyawan_org m ON k.manager_id = m.id\nWHERE ",
                'solution_query' => "SELECT k.nama, k.jabatan, k.gaji FROM karyawan_org k INNER JOIN karyawan_org m ON k.manager_id = m.id WHERE m.nama = 'Andika Wijaya' ORDER BY k.gaji DESC",
                'rank_unlock'    => null,
            ],
            [
                'stage_order' => 5, 'difficulty' => 5,
                'title'       => 'Kode Inventori CROSS JOIN',
                'briefing'    => 'Sistem gudang memerlukan kode unik untuk setiap varian produk: kombinasi ukuran dan warna dengan format "kode_warna_id". Hitung juga total kombinasi.',
                'tables'      => ['ukuran', 'warna'],
                'objectives'  => ['CROSS JOIN ukuran dan warna', "Buat kolom kode_varian: u.kode || '_' || w.nama", 'Tampilkan ukuran, warna, kode_varian', 'Urutkan u.id ASC, w.id ASC'],
                'ordered' => true, 'ordering_hint' => 'ORDER BY u.id ASC, w.id ASC',
                'starter_sql'    => "SELECT u.kode AS ukuran, w.nama AS warna,\n  u.kode || '_' || w.nama AS kode_varian\nFROM ukuran u\nCROSS JOIN warna w\nORDER BY ",
                'solution_query' => "SELECT u.kode AS ukuran, w.nama AS warna, u.kode || '_' || w.nama AS kode_varian FROM ukuran u CROSS JOIN warna w ORDER BY u.id ASC, w.id ASC",
                'rank_unlock'    => 'Matrix Commander',
            ],
        ];
        $this->insertMissions($id, $missions);
    }

    // ── Helper ──────────────────────────────────────────────────────

    private function insertMissions(string $datasetId, array $missions): void
    {
        foreach ($missions as $m) {
            SqlMission::create(array_merge($m, [
                'dataset_id' => $datasetId,
                'is_active'  => true,
            ]));
        }
    }
}
