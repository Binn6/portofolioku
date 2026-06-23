<?php
// backend/app/Http/Controllers/Api/SqlPlayerAuthController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SqlPlayer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SqlPlayerAuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'username' => ['required', 'string', 'min:3', 'max:30', Rule::unique(SqlPlayer::class, 'username')],
            'email'    => ['required', 'email',            Rule::unique(SqlPlayer::class, 'email')],
            'password' => ['required', 'string', 'min:8', 'max:255', 'confirmed'],
        ]);

        $player = SqlPlayer::create($data);
        $token  = $player->createToken('sql-player')->plainTextToken;

        return response()->json([
            'token'  => $token,
            'player' => $this->playerShape($player),
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'login'    => 'required|string',
            'password' => 'required|string',
        ]);

        $login  = $request->login;
        $player = filter_var($login, FILTER_VALIDATE_EMAIL)
            ? SqlPlayer::where('email', $login)->first()
            : SqlPlayer::where('username', $login)->first();

        if (!$player || !Hash::check($request->password, $player->password)) {
            throw ValidationException::withMessages([
                'login' => ['Username/email atau password salah.'],
            ]);
        }

        $token = $player->createToken('sql-player')->plainTextToken;

        return response()->json([
            'token'  => $token,
            'player' => $this->playerShape($player),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        return response()->json($this->playerShape($request->user()));
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        // Check mail is configured
        $mailer = config('mail.default', 'log');
        $host   = config("mail.mailers.{$mailer}.host", null);
        if (!$host || $host === 'localhost' || $host === '127.0.0.1') {
            return response()->json(['message' => 'Layanan email belum dikonfigurasi'], 503);
        }

        $status = Password::broker('sql_players')->sendResetLink(
            $request->only('email')
        );

        return $status === Password::RESET_LINK_SENT
            ? response()->json(['message' => 'Link reset password telah dikirim ke email kamu.'])
            : response()->json(['message' => 'Email tidak ditemukan.'], 422);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token'                 => 'required|string',
            'email'                 => 'required|email',
            'password'              => 'required|string|min:8|max:255|confirmed',
        ]);

        $status = Password::broker('sql_players')->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (SqlPlayer $player, string $password) {
                $player->forceFill(['password' => $password])->save();
                $player->tokens()->delete();
            }
        );

        return $status === Password::PASSWORD_RESET
            ? response()->json(['message' => 'Password berhasil direset. Silakan login.'])
            : response()->json(['message' => __($status)], 422);
    }

    private function playerShape(SqlPlayer $player): array
    {
        return [
            'id'       => (string) $player->_id,
            'username' => $player->username,
            'email'    => $player->email,
        ];
    }
}
