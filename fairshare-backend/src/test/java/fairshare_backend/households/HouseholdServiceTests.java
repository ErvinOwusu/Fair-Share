package fairshare_backend.households;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest
@ActiveProfiles("test")
class HouseholdServiceTests {

    @Autowired HouseholdService householdService;
    @Autowired JdbcTemplate jdbcTemplate;

    @Test
    @Sql("/households-schema.sql")
    void createsHouseholdAndItsOwnerMembership() {
        UUID owner = UUID.randomUUID();
        HouseholdResponse response = householdService.create("  Our Home  ", owner);

        assertEquals("Our Home", response.name());
        assertEquals(owner, response.ownerUserId());
        assertEquals(owner, response.memberUserIds().getFirst());
        assertEquals("Our Home", jdbcTemplate.queryForObject(
                "select name from public.households where id = ?", String.class, response.id()));
        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from public.household_members where household_id = ? and user_id = ?",
                Integer.class, response.id(), owner));
        assertEquals(response.id(), householdService.listForUser(owner).getFirst().id());
        assertEquals(0, householdService.listForUser(UUID.randomUUID()).size());
    }

    @Test
    void rejectsBlankNames() {
        assertThrows(ResponseStatusException.class,
                () -> householdService.create("   ", UUID.randomUUID()));
    }
}
