package codes.gizmo.jawspankration.session.config;

import org.slf4j.MDC;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.context.annotation.ScopedProxyMode.TARGET_CLASS;
import static org.springframework.web.context.WebApplicationContext.SCOPE_REQUEST;

@Component
@Scope(value=SCOPE_REQUEST, proxyMode = TARGET_CLASS)
public class Caller {
    private Map<String, String> contents = new HashMap();
    private String UNKOWN_KEY = "Unknown";

    public void addKey(String key, String value) {
        // Add value to logs
        MDC.put(key, value);
        contents.put(key, value);
    }

    public String getKey(String key) {
        if(contents.containsKey(key)) {
            return contents.get(key);
        }

        return UNKOWN_KEY;
    }

    public void removeKey(String key) {
        if(contents.containsKey(key)) {
            contents.remove(key);
        }
    }
}
