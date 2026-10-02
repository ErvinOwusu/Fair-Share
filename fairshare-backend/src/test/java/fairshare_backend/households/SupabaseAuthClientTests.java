package fairshare_backend.households;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

class SupabaseAuthClientTests {

    @Test
    void takesIdentityFromSupabaseAuthRatherThanTheRequestBody() {
        UUID userId = UUID.randomUUID();
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(requestTo("https://example.supabase.co/auth/v1/user"))
                .andExpect(header("apikey", "test-key"))
                .andExpect(header("Authorization", "Bearer access-token"))
                .andRespond(withSuccess("{\"id\":\"" + userId + "\"}", MediaType.APPLICATION_JSON));

        SupabaseAuthClient client = new SupabaseAuthClient(builder, "https://example.supabase.co", "test-key");
        assertEquals(userId, client.requireUserId("Bearer access-token"));
        server.verify();
    }

    @Test
    void rejectsRequestsWithoutAnAccessToken() {
        SupabaseAuthClient client = new SupabaseAuthClient(RestClient.builder(),
                "https://example.supabase.co", "test-key");
        assertThrows(ResponseStatusException.class, () -> client.requireUserId(null));
    }
}
