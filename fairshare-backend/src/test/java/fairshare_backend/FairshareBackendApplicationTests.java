package fairshare_backend;

import static org.junit.jupiter.api.Assertions.assertEquals;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class FairshareBackendApplicationTests {

	@Autowired
	private DataSource dataSource;

	@Test
	void contextLoadsAndDatabaseConnectionWorks() throws Exception {
		try (var connection = dataSource.getConnection();
			 var statement = connection.createStatement();
			 var result = statement.executeQuery("SELECT 1")) {
			result.next();
			assertEquals(1, result.getInt(1));
			assertEquals("H2", connection.getMetaData().getDatabaseProductName());
		}
	}

}
