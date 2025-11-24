package com.skyapartments.api_gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

import static org.springframework.web.reactive.function.server.RequestPredicates.GET;
import static org.springframework.web.reactive.function.server.ServerResponse.ok;

@Configuration
public class FrontendConfiguration {


    @Bean
    public RouterFunction<ServerResponse> frontendRouter() {
        return RouterFunctions

            .route(GET("/"), request -> 
                ok()
                    .contentType(MediaType.TEXT_HTML)
                    .bodyValue(getIndexHtml())
            )

            .andRoute(GET("/{path:[^\\.]*}"), request -> 
                ok()
                    .contentType(MediaType.TEXT_HTML)
                    .bodyValue(getIndexHtml())
            )

            .andRoute(GET("/{path:.*\\..*}"), request -> {
                String path = request.pathVariable("path");
                
     
                Resource fileResource = new org.springframework.core.io.FileSystemResource("/app/static/" + path);
                if (fileResource.exists()) {
                    return ok()
                        .contentType(getMediaType(path))
                        .bodyValue(fileResource);
                }

                Resource classpathResource = new ClassPathResource("static/" + path);
                if (classpathResource.exists()) {
                    return ok()
                        .contentType(getMediaType(path))
                        .bodyValue(classpathResource);
                }
                
   
                return ok()
                    .contentType(MediaType.TEXT_HTML)
                    .bodyValue(getIndexHtml());
            });
    }


    private Resource getIndexHtml() {
  
        try {
            Resource fileResource = new org.springframework.core.io.FileSystemResource("/app/static/index.html");
            if (fileResource.exists()) {
                return fileResource;
            }
        } catch (Exception e) {
        }
        
        return new ClassPathResource("static/index.html");
    }

    private MediaType getMediaType(String path) {
        if (path.endsWith(".js")) {
            return MediaType.valueOf("application/javascript");
        } else if (path.endsWith(".css")) {
            return MediaType.valueOf("text/css");
        } else if (path.endsWith(".html")) {
            return MediaType.TEXT_HTML;
        } else if (path.endsWith(".json")) {
            return MediaType.APPLICATION_JSON;
        } else if (path.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        } else if (path.endsWith(".jpg") || path.endsWith(".jpeg")) {
            return MediaType.IMAGE_JPEG;
        } else if (path.endsWith(".gif")) {
            return MediaType.IMAGE_GIF;
        } else if (path.endsWith(".svg")) {
            return MediaType.valueOf("image/svg+xml");
        } else if (path.endsWith(".ico")) {
            return MediaType.valueOf("image/x-icon");
        } else if (path.endsWith(".woff")) {
            return MediaType.valueOf("font/woff");
        } else if (path.endsWith(".woff2")) {
            return MediaType.valueOf("font/woff2");
        } else if (path.endsWith(".ttf")) {
            return MediaType.valueOf("font/ttf");
        } else {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }
}