/**
 * Generates a scaled mock dataset (2500 customers) for Customer Churn Analysis.
 * Calibrated to yield a realistic overall churn rate (15-25%) with risk scoring
 * and churn date/month tracking for trend analysis.
 */
function generateChurnData(count = 2500) {
  const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Paul", "Ashley", "George", "Dorothy", "Kenneth", "Emily", "Steven", "Donna", "Edward", "Michelle"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores"];
  
  const contracts = ["Month-to-month", "One year", "Two year"];
  const paymentMethods = ["Electronic check", "Mailed check", "Bank transfer (automatic)", "Credit card (automatic)"];
  const genders = ["Male", "Female"];
  const internetServices = ["DSL", "Fiber optic", "No"];
  
  const churnReasons = {
    "Price": ["Charges were too high", "Price increase", "Competitor offered lower monthly fees", "Hidden administrative fees"],
    "Support": ["Poor service provider response time", "Attitude of support agent", "Technical difficulties unresolved", "Long wait times on support line"],
    "Product": ["Network reliability issues", "Product unsatisfying", "Lack of critical features", "Slow speed limits"],
    "Competitor": ["Competitor offered higher download speeds", "Competitor offered more data", "Moved to competitor promotional offer", "Competitor device upgrade bundle"]
  };

  const data = [];

  for (let i = 0; i < count; i++) {
    const id = `CUST-${2000 + i}`;
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const isSenior = Math.random() < 0.15 ? "Yes" : "No";
    
    // Select contract type
    // 50% Month-to-month, 25% One year, 25% Two year
    const contractRand = Math.random();
    const contract = contractRand < 0.50 ? "Month-to-month" : (contractRand < 0.75 ? "One year" : "Two year");
    
    // Select payment method
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    
    // Select internet service
    const internetService = internetServiceSelector(contract);

    // Support tickets
    let supportTickets = 0;
    const ticketRand = Math.random();
    if (ticketRand < 0.55) {
      supportTickets = 0;
    } else if (ticketRand < 0.85) {
      supportTickets = Math.floor(Math.random() * 2) + 1; // 1 or 2
    } else {
      supportTickets = Math.floor(Math.random() * 4) + 3; // 3 to 6
    }

    // Tenure and charges
    let tenure = 1;
    if (contract === "One year") {
      tenure = Math.floor(Math.random() * 24) + 12; // 12-35 months
    } else if (contract === "Two year") {
      tenure = Math.floor(Math.random() * 36) + 36; // 36-71 months
    } else {
      tenure = Math.floor(Math.random() * 12) + 1; // 1-12 months
    }

    let monthlyCharges = 20.00;
    if (internetService === "DSL") {
      monthlyCharges = parseFloat((40.00 + Math.random() * 25).toFixed(2));
    } else if (internetService === "Fiber optic") {
      monthlyCharges = parseFloat((70.00 + Math.random() * 40).toFixed(2));
    } else {
      monthlyCharges = parseFloat((15.00 + Math.random() * 10).toFixed(2));
    }

    const totalCharges = parseFloat((monthlyCharges * tenure).toFixed(2));

    // Churn Risk and Probability calculation (calibrated for 15-25% average churn rate)
    let churnProbability = 0.03; // Base risk

    if (contract === "Month-to-month") churnProbability += 0.22;
    if (contract === "One year") churnProbability += 0.04;
    if (paymentMethod === "Electronic check") churnProbability += 0.08;
    if (internetService === "Fiber optic") churnProbability += 0.06;
    if (supportTickets === 1) churnProbability += 0.03;
    if (supportTickets === 2) churnProbability += 0.12;
    if (supportTickets >= 3) churnProbability += 0.35;
    if (tenure < 6) churnProbability += 0.10;
    if (tenure > 24) churnProbability -= 0.06;
    if (tenure > 48) churnProbability -= 0.08;

    // Cap probability between 1% and 95%
    churnProbability = Math.max(0.01, Math.min(0.95, churnProbability));
    
    // Determine churn status based on probability
    const churned = Math.random() < churnProbability;
    const churnStatus = churned ? "Yes" : "No";

    // Set Risk Score (0-100)
    // Shift slightly higher for actual churned to align with risk analytics
    let riskScore = Math.round(churnProbability * 100);
    if (churned) {
      riskScore = Math.max(65, Math.round(riskScore + Math.random() * 15));
    } else {
      riskScore = Math.min(64, riskScore);
    }
    riskScore = Math.max(1, Math.min(99, riskScore)); // Keep it clean

    let churnCategory = "";
    let churnReason = "";
    let churnMonth = null; // 1-12 representing months in past year

    if (churned) {
      // Assign churn month (with high churn in certain periods like Q3/Q4 for visual variety)
      const monthRand = Math.random();
      if (monthRand < 0.06) churnMonth = 1;      // Jan
      else if (monthRand < 0.11) churnMonth = 2; // Feb
      else if (monthRand < 0.17) churnMonth = 3; // Mar
      else if (monthRand < 0.22) churnMonth = 4; // Apr
      else if (monthRand < 0.28) churnMonth = 5; // May
      else if (monthRand < 0.35) churnMonth = 6; // Jun
      else if (monthRand < 0.44) churnMonth = 7; // Jul
      else if (monthRand < 0.54) churnMonth = 8; // Aug
      else if (monthRand < 0.65) churnMonth = 9; // Sep
      else if (monthRand < 0.78) churnMonth = 10; // Oct
      else if (monthRand < 0.90) churnMonth = 11; // Nov
      else churnMonth = 12;                      // Dec

      const categories = Object.keys(churnReasons);
      if (supportTickets >= 2 && Math.random() < 0.6) {
        churnCategory = "Support";
      } else if (monthlyCharges > 80 && Math.random() < 0.6) {
        churnCategory = "Price";
      } else {
        churnCategory = categories[Math.floor(Math.random() * categories.length)];
      }
      const reasonsList = churnReasons[churnCategory];
      churnReason = reasonsList[Math.floor(Math.random() * reasonsList.length)];
    }

    data.push({
      customerId: id,
      name,
      email,
      gender,
      isSenior,
      tenure,
      contract,
      paymentMethod,
      internetService,
      monthlyCharges,
      totalCharges,
      supportTickets,
      churnStatus,
      churnCategory,
      churnReason,
      churnProbability,
      riskScore,
      churnMonth
    });
  }

  return data;

  function internetServiceSelector(contract) {
    const rand = Math.random();
    if (contract === "Two year") {
      return rand < 0.45 ? "DSL" : (rand < 0.75 ? "Fiber optic" : "No");
    }
    return rand < 0.25 ? "DSL" : (rand < 0.90 ? "Fiber optic" : "No");
  }
}

if (typeof window !== 'undefined') {
  window.generateChurnData = generateChurnData;
}
