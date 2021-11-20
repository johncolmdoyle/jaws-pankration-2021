package codes.gizmo.jawspankration.session;

import codes.gizmo.jawspankration.session.config.Caller;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/lookup")
public class LookUpController {

    private final Caller caller;


    public LookUpController(Caller caller) {
        this.caller = caller;
    }

    @GetMapping("/{auth0Id}")
    public ResponseEntity<Map<String,String>> getUserId(@PathVariable("auth0Id") String auth0Id) {
        log.info("Entered getUserId.");
        log.info("Parameters: [auth0Id=" + auth0Id+"]");

        // Return our example userId if the auth0Id matches
        if (auth0Id.equalsIgnoreCase("auth0 61992fbea9ee10007183bd09")) {
            HashMap<String, String> response = new HashMap<>();
            response.put("userId", "john");

            return ResponseEntity.ok().body(response);
        }

        // Return 404 if the auth0 ID isn't found.
        return ResponseEntity.notFound().build();
    }
}
