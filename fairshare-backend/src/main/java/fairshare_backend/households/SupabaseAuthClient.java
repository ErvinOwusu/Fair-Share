package fairshare_backend.households;

import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

@Component
public class SupabaseAuthClient {

    private final RestClient restClient;
    private final String publishableKey;

    public SupabaseAuthClient(RestClient.Builder builder,
            @Value("${supabase.auth.url}") String url,
            @Value("${supabase.auth.publishable-key}") String publishableKey) {
        this.restClient = builder.baseUrl(url).build();
        this.publishableKey = publishableKey;
    }

    public UUID requireUserId(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")
                || authorization.substring(7).isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Supabase access token required");
        }

        try {
            Map<?, ?> user = restClient.get()
                    .uri("/auth/v1/user")
                    .header("apikey", publishableKey)
                    .header("Authorization", authorization)
                    .retrieve()
                    .body(Map.class);
            if (user == null || !(user.get("id") instanceof String id)) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Supabase access token");
            }
            return UUID.fromString(id);
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().is4xxClientError()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Supabase access token");
            }
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Supabase Auth is unavailable");
        } catch (ResourceAccessException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Supabase Auth is unavailable");
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Supabase user ID");
        }
    }
}
