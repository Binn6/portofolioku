<?php
namespace Database\Seeders;

use App\Models\Profile;
use Illuminate\Database\Seeder;

class ProfileSeeder extends Seeder
{
    public function run(): void
    {
        Profile::truncate();
        Profile::create([
            'name' => 'Mochsabil Em Abyan',
            'title' => 'Data Analyst & Web Developer',
            'bio' => 'Statistics graduate from Universitas Hasanuddin with hands-on experience in data analysis and web development. Passionate about turning data into insights and building clean, functional web applications.',
            'location' => 'Makassar, Indonesia',
            'email' => 'mochsabilabyan12@gmail.com',
            'phone' => '',
            'github' => 'https://github.com/Binn6',
            'linkedin' => '',
            'instagram' => '',
            'cv_path' => null,
        ]);
    }
}
