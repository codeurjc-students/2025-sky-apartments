package com.skyapartments.apartment.service;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.skyapartments.apartment.model.Apartment;
import com.skyapartments.apartment.repository.ApartmentRepository;

import jakarta.annotation.PostConstruct;

import org.springframework.mock.web.MockMultipartFile;


@Component
public class DataBaseInitializer {
    
    private final ApartmentRepository apartmentRepository;
    private final ImageService imageService;

    public DataBaseInitializer(ApartmentRepository apartmentRepository, ImageService imageService) {
        this.apartmentRepository = apartmentRepository;
        this.imageService = imageService;
    }

    @PostConstruct
    public void initializeDatabase() throws Exception {

        if (apartmentRepository.count() > 0) {
            return;
        }
        Set<String> services1 = new HashSet<>(Arrays.asList("WiFi", "Air conditioning", "Pool"));
        Set<String> services2 = new HashSet<>(Arrays.asList("WiFi", "Heating", "Parking"));
        Set<String> services3 = new HashSet<>(Arrays.asList("WiFi", "TV", "Balcony"));
        Set<String> services4 = new HashSet<>(Arrays.asList("Fully equipped kitchen", "Washing machine", "Dryer"));
        Set<String> services5 = new HashSet<>(Arrays.asList("WiFi", "Gym", "Jacuzzi"));
        Set<String> services6 = new HashSet<>(Arrays.asList("WiFi", "Pool", "Parking"));
        Set<String> services7 = new HashSet<>(Arrays.asList("Air conditioning", "Heating", "Terrace"));
        Set<String> services8 = new HashSet<>(Arrays.asList("WiFi", "Fully equipped kitchen", "TV"));
        Set<String> services9 = new HashSet<>(Arrays.asList("WiFi", "Pool", "BBQ"));
        Set<String> services10 = new HashSet<>(Arrays.asList("WiFi", "Heating", "Balcony"));

        Apartment apt1 = new Apartment("Sea View Apartment", "Beautiful apartment with ocean views", BigDecimal.valueOf(120.0), services1, 4);
        Apartment apt2 = new Apartment("Urban Loft", "Modern loft in the city center", BigDecimal.valueOf(90.0), services2, 2);
        Apartment apt3 = new Apartment("Cozy Studio", "Small studio ideal for a couple", BigDecimal.valueOf(60.0), services3, 2);
        Apartment apt4 = new Apartment("The Oak Country House", "House in the heart of nature with rustic charm", BigDecimal.valueOf(150.0), services4, 6);
        Apartment apt5 = new Apartment("Deluxe Penthouse", "Luxury penthouse with panoramic views", BigDecimal.valueOf(200.0), services5, 4);
        Apartment apt6 = new Apartment("Private Pool Villa", "Villa with a private pool and garden", BigDecimal.valueOf(250.0), services6, 8);
        Apartment apt7 = new Apartment("Family Apartment", "Spacious apartment ideal for families", BigDecimal.valueOf(130.0), services7, 5);
        Apartment apt8 = new Apartment("Mini Loft", "Affordable mini loft in a great location", BigDecimal.valueOf(70.0), services8, 2);
        Apartment apt9 = new Apartment("Vacation Chalet", "Chalet with pool and BBQ for groups", BigDecimal.valueOf(180.0), services9, 7);
        Apartment apt10 = new Apartment("Romantic Studio", "Decorated studio for couples' getaways", BigDecimal.valueOf(85.0), services10, 2);


        apt1 = apartmentRepository.save(apt1);
        apt2 = apartmentRepository.save(apt2);
        apt3 = apartmentRepository.save(apt3);
        apt4 = apartmentRepository.save(apt4);
        apt5 = apartmentRepository.save(apt5);
        apt6 = apartmentRepository.save(apt6);
        apt7 = apartmentRepository.save(apt7);
        apt8 = apartmentRepository.save(apt8);
        apt9 = apartmentRepository.save(apt9);
        apt10 = apartmentRepository.save(apt10);

        addImageToApartment(apt1.getId(), "static/test-images/main1.jpg");
        addImageToApartment(apt1.getId(), "static/test-images/kitchen1.jpg");
        addImageToApartment(apt1.getId(), "static/test-images/toilet1.jpg");
        addImageToApartment(apt1.getId(), "static/test-images/room1.jpg");
        addImageToApartment(apt1.getId(), "static/test-images/ext1.jpg");

        addImageToApartment(apt2.getId(), "static/test-images/main2.jpg");
        addImageToApartment(apt3.getId(), "static/test-images/main3.jpg");
        addImageToApartment(apt4.getId(), "static/test-images/main4.jpg");
        addImageToApartment(apt5.getId(), "static/test-images/main5.jpg");
        addImageToApartment(apt6.getId(), "static/test-images/main6.jpg");
        addImageToApartment(apt7.getId(), "static/test-images/main7.jpg");
        addImageToApartment(apt8.getId(), "static/test-images/main8.jpg");
        addImageToApartment(apt9.getId(), "static/test-images/main9.jpg");
        addImageToApartment(apt10.getId(), "static/test-images/main10.jpg");


        addImageToApartment(apt2.getId(), "static/test-images/kitchen2.jpg");
        addImageToApartment(apt3.getId(), "static/test-images/kitchen3.jpg");
        addImageToApartment(apt4.getId(), "static/test-images/kitchen4.jpg");
        addImageToApartment(apt5.getId(), "static/test-images/kitchen5.jpg");
        addImageToApartment(apt6.getId(), "static/test-images/kitchen6.jpg");
        addImageToApartment(apt7.getId(), "static/test-images/kitchen7.jpg");
        addImageToApartment(apt8.getId(), "static/test-images/kitchen8.jpg");
        addImageToApartment(apt9.getId(), "static/test-images/kitchen9.jpg");
        addImageToApartment(apt10.getId(), "static/test-images/kitchen10.jpg");

        addImageToApartment(apt2.getId(), "static/test-images/room2.jpg");
        addImageToApartment(apt3.getId(), "static/test-images/room3.jpg");
        addImageToApartment(apt4.getId(), "static/test-images/room4.jpg");
        addImageToApartment(apt5.getId(), "static/test-images/room5.jpg");
        addImageToApartment(apt6.getId(), "static/test-images/room6.jpg");
        addImageToApartment(apt7.getId(), "static/test-images/room7.jpg");
        addImageToApartment(apt8.getId(), "static/test-images/room8.jpg");
        addImageToApartment(apt9.getId(), "static/test-images/room9.jpg");
        addImageToApartment(apt10.getId(), "static/test-images/room10.jpg");

        addImageToApartment(apt2.getId(), "static/test-images/toilet2.jpg");
        addImageToApartment(apt3.getId(), "static/test-images/toilet3.jpg");
        addImageToApartment(apt4.getId(), "static/test-images/toilet4.jpg");
        addImageToApartment(apt5.getId(), "static/test-images/toilet5.jpg");
        addImageToApartment(apt6.getId(), "static/test-images/toilet6.jpg");
        addImageToApartment(apt7.getId(), "static/test-images/toilet7.jpg");
        addImageToApartment(apt8.getId(), "static/test-images/toilet8.jpg");
        addImageToApartment(apt9.getId(), "static/test-images/toilet9.jpg");
        addImageToApartment(apt10.getId(), "static/test-images/toilet10.jpg");

        addImageToApartment(apt2.getId(), "static/test-images/ext2.jpg");
        addImageToApartment(apt3.getId(), "static/test-images/ext3.jpg");

    }

    private void addImageToApartment(Long apartmentId, String resourcePath) throws Exception {
        ClassPathResource resource = new ClassPathResource(resourcePath);
        String contentType = Files.probeContentType(Path.of(resource.getFilename()));
        if (contentType == null) {
            contentType = "image/jpeg";
        }

        MultipartFile multipartFile = new MockMultipartFile(
                resource.getFilename(),
                resource.getFilename(),
                contentType,
                resource.getInputStream()
        );

        String url = imageService.saveImage(multipartFile, apartmentId);

        Apartment apartment = apartmentRepository.findById(apartmentId).orElseThrow();
        apartment.addImageUrl(url);
        apartmentRepository.save(apartment);
    }

}

