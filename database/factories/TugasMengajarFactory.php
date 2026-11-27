<?php

namespace Database\Factories;

use App\Models\TugasMengajar;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TugasMengajar>
 */
class TugasMengajarFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'jp_per_minggu' => fake()->numberBetween(1, 40),
        ];
    }
}
