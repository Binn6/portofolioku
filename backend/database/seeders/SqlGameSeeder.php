<?php

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
        $dataset     = $this->seedUniversitasDataset($chapters[0], $subchapters[0][0]);
        $this->seedMissions($dataset);
    }

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
            // BAB 1
            [
                ['name' => '1.1 SELECT Dasar',       'description' => 'SELECT *, SELECT kolom tertentu, dan alias kolom',              'order' => 1],
                ['name' => '1.2 WHERE & Filter',     'description' => 'Kondisi dengan AND, OR, NOT, BETWEEN, IN, LIKE',                'order' => 2],
                ['name' => '1.3 ORDER BY & LIMIT',   'description' => 'Mengurutkan hasil dan membatasi jumlah baris yang ditampilkan', 'order' => 3],
                ['name' => '1.4 Fungsi Agregasi',    'description' => 'COUNT, SUM, AVG, MIN, MAX untuk kalkulasi kolom',              'order' => 4],
                ['name' => '1.5 GROUP BY & HAVING',  'description' => 'Mengelompokkan data dan memfilter hasil agregasi',             'order' => 5],
            ],
            // BAB 2
            [
                ['name' => '2.1 INNER JOIN',                'description' => 'Gabungkan baris yang cocok di kedua tabel',                    'order' => 1],
                ['name' => '2.2 LEFT JOIN',                 'description' => 'Semua baris tabel kiri + baris kanan yang cocok',               'order' => 2],
                ['name' => '2.3 RIGHT JOIN',                'description' => 'Semua baris tabel kanan + baris kiri yang cocok',               'order' => 3],
                ['name' => '2.4 FULL OUTER JOIN',           'description' => 'Semua baris dari kedua tabel, NULL jika tidak ada pasangan',    'order' => 4],
                ['name' => '2.5 CROSS JOIN & Self JOIN',    'description' => 'Produk kartesian dan join tabel ke dirinya sendiri',            'order' => 5],
            ],
            // BAB 3
            [
                ['name' => '3.1 Subquery di WHERE',      'description' => 'Filter baris menggunakan hasil query lain',                          'order' => 1],
                ['name' => '3.2 Subquery di FROM',       'description' => 'Derived table: query bersarang sebagai sumber data',                 'order' => 2],
                ['name' => '3.3 Subquery Correlated',    'description' => 'Subquery yang mereferensikan kolom dari query luar',                 'order' => 3],
                ['name' => '3.4 CTE dengan WITH',        'description' => 'Common Table Expression untuk query lebih mudah dibaca',            'order' => 4],
                ['name' => '3.5 Recursive CTE',          'description' => 'CTE rekursif untuk traversal data hierarkis',                       'order' => 5],
            ],
            // BAB 4
            [
                ['name' => '4.1 ROW_NUMBER & RANK',       'description' => 'Penomoran baris dan ranking dengan fungsi jendela',                 'order' => 1],
                ['name' => '4.2 DENSE_RANK & NTILE',      'description' => 'Ranking tanpa gap dan pembagian data ke dalam bucket',             'order' => 2],
                ['name' => '4.3 LAG & LEAD',              'description' => 'Mengakses nilai baris sebelumnya atau berikutnya',                  'order' => 3],
                ['name' => '4.4 Running Total & Moving Avg', 'description' => 'SUM/AVG OVER untuk akumulasi dan rata-rata bergerak',           'order' => 4],
                ['name' => '4.5 PARTITION BY',            'description' => 'Window function per partisi / grup data',                          'order' => 5],
            ],
            // BAB 5
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
                $subs[] = SqlSubchapter::create(array_merge(
                    $def,
                    ['chapter_id' => (string) $chapter->_id]
                ));
            }
            $all[] = $subs;
        }
        return $all;
    }

    private function seedUniversitasDataset(mixed $chapter1, mixed $sub11): mixed
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
            'chapter_id'    => (string) $chapter1->_id,
            'subchapter_id' => (string) $sub11->_id,
        ]);
    }

    private function seedMissions(mixed $dataset): void
    {
        $datasetId = (string) $dataset->_id;

        $missions = [
            [
                'stage_order'    => 1,
                'title'          => 'Tampilkan Semua Mahasiswa',
                'briefing'       => 'Sistem butuh daftar lengkap seluruh mahasiswa yang terdaftar. Tampilkan semua data dari tabel mahasiswa.',
                'tables'         => ['mahasiswa'],
                'objectives'     => ['Tampilkan semua kolom', 'Tampilkan semua baris'],
                'ordering_hint'  => null,
                'ordered'        => false,
                'starter_sql'    => "-- Gunakan SELECT untuk menampilkan semua data\nSELECT ",
                'solution_query' => 'SELECT * FROM mahasiswa',
                'rank_unlock'    => null,
            ],
            [
                'stage_order'    => 2,
                'title'          => 'Daftar Nama dan Jurusan',
                'briefing'       => 'Admin hanya butuh nama dan jurusan mahasiswa untuk laporan singkat. Tampilkan hanya dua kolom tersebut.',
                'tables'         => ['mahasiswa'],
                'objectives'     => ['Tampilkan kolom nama', 'Tampilkan kolom jurusan'],
                'ordering_hint'  => null,
                'ordered'        => false,
                'starter_sql'    => "-- Pilih kolom spesifik yang dibutuhkan\nSELECT ",
                'solution_query' => 'SELECT nama, jurusan FROM mahasiswa',
                'rank_unlock'    => 'Query Runner',
            ],
            [
                'stage_order'    => 3,
                'title'          => 'Filter Jurusan TI',
                'briefing'       => 'Dekan Teknik Informatika meminta daftar seluruh mahasiswa jurusannya. Tampilkan hanya mahasiswa dari jurusan Teknik Informatika.',
                'tables'         => ['mahasiswa'],
                'objectives'     => ['Hanya mahasiswa Teknik Informatika', 'Gunakan WHERE clause'],
                'ordering_hint'  => null,
                'ordered'        => false,
                'starter_sql'    => "-- Gunakan WHERE untuk filter data\nSELECT * FROM mahasiswa\nWHERE ",
                'solution_query' => "SELECT * FROM mahasiswa WHERE jurusan = 'Teknik Informatika'",
                'rank_unlock'    => null,
            ],
            [
                'stage_order'    => 4,
                'title'          => 'Mahasiswa Berprestasi',
                'briefing'       => 'Beasiswa tersedia untuk mahasiswa ber-IPK di atas 3.5. Tampilkan nama dan IPK mereka, urutkan dari IPK tertinggi.',
                'tables'         => ['mahasiswa'],
                'objectives'     => ['Filter IPK lebih dari 3.5', 'Urutkan dari IPK tertinggi'],
                'ordering_hint'  => 'ORDER BY ipk DESC',
                'ordered'        => true,
                'starter_sql'    => "-- Filter dan urutkan hasil query\nSELECT nama, ipk FROM mahasiswa\nWHERE ",
                'solution_query' => 'SELECT nama, ipk FROM mahasiswa WHERE ipk > 3.5 ORDER BY ipk DESC',
                'rank_unlock'    => 'Join Master',
            ],
            [
                'stage_order'    => 5,
                'title'          => 'Top 5 Mahasiswa',
                'briefing'       => 'Rektorat ingin tahu 5 mahasiswa terbaik berdasarkan IPK. Tampilkan nim, nama, dan ipk mereka saja.',
                'tables'         => ['mahasiswa'],
                'objectives'     => ['Tampilkan kolom nim, nama, ipk', 'Urutkan dari IPK tertinggi', 'Batasi hanya 5 baris'],
                'ordering_hint'  => 'ORDER BY ipk DESC',
                'ordered'        => true,
                'starter_sql'    => "-- Batasi hasil dengan LIMIT\nSELECT nim, nama, ipk FROM mahasiswa\nORDER BY ",
                'solution_query' => 'SELECT nim, nama, ipk FROM mahasiswa ORDER BY ipk DESC LIMIT 5',
                'rank_unlock'    => 'Index Wizard',
            ],
        ];

        foreach ($missions as $m) {
            SqlMission::create(array_merge($m, [
                'dataset_id' => $datasetId,
                'is_active'  => true,
            ]));
        }
    }
}
