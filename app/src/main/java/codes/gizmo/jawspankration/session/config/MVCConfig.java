package codes.gizmo.jawspankration.session.config;

import codes.gizmo.jawspankration.session.config.RequestInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.handler.MappedInterceptor;

@Configuration
public class MVCConfig implements WebMvcConfigurer {

    @Autowired
    private Caller caller;

    @Bean
    public MappedInterceptor manageInterceptor() {
        return new MappedInterceptor(null, new RequestInterceptor(caller));
    }
}
