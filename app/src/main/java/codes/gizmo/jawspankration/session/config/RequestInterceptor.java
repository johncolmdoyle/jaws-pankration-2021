package codes.gizmo.jawspankration.session.config;

import codes.gizmo.jawspankration.session.config.Caller;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.handler.HandlerInterceptorAdapter;
import org.springframework.web.util.ContentCachingRequestWrapper;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.UUID;


@Slf4j
@Component
public class RequestInterceptor extends HandlerInterceptorAdapter {

    private Caller caller;

    public RequestInterceptor(Caller caller) {
        super();
        this.caller = caller;
    }

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler) {
        HttpServletRequest requestCacheWrapperObject
                = new ContentCachingRequestWrapper(request);

        // New call - new UUID
        caller.addKey("traceId", UUID.randomUUID().toString());

        // Set the userId
        if (requestCacheWrapperObject.getHeader("userId") != null) {
            caller.addKey("userId", requestCacheWrapperObject.getHeader("userId"));
        } else {
            caller.addKey("userId", "Unknown ID");
        }

        // Set the auth0Id
        if (requestCacheWrapperObject.getHeader("auth0Id") != null) {
            caller.addKey("auth0Id", requestCacheWrapperObject.getHeader("auth0Id"));
        } else {
            caller.addKey("auth0Id", "Unknown Auth0 ID");
        }

        return true;
    }

    @Override
    public void afterCompletion(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler,
            Exception ex) {
        //
    }
}
