package fairshare_backend.auth;

import java.net.URI;
import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class SupabaseConfig {
    @Bean
    RestClient supabaseAuthRestClient(@Value("${supabase.auth.url}") URI url,
                                 @Value("${supabase.auth.publishable-key}") String key) {
        boolean local = "localhost".equals(url.getHost()) || "127.0.0.1".equals(url.getHost());
        if (url.getHost() == null || (!"https".equals(url.getScheme()) && !(local && "http".equals(url.getScheme())))) {
            throw new IllegalArgumentException("SUPABASE_URL must use HTTPS (HTTP allowed for localhost)");
        }
        if (key.isBlank() || key.startsWith("sb_secret_")) {
            throw new IllegalArgumentException("Set SUPABASE_PUBLISHABLE_KEY to the project's publishable key");
        }
        var http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5))
            .followRedirects(HttpClient.Redirect.NEVER).build();
        var requests = new JdkClientHttpRequestFactory(http);
        requests.setReadTimeout(Duration.ofSeconds(10));
        return RestClient.builder().baseUrl(url.toString().replaceAll("/+$", "") + "/auth/v1")
            .requestFactory(requests).defaultHeader("apikey", key).build();
    }
}
