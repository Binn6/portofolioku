<?php
namespace Database\Seeders;

use App\Models\Project;
use Illuminate\Database\Seeder;

class ProjectSeeder extends Seeder
{
    public function run(): void
    {
        Project::truncate();
        $projects = [
            [
                'title' => 'Website Alamat Hutan',
                'description' => 'A web application for mapping and cataloging forest addresses in South Sulawesi, built during internship at Balai LHK Makassar.',
                'tech_stack' => ['Laravel', 'MySQL', 'Bootstrap', 'Leaflet.js'],
                'thumbnail_path' => null,
                'github_url' => '',
                'live_url' => '',
                'is_featured' => true,
            ],
            [
                'title' => 'Website Desa',
                'description' => 'Government village website with tourism and cultural information, developed during internship at Disbudpar Sul-Sel.',
                'tech_stack' => ['Laravel', 'MySQL', 'Bootstrap', 'JavaScript'],
                'thumbnail_path' => null,
                'github_url' => '',
                'live_url' => '',
                'is_featured' => true,
            ],
            [
                'title' => 'Analisis Statistik Skripsi',
                'description' => 'Undergraduate thesis project involving statistical modeling and data analysis using R and Python.',
                'tech_stack' => ['R', 'Python', 'Pandas', 'ggplot2'],
                'thumbnail_path' => null,
                'github_url' => '',
                'live_url' => '',
                'is_featured' => false,
            ],
        ];
        foreach ($projects as $project) {
            Project::create($project);
        }
    }
}
