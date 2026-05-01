<?php
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\EducationController;
use App\Http\Controllers\Api\ExperienceController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\SkillController;
use App\Http\Controllers\Api\Admin\AdminCertificateController;
use App\Http\Controllers\Api\Admin\AdminChatController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\Admin\AdminCvController;
use App\Http\Controllers\Api\Admin\AdminEducationController;
use App\Http\Controllers\Api\Admin\AdminExperienceController;
use App\Http\Controllers\Api\Admin\AdminMessageController;
use App\Http\Controllers\Api\Admin\AdminProfileController;
use App\Http\Controllers\Api\Admin\AdminProjectController;
use App\Http\Controllers\Api\Admin\AdminSkillController;
use Illuminate\Support\Facades\Route;

// Public
Route::get('/profile', [ProfileController::class, 'show']);
Route::get('/skills', [SkillController::class, 'index']);
Route::get('/projects', [ProjectController::class, 'index']);
Route::get('/experiences', [ExperienceController::class, 'index']);
Route::get('/education', [EducationController::class, 'index']);
Route::get('/certificates', [CertificateController::class, 'index']);
Route::post('/contact', [ContactController::class, 'store']);
Route::post('/chat', [ChatController::class, 'send']);
Route::get('/chat/{sessionId}', [ChatController::class, 'messages']);

// Auth
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// Admin (protected)
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/messages', [AdminMessageController::class, 'index']);
    Route::patch('/messages/{id}/read', [AdminMessageController::class, 'markRead']);

    Route::get('/profile', [AdminProfileController::class, 'show']);
    Route::put('/profile', [AdminProfileController::class, 'update']);
    Route::post('/cv', [AdminCvController::class, 'update']);

    Route::get('/skills', [AdminSkillController::class, 'index']);
    Route::post('/skills', [AdminSkillController::class, 'store']);
    Route::put('/skills/{id}', [AdminSkillController::class, 'update']);
    Route::delete('/skills/{id}', [AdminSkillController::class, 'destroy']);

    Route::get('/projects', [AdminProjectController::class, 'index']);
    Route::post('/projects', [AdminProjectController::class, 'store']);
    Route::put('/projects/{id}', [AdminProjectController::class, 'update']);
    Route::delete('/projects/{id}', [AdminProjectController::class, 'destroy']);

    Route::get('/experiences', [AdminExperienceController::class, 'index']);
    Route::post('/experiences', [AdminExperienceController::class, 'store']);
    Route::put('/experiences/{id}', [AdminExperienceController::class, 'update']);
    Route::delete('/experiences/{id}', [AdminExperienceController::class, 'destroy']);

    Route::get('/education', [AdminEducationController::class, 'index']);
    Route::post('/education', [AdminEducationController::class, 'store']);
    Route::put('/education/{id}', [AdminEducationController::class, 'update']);
    Route::delete('/education/{id}', [AdminEducationController::class, 'destroy']);

    Route::get('/chat', [AdminChatController::class, 'index']);
    Route::get('/chat/{sessionId}', [AdminChatController::class, 'show']);
    Route::post('/chat/{sessionId}/reply', [AdminChatController::class, 'reply']);
    Route::delete('/chat/{sessionId}', [AdminChatController::class, 'destroy']);

    Route::get('/certificates', [AdminCertificateController::class, 'index']);
    Route::post('/certificates', [AdminCertificateController::class, 'store']);
    Route::put('/certificates/{id}', [AdminCertificateController::class, 'update']);
    Route::delete('/certificates/{id}', [AdminCertificateController::class, 'destroy']);
});
