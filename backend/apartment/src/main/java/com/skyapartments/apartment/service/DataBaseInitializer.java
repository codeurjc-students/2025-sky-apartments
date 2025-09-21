package com.skyapartments.apartment.service;

import java.math.BigDecimal;
import java.nio.file.Files;
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
        Set<String> servicios1 = new HashSet<>(Arrays.asList("WiFi", "Aire acondicionado", "Piscina"));
        Set<String> servicios2 = new HashSet<>(Arrays.asList("WiFi", "Calefacción", "Parking"));
        Set<String> servicios3 = new HashSet<>(Arrays.asList("WiFi", "TV", "Balcón"));
        Set<String> servicios4 = new HashSet<>(Arrays.asList("Cocina equipada", "Lavadora", "Secadora"));
        Set<String> servicios5 = new HashSet<>(Arrays.asList("WiFi", "Gimnasio", "Jacuzzi"));
        Set<String> servicios6 = new HashSet<>(Arrays.asList("WiFi", "Piscina", "Parking"));
        Set<String> servicios7 = new HashSet<>(Arrays.asList("Aire acondicionado", "Calefacción", "Terraza"));
        Set<String> servicios8 = new HashSet<>(Arrays.asList("WiFi", "Cocina equipada", "TV"));
        Set<String> servicios9 = new HashSet<>(Arrays.asList("WiFi", "Piscina", "Barbacoa"));
        Set<String> servicios10 = new HashSet<>(Arrays.asList("WiFi", "Calefacción", "Balcón"));

        Apartment apto1 = new Apartment("Apartamento Vista Mar", "Hermoso apartamento con vistas al mar", BigDecimal.valueOf(120.0), servicios1, 4);
        Apartment apto2 = new Apartment("Loft Urbano", "Moderno loft en el centro de la ciudad", BigDecimal.valueOf(90.0), servicios2, 2);
        Apartment apto3 = new Apartment("Estudio Acogedor", "Pequeño estudio ideal para una pareja", BigDecimal.valueOf(60.0), servicios3, 2);
        Apartment apto4 = new Apartment("Casa Rural El Roble", "Casa en plena naturaleza con encanto rústico", BigDecimal.valueOf(150.0), servicios4, 6);
        Apartment apto5 = new Apartment("Penthouse Deluxe", "Ático de lujo con vistas panorámicas", BigDecimal.valueOf(200.0), servicios5, 4);
        Apartment apto6 = new Apartment("Villa Piscina Privada", "Villa con piscina privada y jardín", BigDecimal.valueOf(250.0), servicios6, 8);
        Apartment apto7 = new Apartment("Apartamento Familiar", "Amplio apartamento ideal para familias", BigDecimal.valueOf(130.0), servicios7, 5);
        Apartment apto8 = new Apartment("Mini Loft", "Mini loft económico en buena ubicación", BigDecimal.valueOf(70.0), servicios8, 2);
        Apartment apto9 = new Apartment("Chalet Vacacional", "Chalet con piscina y barbacoa para grupos", BigDecimal.valueOf(180.0), servicios9, 7);
        Apartment apto10 = new Apartment("Estudio Romántico", "Estudio decorado para escapadas en pareja", BigDecimal.valueOf(85.0), servicios10, 2);

        apto1 = apartmentRepository.save(apto1);
        apto2 = apartmentRepository.save(apto2);
        apto3 = apartmentRepository.save(apto3);
        apto4 = apartmentRepository.save(apto4);
        apto5 = apartmentRepository.save(apto5);
        apto6 = apartmentRepository.save(apto6);
        apto7 = apartmentRepository.save(apto7);
        apto8 = apartmentRepository.save(apto8);
        apto9 = apartmentRepository.save(apto9);
        apto10 = apartmentRepository.save(apto10);

        addImageToApartment(apto1.getId(), "static/test-images/apt1.jpg");
        addImageToApartment(apto2.getId(), "static/test-images/apt2.jpg");
        addImageToApartment(apto3.getId(), "static/test-images/apt3.jpg");
        addImageToApartment(apto4.getId(), "static/test-images/apt4.jpg");
        addImageToApartment(apto5.getId(), "static/test-images/apt5.jpg");
        addImageToApartment(apto6.getId(), "static/test-images/apt6.jpg");
        addImageToApartment(apto7.getId(), "static/test-images/apt7.jpg");
        addImageToApartment(apto8.getId(), "static/test-images/apt8.jpg");
        addImageToApartment(apto9.getId(), "static/test-images/apt9.jpg");
        addImageToApartment(apto10.getId(), "static/test-images/apt10.jpg");

    }

    private void addImageToApartment(Long apartmentId, String resourcePath) throws Exception {
        ClassPathResource resource = new ClassPathResource(resourcePath);
        MultipartFile multipartFile = new MockMultipartFile(
                resource.getFilename(),
                resource.getFilename(),
                Files.probeContentType(resource.getFile().toPath()),
                resource.getInputStream()
        );

        String url = imageService.saveImage(multipartFile, apartmentId);

        Apartment apartment = apartmentRepository.findById(apartmentId).orElseThrow();
        apartment.setImageUrl(url);
        apartmentRepository.save(apartment);
    }
}

