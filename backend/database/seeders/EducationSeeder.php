<?php
namespace Database\Seeders;

use App\Models\Education;
use Illuminate\Database\Seeder;

class EducationSeeder extends Seeder
{
    public function run(): void
    {
        Education::truncate();
        Education::create([
            'institution' => 'Universitas Hasanuddin',
            'degree' => 'S1 (Bachelor)',
            'field' => 'Statistika',
            'start_year' => 2021,
            'end_year' => 2025,
            'description' => 'Focused on statistical analysis, data science, and applied mathematics. Completed thesis on statistical modeling.',
        ]);
    }
}
