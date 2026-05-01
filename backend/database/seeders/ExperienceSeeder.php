<?php
namespace Database\Seeders;

use App\Models\Experience;
use Illuminate\Database\Seeder;

class ExperienceSeeder extends Seeder
{
    public function run(): void
    {
        Experience::truncate();
        $experiences = [
            [
                'title' => 'Data Analyst Intern',
                'company' => 'Balai Litbang LHK Makassar',
                'type' => 'internship',
                'start_date' => '2025-01',
                'end_date' => '2025-02',
                'description' => 'Performed data collection and analysis for environmental research projects. Created visualizations and reports using Python and Excel.',
                'is_current' => false,
            ],
            [
                'title' => 'Web Developer Intern',
                'company' => 'Dinas Kebudayaan dan Pariwisata Sul-Sel',
                'type' => 'internship',
                'start_date' => '2025-03',
                'end_date' => '2025-06',
                'description' => 'Developed and maintained government tourism website. Built features using Laravel and improved frontend UI with Bootstrap and JavaScript.',
                'is_current' => false,
            ],
            [
                'title' => 'Ketua Umum',
                'company' => 'MPK SMAN 1 Sungguminasa',
                'type' => 'organization',
                'start_date' => '2021',
                'end_date' => '2022',
                'description' => 'Led the student representative council, coordinating inter-organization activities and managing student affairs.',
                'is_current' => false,
            ],
            [
                'title' => 'Anggota',
                'company' => 'MPK SMAN 1 Sungguminasa',
                'type' => 'organization',
                'start_date' => '2019',
                'end_date' => '2020',
                'description' => 'Participated in student council activities and supported event coordination.',
                'is_current' => false,
            ],
        ];
        foreach ($experiences as $exp) {
            Experience::create($exp);
        }
    }
}
