package codes.gizmo.jawspankration.session;

import codes.gizmo.jawspankration.session.config.Caller;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/example")
public class ExampleController {

    private final Caller caller;


    public ExampleController(Caller caller) {
        this.caller = caller;
    }

    @GetMapping
    public ResponseEntity<Map<String, String>> testGetMethod() {
        log.info("Entered testGetMethod.");

        // Return the data pulled from the headers
        HashMap<String, String> response = new HashMap<>();
        response.put("userId", caller.getKey("userId"));
        response.put("auth0Id", caller.getKey("auth0Id"));

        return ResponseEntity.ok().body(response);
    }
}
