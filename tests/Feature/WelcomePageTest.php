<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\SpmbCmsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WelcomePageTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_visiting_home_sees_the_public_spmb_portal(): void
    {
        $this->travelTo('2026-11-26 12:00:00');
        $this->seed(SpmbCmsSeeder::class);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Welcome')
                ->where('canLogin', true)
                ->where('canRegister', true)
                ->where('statistics.pathways', 3)
                ->where('statistics.registration_open', true)
                ->has('slides', 2)
                ->has('requirements', 5));
    }

    public function test_spmb_landing_page_displays_spmb_information_and_registration_options(): void
    {
        $this->seed(SpmbCmsSeeder::class);

        $this->get(route('spmb.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Welcome')
                ->where('canLogin', true)
                ->where('canRegister', true));
    }

    public function test_portal_shows_closed_status_when_no_wave_is_active(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Welcome')
                ->where('wave', null)
                ->where('statistics.registration', 'Pendaftaran Ditutup')
                ->where('statistics.registration_open', false));
    }

    public function test_authenticated_user_can_still_open_the_public_spmb_portal(): void
    {
        $this->seed(SpmbCmsSeeder::class);
        $teacher = User::factory()->create(['role' => 'guru']);

        $this->actingAs($teacher)
            ->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Welcome'));
    }
}
