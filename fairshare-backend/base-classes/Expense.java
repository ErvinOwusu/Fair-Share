public static class Expense {
    private String id;
    private String description;
    private double amount; // Total expense amount (updates as shares are paid)
    private Member payer;
    private Map<Member, Double> memberOwedAmounts; // Tracks what each member owes
    private LocalDate date;

    //preconditions: everything but members != null 
    //creates an Expense filling in all values with an arg. memberOwedAmount is divided evenly among members 
    public Expense(String description, double totalAmount, Member payer, List<Member> members) {
        this.id = UUID.randomUUID().toString();
        this.description = description;
        this.amount = totalAmount;
        this.payer = payer;
        this.memberOwedAmounts = new HashMap<>();
        this.date = LocalDate.now();

        // Default to an even split among all members
        if (members != null && !members.isEmpty()) {
            double evenSplit = totalAmount / members.size();
            for (Member member : members) {
                memberOwedAmounts.put(member, evenSplit);
            }
        }
    }

    //alternate constructor if you have non-even split for the start, just plug that in 
    //same preconditions as other constructor, except now every value of members must have both a Member AND Double assigned to it
    public Expense(String description, double totalAmount, Member payer, Map <Member, Double> members) {
        this.id = UUID.randomUUID().toString();
        this.description = description;
        this.amount = totalAmount;
        this.payer = payer;
        if (members != null && !members.isEmpty()){
            this.memberOwedAmounts = members;
        }
        this.date = LocalDate.now();
    }

    //Member pays off x amount from what they owe
    public void payShare(Member member, double paymentAmount) {
        if (!memberOwedAmounts.containsKey(member)) {
            throw new IllegalArgumentException(member.getName() + " is not part of this expense split.");
        }

        double currentOwed = memberOwedAmounts.get(member);
        if (paymentAmount <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero.");
        }
        //can't pay more than owed, must pay what's owed or less
        if (paymentAmount > currentOwed) {
            throw new IllegalArgumentException("Payment amount ($" + paymentAmount + 
                ") exceeds what " + member.getName() + " owes ($" + currentOwed + ").");
        }

        //update member's owed amount
        memberOwedAmounts.put(member, currentOwed - paymentAmount);

        //reduce total expense amount by the same value
        this.amount -= paymentAmount;
    }

    // Getters
    public String getId() { return id; }
    public String getDescription() { return description; }
    public double getAmount() { return amount; }
    public Member getPayer() { return payer; }
    public Map<Member, Double> getMemberOwedAmounts() { return memberOwedAmounts; }
    public LocalDate getDate() { return date; }
}