<?php
namespace Database\Seeders;

use App\Models\Skill;
use Illuminate\Database\Seeder;

class SkillSeeder extends Seeder
{
    public function run(): void
    {
        Skill::truncate();
        $skills = [
            ['name' => 'Python', 'category' => 'Languages', 'level' => 4],
            ['name' => 'R', 'category' => 'Languages', 'level' => 3],
            ['name' => 'PHP', 'category' => 'Languages', 'level' => 4],
            ['name' => 'JavaScript', 'category' => 'Languages', 'level' => 4],
            ['name' => 'SQL', 'category' => 'Languages', 'level' => 4],
            ['name' => 'Laravel', 'category' => 'Frameworks', 'level' => 4],
            ['name' => 'React', 'category' => 'Frameworks', 'level' => 3],
            ['name' => 'Pandas', 'category' => 'Data', 'level' => 4],
            ['name' => 'NumPy', 'category' => 'Data', 'level' => 3],
            ['name' => 'Tableau', 'category' => 'Data', 'level' => 3],
            ['name' => 'Power BI', 'category' => 'Data', 'level' => 3],
            ['name' => 'Git', 'category' => 'Tools', 'level' => 4],
            ['name' => 'MongoDB', 'category' => 'Tools', 'level' => 3],
            ['name' => 'Communication', 'category' => 'Soft Skills', 'level' => 5],
        ];
        foreach ($skills as $skill) {
            Skill::create($skill);
        }
    }
}
