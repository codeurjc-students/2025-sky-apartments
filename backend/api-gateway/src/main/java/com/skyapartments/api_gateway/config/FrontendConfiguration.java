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

/**
 * Configuración para servir el frontend Angular como recursos estáticos.
 * 
 * Esta configuración maneja:
 * 1. Servir archivos estáticos del frontend
 * 2. Redirigir todas las rutas de Angular a index.html (para routing del lado del cliente)
 * 3. Mantener las rutas de la API intactas
 */
@Configuration
public class FrontendConfiguration {

    /**
     * Router para servir el frontend Angular.
     * 
     * IMPORTANTE: Las rutas /api/** son manejadas por el Gateway antes de llegar aquí.
     * Esta configuración solo maneja rutas que NO empiezan con /api/
     */
    @Bean
    public RouterFunction<ServerResponse> frontendRouter() {
        return RouterFunctions
            // Servir index.html para la raíz
            .route(GET("/"), request -> 
                ok()
                    .contentType(MediaType.TEXT_HTML)
                    .bodyValue(getIndexHtml())
            )
            // Servir index.html para todas las rutas que NO son API ni archivos estáticos
            // Esto permite que el routing de Angular funcione correctamente
            .andRoute(GET("/{path:[^\\.]*}"), request -> 
                ok()
                    .contentType(MediaType.TEXT_HTML)
                    .bodyValue(getIndexHtml())
            )
            // Servir archivos estáticos con extensión (js, css, images, etc.)
            .andRoute(GET("/{path:.*\\..*}"), request -> {
                String path = request.pathVariable("path");
                
                // Primero intentar desde /app/static (Docker)
                Resource fileResource = new org.springframework.core.io.FileSystemResource("/app/static/" + path);
                if (fileResource.exists()) {
                    return ok()
                        .contentType(getMediaType(path))
                        .bodyValue(fileResource);
                }
                
                // Fallback a classpath (desarrollo local)
                Resource classpathResource = new ClassPathResource("static/" + path);
                if (classpathResource.exists()) {
                    return ok()
                        .contentType(getMediaType(path))
                        .bodyValue(classpathResource);
                }
                
                // Si el archivo no existe, servir index.html (para rutas de Angular)
                return ok()
                    .contentType(MediaType.TEXT_HTML)
                    .bodyValue(getIndexHtml());
            });
    }

    /**
     * Obtiene el contenido de index.html
     */
    private Resource getIndexHtml() {
        // Primero intentar desde /app/static (Docker)
        try {
            Resource fileResource = new org.springframework.core.io.FileSystemResource("/app/static/index.html");
            if (fileResource.exists()) {
                return fileResource;
            }
        } catch (Exception e) {
            // Si falla, intentar desde classpath
        }
        
        // Fallback a classpath (desarrollo local)
        return new ClassPathResource("static/index.html");
    }

    /**
     * Determina el MediaType basado en la extensión del archivo
     */
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