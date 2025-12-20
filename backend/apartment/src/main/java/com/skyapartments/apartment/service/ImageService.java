package com.skyapartments.apartment.service;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.skyapartments.apartment.exception.ResourceNotFoundException;
import com.skyapartments.apartment.model.Apartment;
import com.skyapartments.apartment.repository.ApartmentRepository;

import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.core.sync.RequestBody;


import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import jakarta.annotation.PostConstruct;

@Service
public class ImageService {

    private final S3Client s3Client;
    private final ApartmentRepository apartmentRepository;
    private final String bucketName;
    private final String externalUrl;

    public ImageService(
        S3Client s3Client,
        ApartmentRepository apartmentRepository,
        @Value("${minio.bucket}") String bucketName,
        @Value("${minio.external-url}") String externalUrl) {
        this.s3Client = s3Client;
        this.apartmentRepository = apartmentRepository;
        this.bucketName = bucketName;
        this.externalUrl = externalUrl;
    }

   @PostConstruct
    public void init() {
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucketName).build());
        } catch (Exception e) {
            s3Client.createBucket(CreateBucketRequest.builder().bucket(bucketName).build());
            System.out.println("✅ Bucket creado: " + bucketName);
        }
    }

    public String saveImage(MultipartFile file, Long apartmentId) throws Exception {
        Apartment apartment = apartmentRepository.findById(apartmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found"));

        String key = "apartment-" + apartmentId + "/" + System.currentTimeMillis() + "-" + file.getOriginalFilename();

        s3Client.putObject(PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .contentType(file.getContentType())
                        .build(),
                RequestBody.fromBytes(file.getBytes()));

        return externalUrl + "/" + bucketName + "/" + key;
    }

    public void deleteImage(String imageUrl) {
        String key = imageUrl.substring(imageUrl.indexOf(bucketName) + bucketName.length() + 1);
        s3Client.deleteObject(builder -> builder.bucket(bucketName).key(key));
    }

    public boolean imageExists(String imageUrl) {
        String key = imageUrl.substring(imageUrl.indexOf(bucketName) + bucketName.length() + 1);
        try {
            s3Client.headObject(HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build());
            return true;
        } catch (Exception e) {
            return false;
        }
    }

}

