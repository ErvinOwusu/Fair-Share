package fairshare_backend.households;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record HouseholdResponse(
        UUID id,
        String name,
        UUID ownerUserId,
        List<UUID> memberUserIds,
        Instant createdAt) {
}
