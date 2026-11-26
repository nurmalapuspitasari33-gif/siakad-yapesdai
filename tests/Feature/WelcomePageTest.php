<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WelcomePageTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_visiting_home_is_redirected_to_login(): void
    {
        $this->get('/')
            ->assertRedirect(route('login', absolute: false));
    }

    public function test_spmb_landing_page_displays_spmb_information_and_registration_options(): void
    {
        $this->get(route('spmb.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Welcome')
                ->where('canLogin', true)
                ->where('canRegister', true));
    }

    public function test_authenticated_user_visiting_home_is_redirected_to_dashboard(): void
    {
        $teacher = User::factory()->create(['role' => 'guru']);

        $this->actingAs($teacher)
            ->get('/')
            ->assertRedirect(route('dashboard', absolute: false));
    }
}
