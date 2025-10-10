package com.skyapartments.apartment.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import io.micrometer.tracing.Tracer;
import io.micrometer.tracing.propagation.Propagator;

@Configuration
public class FeignTracingConfig {

    private final Tracer tracer;
    private final Propagator propagator;

    public FeignTracingConfig(Tracer tracer, Propagator propagator) {
        this.tracer = tracer;
        this.propagator = propagator;
    }

    @Bean
    public RequestInterceptor feignRequestInterceptor() {
        return requestTemplate -> {
            propagator.inject(tracer.currentSpan().context(), requestTemplate, RequestTemplate::header);
        };
    }
}
