<?php

namespace App\Services;

use Cloudinary\Cloudinary;
use Cloudinary\Configuration\Configuration;
use Illuminate\Http\UploadedFile;

class CloudinaryService
{
    protected Cloudinary $cloudinary;

    public function __construct()
    {
        $config = new Configuration([
            'cloud' => [
                'cloud_name' => config('services.cloudinary.cloud_name'),
                'api_key'    => config('services.cloudinary.api_key'),
                'api_secret' => config('services.cloudinary.api_secret'),
            ],
        ]);

        $this->cloudinary = new Cloudinary($config);
    }

    /**
     * Upload a file to Cloudinary.
     *
     * @param  UploadedFile  $file
     * @param  string        $folder
     * @param  string        $resourceType
     * @return array{url: string, public_id: string}
     */
    public function upload(UploadedFile $file, string $folder, string $resourceType = 'image'): array
    {
        $response = $this->cloudinary->uploadApi()->upload(
            $file->getRealPath(),
            [
                'folder'        => $folder,
                'resource_type' => $resourceType,
            ]
        );

        return [
            'url'       => $response['secure_url'],
            'public_id' => $response['public_id'],
        ];
    }

    /**
     * Delete a file from Cloudinary by its public ID.
     *
     * @param  string  $publicId
     * @param  string  $resourceType
     * @return void
     */
    public function delete(string $publicId, string $resourceType = 'image'): void
    {
        if (empty($publicId)) {
            return;
        }

        $this->cloudinary->uploadApi()->destroy(
            $publicId,
            ['resource_type' => $resourceType]
        );
    }
}
