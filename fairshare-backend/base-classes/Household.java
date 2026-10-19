import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import Member;
import Expense; 

public class Household {
    private String id;
    private String name;
    private List<Member> members;
    private List<Expense> expenses;

    public Household(String name) {
        this.id = UUID.randomUUID().toString();
        this.name = name;
        this.members = new ArrayList<>();
        this.expenses = new ArrayList<>();
    }

    //invite
    public void addMember(Member member) {
        if (!members.contains(member)) {
            members.add(member);
        }
    }

    public void addExpense(Expense expense) {
        if (members.contains(expense.getPayer())) {
            expenses.add(expense);
        } else {
            throw new IllegalArgumentException("Expense payer must be an active member of this household.");
        }
    }


    public String getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public List<Member> getMembers() { return members; }
    public List<Expense> getExpenses() { return expenses; }

    @Override
    public String toString() {
        return "Household{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                ", membersCount=" + members.size() +
                ", totalExpenses=" + expenses.size() +
                '}';
    }
}