<?php
namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::where('email', 'mochsabilabyan12@gmail.com')->delete();
        User::create([
            'name' => 'abin',
            'email' => 'mochsabilabyan12@gmail.com',
            'password' => Hash::make('thisme'),
        ]);
    }
}
